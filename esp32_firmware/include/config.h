#pragma once
// ============================================================
// config.h — Hardware pin assignments & compile-time settings
// ============================================================
// AWS secrets are stored in secrets.h (gitignored).
// Copy secrets.h.example → secrets.h and fill in your values.
// ============================================================

// ---- Wi-Fi ----
// These are defined in secrets.h (gitignored)
// #define WIFI_SSID     "YourSSID"
// #define WIFI_PASSWORD "YourPassword"

// ---- AWS IoT Core ----
// Endpoint from: aws iot describe-endpoint --endpoint-type iot:Data-ATS
// #define AWS_IOT_ENDPOINT "xxxxxxxxxxxx-ats.iot.ap-south-1.amazonaws.com"
// #define AWS_IOT_PORT     8883
// #define AWS_THING_NAME   "ESP32-PredMaint"

// ---- MQTT Topics ----
#define TOPIC_SENSORS    "predictive-maintenance/esp32/sensors"
#define TOPIC_VIBRATION  "predictive-maintenance/esp32/vibration"
#define TOPIC_AUDIO      "predictive-maintenance/esp32/audio"
#define TOPIC_MOTOR      "predictive-maintenance/esp32/motor"
#define TOPIC_STATUS     "predictive-maintenance/esp32/status"
#define TOPIC_CMD_MOTOR  "predictive-maintenance/esp32/cmd/motor"

// ---- I2C Bus ----
#define I2C_SDA_PIN  21
#define I2C_SCL_PIN  22
#define I2C_FREQ_HZ  400000   // 400 kHz fast mode

// ---- ADXL345 Accelerometer ----
#define ADXL345_ADDR     0x53  // SDO → GND = 0x53; SDO → VCC = 0x1D
#define ADXL_SAMPLE_RATE ADXL345_DATARATE_100_HZ
#define ADXL_RANGE       ADXL345_RANGE_16_G

// ---- BMP280 Pressure Sensor ----
#define BMP280_ADDR  0x76     // SDO → GND = 0x76; SDO → VCC = 0x77

// ---- INA219 Current/Voltage Monitor ----
#define INA219_ADDR  0x40     // A0=GND, A1=GND = 0x40

// ---- DHT22 Temperature/Humidity ----
#define DHT_PIN      27
#define DHT_TYPE     DHT11

// ---- HX711 Load Cell Amplifier ----
#define HX711_DOUT_PIN  32
#define HX711_SCK_PIN   33
#define HX711_ENABLED   true       // set false if no load cell attached
#define HX711_SCALE     2280.0f    // calibrate to your load cell (g)
#define HX711_OFFSET    -47000     // zero offset after calibration

// ---- INMP441 I2S Microphone ----
#define I2S_NUM         I2S_NUM_0
#define I2S_BCLK_PIN    26
#define I2S_LRCLK_PIN   25
#define I2S_DOUT_PIN    35
#define I2S_SAMPLE_RATE 16000
#define I2S_BUF_LEN     512        // samples per read
#define AUDIO_FFT_SIZE  512

// ---- L298N Motor Driver ----
#define MOTOR_ENA_PIN   14    // PWM speed (use LEDC channel)
#define MOTOR_IN1_PIN   16    // Direction A
#define MOTOR_IN2_PIN   17    // Direction B
#define MOTOR_PWM_CHAN  0     // LEDC channel
#define MOTOR_PWM_FREQ  1000  // Hz
#define MOTOR_PWM_RES   8     // bits (0-255)

// ---- Sampling Rates ----
#define SENSOR_READ_INTERVAL_MS  1000   // All slow sensors: 1 Hz
#define VIBRATION_BURST_MS       10     // ADXL345: 100 Hz = 10ms
#define VIBRATION_PUBLISH_MS     1000   // Publish vibration batch every 1s
#define HEARTBEAT_INTERVAL_MS    30000  // Status heartbeat every 30s

// ---- NTP ----
#define NTP_SERVER    "pool.ntp.org"
#define NTP_OFFSET_S  19800   // IST = UTC+5:30 = 5.5×3600

// ---- Serial Debug ----
#define SERIAL_BAUD   115200
#define DEBUG_ENABLED true    // set false for production
