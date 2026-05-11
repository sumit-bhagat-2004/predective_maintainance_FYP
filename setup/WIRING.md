# 🔌 Hardware Wiring & Assembly Guide

> **This file is gitignored.** Stored only locally.
>
> Complete step-by-step wiring guide for connecting all sensors and modules
> to the ESP32. Written for beginners — no prior electronics experience needed.

---

## 📋 Before You Start — What You Need

### Tools Required

| Tool | Purpose | Where to Buy |
|------|---------|-------------|
| Breadboard (830 tie-point) | Temporary connections without soldering | Amazon, Robocraze |
| Jumper wires (M-M, M-F, F-F pack) | Connecting components | Amazon, Robocraze |
| Multimeter | Measuring voltage, checking connections | Amazon (₹300-600) |
| USB cable (Micro-USB) | Power + programming the ESP32 | Any phone shop |

### How to Read This Guide

- **GPIO X** means pin number X on the ESP32
- **VCC** means the power supply pin (usually 3.3V or 5V)
- **GND** means ground (negative terminal, 0V)
- **SDA/SCL** are the two I2C communication wires (data and clock)
- **→** means "connect to"

### The Golden Rule: Common Ground

> ⚠️ **ALL components MUST share the same GND.** 
> Connect all GND pins to the same GND rail on the breadboard.
> Forgetting this is the #1 cause of "nothing works" problems.

---

## 🔋 STEP 1: Set Up Power Rails

Before connecting any sensor, set up your breadboard power rails.

### Understanding Breadboard Power Rails

```
Breadboard (top view):
+  -  |  a b c d e   f g h i j  | +  -
+  -  |  ...many rows...         | +  -

The + column (red) = 3.3V or 5V power
The - column (blue) = GND (ground, 0V)
All the lettered holes in the same row are connected to each other.
```

### Power Rail Setup

Use the ESP32 dev board as your power source for all sensors:

```
ESP32 Pin 3V3  ──→  Red (+) rail on breadboard    [3.3V for all sensors]
ESP32 Pin GND  ──→  Blue (-) rail on breadboard   [Common ground]
```

On the breadboard, put your ESP32 across the center gap so both sides are accessible.

> **Verify with multimeter before connecting anything:**
> Set multimeter to DC Voltage, 20V range.
> Red probe on (+) rail, Black probe on (-) rail.
> Plug ESP32 into USB → should show ~3.28-3.32V.
> If not: check USB cable is power-capable, not charge-only.

---

## 🧠 STEP 2: ESP32 Pin Quick Reference

Use this while wiring:

```
              ESP32-WROOM-32 Pinout
              
         ┌─────────────────────────┐
  3.3V ──┤ 3V3             GND ───┤── GND
  NC   ──┤ EN              GPIO23 ┤
  ADC  ──┤ GPIO36(VP)      GPIO22 ┤── I2C SCL   ← sensors
  ADC  ──┤ GPIO39(VN)      GPIO1  ┤── UART TX
  ADC  ──┤ GPIO34          GPIO3  ┤── UART RX
  ADC  ──┤ GPIO35 ←MIC     GPIO21 ┤── I2C SDA   ← sensors
  I2S  ──┤ GPIO32           GPIO19 ┤
  HX711──┤ GPIO33           GPIO18 ┤
  Motor──┤ GPIO25 ←I2S LRCLK GPIO5 ┤
  Mic  ──┤ GPIO26 ←I2S BCLK GPIO17 ┤── Motor IN2
  DHT22──┤ GPIO27           GPIO16 ┤── Motor IN1
  HX711──┤ GPIO14 ←Motor PWM GPIO4 ┤
         └─────────────────────────┘
```

> Your ESP32 board may label pins differently. The "GPIO XX" numbers are what matter in software.
> Look for small print on the board, or search "ESP32-WROOM-32 pinout" for a clear image.

---

## 📌 STEP 3: I2C Pull-Up Resistors (Do This First!)

The I2C bus (SDA + SCL) needs pull-up resistors to work reliably.

### What You Need
- 2× 4.7kΩ resistors (color code: Yellow-Violet-Red-Gold)

### Wiring

```
3.3V rail ──┬── 4.7kΩ ──→ GPIO 21 (SDA)
            └── 4.7kΩ ──→ GPIO 22 (SCL)
```

On the breadboard:
1. Place one leg of a 4.7kΩ resistor in the (+) red rail
2. Place the other leg in a free hole in the same row as GPIO 21
3. Repeat for the second resistor connecting to GPIO 22

> **Why?** Without pull-ups, I2C signals will float and sensors won't respond.
> Many sensor modules (like the ADXL345 module board) have pull-ups built in.
> Adding extra ones is fine and usually harmless.

---

## 1️⃣ ADXL345 Accelerometer (Vibration Sensor)

**What it does:** Measures vibration and acceleration in X, Y, Z axes at up to 100 Hz.

### Wiring Table

| ADXL345 Pin | Connect To | Notes |
|-------------|-----------|-------|
| VCC (or VDD) | 3.3V rail | ⚠️ Use 3.3V, NOT 5V |
| GND | GND rail | |
| SDA | GPIO 21 | Shared I2C bus |
| SCL | GPIO 22 | Shared I2C bus |
| CS | 3.3V rail | This enables I2C mode (not SPI) |
| SDO | GND rail | Sets I2C address to 0x53 |
| INT1 | (leave unconnected) | Optional interrupt, not needed now |
| INT2 | (leave unconnected) | |

### Physical Placement

Once wired and tested, mount the ADXL345 **directly on the motor casing** for accurate vibration measurement:
- Use double-sided foam tape or epoxy
- Align so the X-axis is parallel to the motor shaft
- Keep sensor wires short (< 30 cm) and away from motor power wires

### Quick Verification Test

Upload this sketch to test if ADXL345 is detected:
```cpp
#include <Wire.h>
void setup() {
  Wire.begin(21, 22);
  Serial.begin(115200);
  Wire.beginTransmission(0x53);
  byte err = Wire.endTransmission();
  if (err == 0) Serial.println("ADXL345 found at 0x53 ✓");
  else Serial.printf("Error: %d — check wiring\n", err);
}
void loop() {}
```

---

## 2️⃣ BMP280 Pressure Sensor

**What it does:** Measures atmospheric pressure, altitude, and temperature.

### Wiring Table

| BMP280 Pin | Connect To | Notes |
|------------|-----------|-------|
| VCC | 3.3V rail | |
| GND | GND rail | |
| SDA | GPIO 21 | Same I2C bus as ADXL345 |
| SCL | GPIO 22 | Same I2C bus as ADXL345 |
| CSB | 3.3V rail | Enables I2C mode |
| SDO | GND rail | Sets address to 0x76 |

> The BMP280 and ADXL345 are on the **same I2C bus** but have **different addresses** (0x53 vs 0x76).
> Both can be connected simultaneously to the same SDA and SCL lines.

---

## 3️⃣ DHT22 Temperature & Humidity Sensor

**What it does:** Measures ambient temperature and humidity near the motor.

### Wiring Table

| DHT22 Pin | Connect To | Notes |
|-----------|-----------|-------|
| Pin 1 (VCC) | 3.3V or 5V rail | Either voltage works |
| Pin 2 (DATA) | GPIO 27 | Also connect 4.7kΩ to VCC |
| Pin 3 | (not connected) | Leave empty |
| Pin 4 (GND) | GND rail | |

### Pull-Up Resistor

```
3.3V rail ──── 4.7kΩ ──── GPIO 27 (DATA)
```

> Many DHT22 module boards already have this resistor. Check your board — if there's a resistor on it, you don't need to add another.

### Placement Tips

- Place the DHT22 **near** the motor but **not touching** the motor casing
- Distance: 5-15 cm from motor is ideal
- Do not place inside an enclosure without ventilation

---

## 4️⃣ INA219 Voltage & Current Monitor

**What it does:** Measures how much voltage and current the motor is drawing.

### Understanding the INA219 Circuit

The INA219 measures current using a **shunt resistor** — it sits **in series** with the power wire to the motor. This means the motor's power wire must pass THROUGH the INA219.

```
Battery (+) ──→ [INA219 IN+] ──→ [INA219 IN-] ──→ L298N motor input (+)
```

### Wiring Table

| INA219 Pin | Connect To | Notes |
|------------|-----------|-------|
| VCC | 5V rail (or 3.3V) | Module's own logic power |
| GND | GND rail | |
| SDA | GPIO 21 | Shared I2C bus |
| SCL | GPIO 22 | Shared I2C bus |
| IN+ | Battery positive terminal | Motor power input side |
| IN- | L298N "12V IN" pin | Motor power output side |

> I2C Address: **0x40** (default — A0 and A1 pins to GND, usually default on module)

> ⚠️ The INA219 logic (SDA, SCL, VCC, GND) is separate from the motor power (IN+, IN-).
> The IN+ and IN- wires carry 12V motor current — use thicker wire (22 AWG minimum).

---

## 5️⃣ HX711 Load Cell Amplifier (Optional)

**What it does:** Reads the weight from a load cell to measure mechanical load on the motor shaft.

> Skip this step if you don't have a load cell or don't need load measurement.
> Set `#define HX711_ENABLED false` in `config.h` to disable in firmware.

### Wiring Table

| HX711 Pin | Connect To | Notes |
|-----------|-----------|-------|
| VCC | 3.3V or 5V rail | |
| GND | GND rail | |
| DOUT | GPIO 32 | Data output |
| SCK | GPIO 33 | Clock |
| E+ | Load cell red wire | Excitation positive |
| E- | Load cell black wire | Excitation negative |
| A+ | Load cell green wire | Signal positive |
| A- | Load cell white wire | Signal negative |

> Load cell wire colors may vary by manufacturer. Check your load cell datasheet.

---

## 6️⃣ INMP441 I2S Microphone

**What it does:** Records audio near the motor to detect acoustic anomalies (bearing squeaks, etc.)

### Wiring Table

| INMP441 Pin | Connect To | Notes |
|------------|-----------|-------|
| VDD (VCC) | 3.3V rail | ⚠️ 3.3V ONLY, not 5V |
| GND | GND rail | |
| BCLK | GPIO 26 | I2S bit clock |
| WS (LRCLK) | GPIO 25 | I2S word select |
| SD (DOUT) | GPIO 35 | I2S data — GPIO 35 is INPUT ONLY, perfect for this |
| L/R | GND rail | Selects left channel |

### Placement

- Mount the microphone **facing the motor**
- Ideal distance: 5-20 cm from the motor
- Use a small piece of foam between the mic and any hard surface to reduce vibration interference

---

## 7️⃣ L298N Motor Driver

**What it does:** Controls the speed and direction of the 775 DC motor.

### Understanding L298N

The L298N has two power inputs:
1. **Logic supply (5V):** Powers the L298N control circuitry
2. **Motor supply (12V):** Powers the actual motor

And three control inputs from ESP32:
1. **ENA:** PWM speed control (0-255)
2. **IN1:** Direction bit A
3. **IN2:** Direction bit B

### Wiring Table

| L298N Pin | Connect To | Notes |
|-----------|-----------|-------|
| GND | Common GND | ⚠️ MUST be same GND as ESP32 |
| 12V (VCC) | 12V battery terminal (+) | Motor power supply |
| 5V output | (optional) Can power ESP32 | Only if not using USB for ESP32 |
| IN1 | GPIO 16 | Direction control A |
| IN2 | GPIO 17 | Direction control B |
| ENA | GPIO 14 | PWM speed — MUST be PWM-capable pin |
| OUT1 | Motor terminal A | Motor wire 1 |
| OUT2 | Motor terminal B | Motor wire 2 |

### Motor Direction Control

| IN1 | IN2 | Motor Result |
|-----|-----|-------------|
| HIGH | LOW | Forward |
| LOW | HIGH | Reverse |
| LOW | LOW | Stop (coast) |
| HIGH | HIGH | Stop (brake) |

### Jumper Settings on L298N Board

Most L298N modules have jumpers:
- **ENA jumper** (near ENA pin): **REMOVE IT** — this allows PWM control via GPIO 14
- **ENB jumper**: Leave it if you're only using one motor

---

## 8️⃣ Final Assembly Checklist

After wiring everything, verify before power-on:

### Power Check
- [ ] ESP32 connected to USB
- [ ] 3.3V rail reads 3.28-3.32V with multimeter
- [ ] All sensor VCC connected to 3.3V rail
- [ ] All GND pins connected to common GND rail
- [ ] 12V motor battery NOT connected yet

### I2C Sensor Check
- [ ] ADXL345: VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22, CS→3.3V, SDO→GND
- [ ] BMP280: VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22, CSB→3.3V, SDO→GND
- [ ] INA219: VCC→5V, GND→GND, SDA→GPIO21, SCL→GPIO22
- [ ] Pull-up resistors on SDA and SCL (4.7kΩ each to 3.3V)

### Other Sensors
- [ ] DHT22: VCC→3.3V, GND→GND, DATA→GPIO27, pull-up on DATA
- [ ] INMP441: VDD→3.3V, GND→GND, BCLK→GPIO26, WS→GPIO25, SD→GPIO35, L/R→GND
- [ ] HX711 (if used): VCC→3.3V, GND→GND, DOUT→GPIO32, SCK→GPIO33

### Motor Driver (Disconnect Battery First!)
- [ ] L298N GND connected to common GND
- [ ] IN1→GPIO16, IN2→GPIO17, ENA→GPIO14
- [ ] ENA jumper removed
- [ ] Motor wires connected to OUT1 and OUT2

### I2C Scanner Test (Run Before Main Firmware)

Upload this sketch to verify all 3 I2C devices are detected:

```cpp
#include <Wire.h>
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  delay(100);
  Serial.println("\nI2C Scanner:");
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Found device at 0x%02X\n", addr);
    }
    delay(5);
  }
  Serial.println("Scan complete.");
}
void loop() {}
```

Expected output:
```
I2C Scanner:
Found device at 0x40    ← INA219
Found device at 0x53    ← ADXL345
Found device at 0x76    ← BMP280
Scan complete.
```

If a device is missing:
1. Check all 4 wires (VCC, GND, SDA, SCL) for that sensor
2. Check CS/SDO/CSB jumper pins on the sensor module
3. Try a different jumper wire (they can go bad)

---

## ⚡ Connecting Motor Power (Do This Last)

Only connect the 12V battery **after** verifying all logic circuitry works with USB power.

1. Double-check L298N GND is connected to common GND
2. Connect 12V battery positive terminal to L298N "12V" input
3. Connect battery negative terminal to common GND
4. Power on — the motor should NOT spin (ENA is 0 by default)
5. Test via Serial Monitor or the dashboard Motor Control page
