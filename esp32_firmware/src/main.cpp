// ============================================================
// main.cpp — ESP32 Predictive Maintenance Firmware
// Phase 1: All sensors → AWS IoT Core via MQTT over TLS
//
// Architecture:
//   Core 0 (App CPU):   Sensor reading, feature computation, I2S audio
//   Core 1 (Proto CPU): Wi-Fi, MQTT connection, message publishing
//
// Data flow:
//   Sensors → circular buffers → JSON payload → MQTT → AWS IoT Core
// ============================================================

#include <Arduino.h>
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <MQTT.h>
#include <NTPClient.h>
#include <WiFiUDP.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <math.h>

// Sensor libraries
#include <Adafruit_ADXL345_U.h>
#include <Adafruit_BMP280.h>
#include <DHT.h>
#include <Adafruit_INA219.h>
#include <HX711.h>

#include "config.h"
#include "secrets.h"   // WiFi + AWS credentials (gitignored)

// ============================================================
// GLOBALS
// ============================================================

// --- Sensor objects ---
Adafruit_ADXL345_Unified accel(12345);
Adafruit_BMP280          bmp;
DHT                      dht(DHT_PIN, DHT_TYPE);
Adafruit_INA219          ina219(INA219_ADDR);
HX711                    hx711;

// --- AWS IoT / MQTT ---
WiFiClientSecure  netClient;
MQTTClient        mqttClient(4096);   // 4 KB buffer for JSON payloads

// --- NTP ---
WiFiUDP    ntpUDP;
NTPClient  timeClient(ntpUDP, NTP_SERVER, NTP_OFFSET_S, 60000);

// --- FreeRTOS ---
SemaphoreHandle_t sensorDataMutex;
TaskHandle_t      sensorTaskHandle;
TaskHandle_t      mqttTaskHandle;

// ---- Motor state ----
volatile uint8_t  motorPWM       = 0;
volatile bool     motorForward   = true;
volatile bool     motorRunning   = false;

// ---- Shared sensor snapshot (protected by mutex) ----
struct SensorSnapshot {
    // ADXL345
    float accel_x, accel_y, accel_z;
    float accel_rms;
    // BMP280
    float pressure, altitude, bmp_temp;
    // DHT22
    float temperature, humidity;
    // INA219
    float voltage, current_mA, power_W;
    // HX711
    float load_g;
    // I2S Audio features
    float audio_rms;
    float audio_peak;
    // Motor
    uint8_t motor_pwm;
    bool    motor_forward;
    // Timestamp
    unsigned long timestamp_ms;
    uint64_t      epoch_ms;
};

SensorSnapshot snapshot;

// ---- Vibration buffer (ring, 100 samples × 3 axes) ----
#define VIBRATION_BUF_SIZE 100
struct AccelSample { float x, y, z; };
AccelSample vibBuf[VIBRATION_BUF_SIZE];
volatile int vibBufHead = 0;

// ---- Audio feature ring (2 slots, ping-pong) ----
volatile float audioRms  = 0.0f;
volatile float audioPeak = 0.0f;

// ============================================================
// UTILITY MACROS
// ============================================================
#if DEBUG_ENABLED
  #define DBG(x)   Serial.print(x)
  #define DBGLN(x) Serial.println(x)
  #define DBGF(...)Serial.printf(__VA_ARGS__)
#else
  #define DBG(x)
  #define DBGLN(x)
  #define DBGF(...)
#endif

// ============================================================
// MOTOR CONTROL
// ============================================================
void motorSetup() {
    ledcSetup(MOTOR_PWM_CHAN, MOTOR_PWM_FREQ, MOTOR_PWM_RES);
    ledcAttachPin(MOTOR_ENA_PIN, MOTOR_PWM_CHAN);
    pinMode(MOTOR_IN1_PIN, OUTPUT);
    pinMode(MOTOR_IN2_PIN, OUTPUT);
    // Start stopped
    ledcWrite(MOTOR_PWM_CHAN, 0);
    digitalWrite(MOTOR_IN1_PIN, LOW);
    digitalWrite(MOTOR_IN2_PIN, LOW);
}

void motorWrite(uint8_t pwm, bool forward) {
    motorPWM     = pwm;
    motorForward = forward;
    motorRunning = (pwm > 0);

    ledcWrite(MOTOR_PWM_CHAN, pwm);
    if (pwm == 0) {
        digitalWrite(MOTOR_IN1_PIN, LOW);
        digitalWrite(MOTOR_IN2_PIN, LOW);
    } else if (forward) {
        digitalWrite(MOTOR_IN1_PIN, HIGH);
        digitalWrite(MOTOR_IN2_PIN, LOW);
    } else {
        digitalWrite(MOTOR_IN1_PIN, LOW);
        digitalWrite(MOTOR_IN2_PIN, HIGH);
    }
}

// ============================================================
// I2S MICROPHONE (INMP441) SETUP
// ============================================================
void i2sSetup() {
    i2s_config_t i2s_config = {
        .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate          = I2S_SAMPLE_RATE,
        .bits_per_sample      = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format       = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count        = 8,
        .dma_buf_len          = I2S_BUF_LEN,
        .use_apll             = false,
        .tx_desc_auto_clear   = false,
        .fixed_mclk           = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num   = I2S_BCLK_PIN,
        .ws_io_num    = I2S_LRCLK_PIN,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num  = I2S_DOUT_PIN
    };

    i2s_driver_install(I2S_NUM, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM, &pin_config);
    DBGLN("[I2S] INMP441 microphone initialized");
}

// Compute RMS and peak from a buffer of I2S samples
void readAudioFeatures() {
    static int16_t samples[I2S_BUF_LEN];
    size_t bytes_read = 0;

    esp_err_t ret = i2s_read(I2S_NUM, (void*)samples,
                              sizeof(samples), &bytes_read, pdMS_TO_TICKS(50));
    if (ret != ESP_OK || bytes_read == 0) return;

    int count = bytes_read / sizeof(int16_t);
    double sumSq  = 0.0;
    int16_t pk    = 0;

    for (int i = 0; i < count; i++) {
        int16_t s = samples[i];
        sumSq += (double)s * s;
        if (abs(s) > abs(pk)) pk = s;
    }

    audioRms  = (float)sqrt(sumSq / count);
    audioPeak = (float)abs(pk);
}

// ============================================================
// SENSOR READING TASK (Core 0)
// ============================================================
void sensorTask(void* pvParams) {
    // --- Init sensors ---
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, I2C_FREQ_HZ);

    // ADXL345
    if (!accel.begin(ADXL345_ADDR)) {
        DBGLN("[ERROR] ADXL345 not found! Check wiring.");
    } else {
        accel.setRange(ADXL_RANGE);
        accel.setDataRate(ADXL_SAMPLE_RATE);
        DBGLN("[OK] ADXL345 initialized");
    }

    // BMP280
    if (!bmp.begin(BMP280_ADDR)) {
        DBGLN("[ERROR] BMP280 not found! Check wiring.");
    } else {
        bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                        Adafruit_BMP280::SAMPLING_X2,
                        Adafruit_BMP280::SAMPLING_X16,
                        Adafruit_BMP280::FILTER_X16,
                        Adafruit_BMP280::STANDBY_MS_500);
        DBGLN("[OK] BMP280 initialized");
    }

    // DHT22
    dht.begin();
    DBGLN("[OK] DHT22 initialized");

    // INA219
    if (!ina219.begin()) {
        DBGLN("[ERROR] INA219 not found! Check wiring.");
    } else {
        ina219.setCalibration_16V_400mA();
        DBGLN("[OK] INA219 initialized");
    }

    // HX711
    if (HX711_ENABLED) {
        hx711.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
        hx711.set_scale(HX711_SCALE);
        hx711.set_offset(HX711_OFFSET);
        hx711.tare();
        DBGLN("[OK] HX711 initialized");
    }

    // I2S Mic
    i2sSetup();

    // --- Timing ---
    TickType_t lastSensorTick = xTaskGetTickCount();
    TickType_t lastVibTick    = xTaskGetTickCount();

    while (true) {
        TickType_t now = xTaskGetTickCount();

        // ---- Fast loop: ADXL345 @ 100 Hz ----
        if ((now - lastVibTick) * portTICK_PERIOD_MS >= VIBRATION_BURST_MS) {
            lastVibTick = now;
            sensors_event_t event;
            accel.getEvent(&event);
            int idx = vibBufHead % VIBRATION_BUF_SIZE;
            vibBuf[idx] = { event.acceleration.x,
                            event.acceleration.y,
                            event.acceleration.z };
            vibBufHead++;
        }

        // ---- Slow loop: all other sensors @ 1 Hz ----
        if ((now - lastSensorTick) * portTICK_PERIOD_MS >= SENSOR_READ_INTERVAL_MS) {
            lastSensorTick = now;

            // Read all slow sensors
            float t    = dht.readTemperature();
            float h    = dht.readHumidity();
            float p    = bmp.readPressure() / 100.0f;   // hPa
            float alt  = bmp.readAltitude(1013.25f);
            float btmp = bmp.readTemperature();
            float volt = ina219.getBusVoltage_V();
            float curr = ina219.getCurrent_mA();
            float pwr  = volt * (curr / 1000.0f);
            float load = HX711_ENABLED ? hx711.get_units(3) : 0.0f;

            // Compute vibration RMS from buffer snapshot
            float sumSq = 0.0f;
            int   count = (vibBufHead < VIBRATION_BUF_SIZE) ? vibBufHead : VIBRATION_BUF_SIZE;
            for (int i = 0; i < count; i++) {
                float m = vibBuf[i].x * vibBuf[i].x
                        + vibBuf[i].y * vibBuf[i].y
                        + vibBuf[i].z * vibBuf[i].z;
                sumSq += m;
            }
            float rms = (count > 0) ? sqrt(sumSq / count) : 0.0f;

            // Read audio features from INMP441
            readAudioFeatures();

            // Update shared snapshot
            if (xSemaphoreTake(sensorDataMutex, pdMS_TO_TICKS(20)) == pdTRUE) {
                snapshot.accel_x     = vibBuf[(vibBufHead - 1 + VIBRATION_BUF_SIZE) % VIBRATION_BUF_SIZE].x;
                snapshot.accel_y     = vibBuf[(vibBufHead - 1 + VIBRATION_BUF_SIZE) % VIBRATION_BUF_SIZE].y;
                snapshot.accel_z     = vibBuf[(vibBufHead - 1 + VIBRATION_BUF_SIZE) % VIBRATION_BUF_SIZE].z;
                snapshot.accel_rms   = rms;
                snapshot.pressure    = isnan(p)   ? 0.0f : p;
                snapshot.altitude    = isnan(alt) ? 0.0f : alt;
                snapshot.bmp_temp    = isnan(btmp)? 0.0f : btmp;
                snapshot.temperature = isnan(t)   ? -999.0f : t;
                snapshot.humidity    = isnan(h)   ? -999.0f : h;
                snapshot.voltage     = volt;
                snapshot.current_mA  = curr;
                snapshot.power_W     = pwr;
                snapshot.load_g      = load;
                snapshot.audio_rms   = audioRms;
                snapshot.audio_peak  = audioPeak;
                snapshot.motor_pwm      = motorPWM;
                snapshot.motor_forward  = motorForward;
                snapshot.timestamp_ms   = millis();
                snapshot.epoch_ms       = (uint64_t)timeClient.getEpochTime() * 1000ULL;
                xSemaphoreGive(sensorDataMutex);
            }

            DBGF("[SENSORS] T=%.1f°C H=%.1f%% P=%.1fhPa V=%.2fV I=%.1fmA RMS=%.3f\n",
                 t, h, p, volt, curr, rms);
        }

        vTaskDelay(pdMS_TO_TICKS(5));  // yield
    }
}

// ============================================================
// MQTT MESSAGE HANDLER (commands from backend)
// ============================================================
void mqttMessageHandler(String& topic, String& payload) {
    DBGF("[MQTT] Rx: %s → %s\n", topic.c_str(), payload.c_str());

    if (topic == TOPIC_CMD_MOTOR) {
        StaticJsonDocument<128> doc;
        if (deserializeJson(doc, payload) == DeserializationError::Ok) {
            uint8_t pwm   = doc["pwm"]     | 0;
            bool    fwd   = doc["forward"] | true;
            motorWrite(pwm, fwd);
            DBGF("[MOTOR] CMD: pwm=%d forward=%d\n", pwm, fwd);
        }
    }
}

// ============================================================
// WIFI + MQTT CONNECT
// ============================================================
void connectWiFi() {
    DBGF("[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        DBG(".");
    }
    DBGLN("");
    DBGF("[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
}

void connectMQTT() {
    netClient.setCACert(AWS_ROOT_CA);
    netClient.setCertificate(DEVICE_CERT);
    netClient.setPrivateKey(DEVICE_PRIVATE_KEY);

    mqttClient.begin(AWS_IOT_ENDPOINT, AWS_IOT_PORT, netClient);
    mqttClient.onMessage(mqttMessageHandler);

    DBGF("[MQTT] Connecting to AWS IoT as %s...", AWS_THING_NAME);
    int retry = 0;
    while (!mqttClient.connect(AWS_THING_NAME)) {
        DBG(".");
        delay(1000);
        if (++retry > 20) {
            DBGLN("\n[MQTT] Failed! Restarting...");
            ESP.restart();
        }
    }
    DBGLN("\n[MQTT] Connected!");
    mqttClient.subscribe(TOPIC_CMD_MOTOR);
    DBGF("[MQTT] Subscribed to %s\n", TOPIC_CMD_MOTOR);
}

// ============================================================
// MQTT PUBLISH HELPERS
// ============================================================
bool publishSensors(const SensorSnapshot& s) {
    StaticJsonDocument<512> doc;

    doc["ts"]          = (unsigned long long)s.epoch_ms;
    doc["ts_ms"]       = s.timestamp_ms;

    JsonObject vib     = doc.createNestedObject("vibration");
    vib["x"]           = round(s.accel_x  * 1000.0f) / 1000.0f;
    vib["y"]           = round(s.accel_y  * 1000.0f) / 1000.0f;
    vib["z"]           = round(s.accel_z  * 1000.0f) / 1000.0f;
    vib["rms"]         = round(s.accel_rms * 1000.0f) / 1000.0f;

    JsonObject env     = doc.createNestedObject("environment");
    env["temp_c"]      = round(s.temperature * 10.0f) / 10.0f;
    env["humidity_pct"]= round(s.humidity    * 10.0f) / 10.0f;
    env["pressure_hpa"]= round(s.pressure    * 10.0f) / 10.0f;
    env["altitude_m"]  = round(s.altitude    * 10.0f) / 10.0f;
    env["bmp_temp_c"]  = round(s.bmp_temp    * 10.0f) / 10.0f;

    JsonObject pwr     = doc.createNestedObject("power");
    pwr["voltage_v"]   = round(s.voltage     * 100.0f) / 100.0f;
    pwr["current_ma"]  = round(s.current_mA  * 10.0f)  / 10.0f;
    pwr["power_w"]     = round(s.power_W     * 100.0f) / 100.0f;

    doc["load_g"]      = round(s.load_g * 10.0f) / 10.0f;

    JsonObject aud     = doc.createNestedObject("audio");
    aud["rms"]         = round(s.audio_rms  * 10.0f) / 10.0f;
    aud["peak"]        = round(s.audio_peak * 10.0f) / 10.0f;

    JsonObject mot     = doc.createNestedObject("motor");
    mot["pwm"]         = s.motor_pwm;
    mot["forward"]     = s.motor_forward;
    mot["duty_pct"]    = (int)((s.motor_pwm / 255.0f) * 100.0f);

    String payload;
    serializeJson(doc, payload);
    return mqttClient.publish(TOPIC_SENSORS, payload, false, 0);
}

bool publishVibrationBurst() {
    // Send current vibration buffer as array
    StaticJsonDocument<2048> doc;
    doc["ts"] = (unsigned long long)(timeClient.getEpochTime() * 1000ULL);
    JsonArray arr = doc.createNestedArray("samples");

    int start = (vibBufHead - VIBRATION_BUF_SIZE > 0) ? vibBufHead - VIBRATION_BUF_SIZE : 0;
    for (int i = start; i < vibBufHead && i < start + VIBRATION_BUF_SIZE; i++) {
        JsonObject s = arr.createNestedObject();
        s["x"] = round(vibBuf[i % VIBRATION_BUF_SIZE].x * 1000.0f) / 1000.0f;
        s["y"] = round(vibBuf[i % VIBRATION_BUF_SIZE].y * 1000.0f) / 1000.0f;
        s["z"] = round(vibBuf[i % VIBRATION_BUF_SIZE].z * 1000.0f) / 1000.0f;
    }

    String payload;
    serializeJson(doc, payload);
    return mqttClient.publish(TOPIC_VIBRATION, payload, false, 0);
}

bool publishStatus() {
    StaticJsonDocument<128> doc;
    doc["ts"]          = (unsigned long long)(timeClient.getEpochTime() * 1000ULL);
    doc["uptime_s"]    = millis() / 1000;
    doc["free_heap"]   = ESP.getFreeHeap();
    doc["wifi_rssi"]   = WiFi.RSSI();
    doc["thing"]       = AWS_THING_NAME;
    String payload;
    serializeJson(doc, payload);
    return mqttClient.publish(TOPIC_STATUS, payload, false, 0);
}

// ============================================================
// MQTT + PUBLISH TASK (Core 1)
// ============================================================
void mqttTask(void* pvParams) {
    // Connect to Wi-Fi and AWS IoT
    connectWiFi();

    timeClient.begin();
    timeClient.update();
    DBGF("[NTP] Time: %s\n", timeClient.getFormattedTime().c_str());

    connectMQTT();
    motorSetup();

    TickType_t lastPublish    = xTaskGetTickCount();
    TickType_t lastVibPublish = xTaskGetTickCount();
    TickType_t lastHeartbeat  = xTaskGetTickCount();

    while (true) {
        // Keep MQTT alive
        if (!mqttClient.connected()) {
            DBGLN("[MQTT] Reconnecting...");
            connectMQTT();
        }
        mqttClient.loop();
        timeClient.update();

        TickType_t now = xTaskGetTickCount();

        // Publish sensor data @ 1 Hz
        if ((now - lastPublish) * portTICK_PERIOD_MS >= SENSOR_READ_INTERVAL_MS) {
            lastPublish = now;
            SensorSnapshot s;
            if (xSemaphoreTake(sensorDataMutex, pdMS_TO_TICKS(50)) == pdTRUE) {
                s = snapshot;
                xSemaphoreGive(sensorDataMutex);
            }
            if (!publishSensors(s)) {
                DBGLN("[MQTT] Publish sensors failed");
            }
        }

        // Publish vibration burst @ 1 Hz (100 samples batch)
        if ((now - lastVibPublish) * portTICK_PERIOD_MS >= VIBRATION_PUBLISH_MS) {
            lastVibPublish = now;
            publishVibrationBurst();
        }

        // Heartbeat @ 30s
        if ((now - lastHeartbeat) * portTICK_PERIOD_MS >= HEARTBEAT_INTERVAL_MS) {
            lastHeartbeat = now;
            publishStatus();
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

// ============================================================
// SETUP & LOOP
// ============================================================
void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(500);
    DBGLN("\n==============================");
    DBGLN(" IoT Predictive Maintenance");
    DBGLN(" Phase 1 Firmware v1.0");
    DBGLN("==============================\n");

    sensorDataMutex = xSemaphoreCreateMutex();

    // Sensor task → Core 0
    xTaskCreatePinnedToCore(
        sensorTask,
        "SensorTask",
        8192,           // stack size
        NULL,
        2,              // priority (higher = more urgent)
        &sensorTaskHandle,
        0               // Core 0
    );

    // MQTT task → Core 1
    xTaskCreatePinnedToCore(
        mqttTask,
        "MQTTTask",
        16384,          // larger stack for TLS + JSON
        NULL,
        1,
        &mqttTaskHandle,
        1               // Core 1
    );
}

void loop() {
    // Both tasks run independently on FreeRTOS.
    // loop() is intentionally empty — work is done in tasks.
    vTaskDelay(portMAX_DELAY);
}
