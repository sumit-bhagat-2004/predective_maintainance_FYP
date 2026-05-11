# 📊 IoT Predictive Maintenance System - PROJECT SUMMARY

**College Final Year Project | Team of 5 | 14 Weeks | Solar-Powered IoT + ML**

---

## 🎯 PROJECT OVERVIEW

This is a **professional-grade IoT predictive maintenance system** for industrial equipment using:
- **Hardware**: ESP32, ADXL345 (vibration), DHT22 (temperature), INA219 (power), 775 DC motors
- **Software**: Arduino firmware, Python ML (scikit-learn Random Forest), MQTT, Grafana dashboards
- **Approach**: **Simulation-First (Proteus) → Hardware Validation → Fault Simulation → ML Deployment**

---

## 📋 COMPLETE OPTIMIZED COMPONENT LIST

### ✅ **FINAL BOM WITH INDIAN SUPPLIERS**

#### **A. MICROCONTROLLER (₹1,200-1,550)**
| Component | Qty | Price (₹) | Supplier |
|-----------|-----|-----------|----------|
| ESP32-WROOM-32 (dual-core, Wi-Fi, BLE) | 2 | ₹450-550 ea | Amazon, Robocraze |
| FTDI USB FT232RL Programmer | 1 | ₹200-300 | Amazon, Robocraze |
| Micro USB Cable (shielded) | 2 | ₹100-150 | Electronics stores |

#### **B. SENSORS (₹1,050-1,480)**
| Component | Qty | Price (₹) | Supplier | Purpose |
|-----------|-----|-----------|----------|---------|
| ADXL345 3-axis Accelerometer (±16g, 16-bit) | 1 | ₹250-350 | Robocraze | Vibration/imbalance detection |
| DHT22 Temp/Humidity (-40 to 80°C) | 1 | ₹100-150 | Amazon | Overheating detection |
| INA219 Voltage/Current Module (±3.2A) | 2 | ₹200-280 ea | Amazon, Robocraze | Power monitoring |
| INMP441 I2S Digital Mic (16kHz) | 1 | ₹250-350 | Amazon | Acoustic anomaly detection |
| BMP280 Pressure/Altitude Module | 1 | ₹100-150 | Amazon | Environmental data |
| HX711 Load Cell Amplifier (Optional) | 1 | ₹150-200 | Amazon | Mechanical load sensing |

#### **C. POWER & SOLAR (₹3,350-5,000)**
| Component | Qty | Price (₹) | Supplier |
|-----------|-----|-----------|----------|
| Solar Panel 12V 10W Polycrystalline | 1 | ₹800-1,200 | Amazon, Flipkart |
| 12V Lead-Acid Battery 7Ah (SLA/AGM) | 1 | ₹1,000-1,400 | Local battery shop |
| TP4056 USB Charging Module | 1 | ₹50-100 | Amazon |
| 18650 Battery Module 2S2P 7.4V/4Ah (backup) | 1 | ₹300-500 | Amazon |
| USB-C Power Bank 20000mAh | 1 | ₹1,200-1,800 | Flipkart |

#### **D. MOTOR & MECHANICAL (₹2,600-4,600)**
| Component | Qty | Price (₹) | Supplier | Purpose |
|-----------|-----|-----------|----------|---------|
| DC Motor 775 12V (3000-7000 RPM) | 3 | ₹400-600 ea | Amazon, Robocraze | Test: healthy + 2 fault variants |
| L298N Motor Driver (dual, PWM) | 2 | ₹150-250 ea | Amazon | Speed/direction control |
| PWM Speed Controller (optional) | 1 | ₹200-400 | Amazon | Fine-grain control |
| Flexible Coupling & Shaft Adapter | 2 | ₹200-300 | Mechanical shop | Load simulation |
| Ball Bearing 6004-2Z (sealed) | 2 | ₹100-200 | Mechanical shop | Wear simulation |
| Aluminum Frame/Clamps (M5 bolts) | 1 set | ₹400-600 | Hardware store | Mechanical mounting |

#### **E. POWER REGULATION (₹1,790-3,100)**
| Component | Qty | Price (₹) | Supplier |
|-----------|-----|-----------|----------|
| Variable DC Power Supply 0-30V 5A | 1 | ₹1,500-2,500 | Electronics supplier |
| AMS1117 3.3V Regulator Module | 2 | ₹30-50 ea | Amazon, Robocraze |
| Buck Converter 12V→5V 3A | 2 | ₹100-200 ea | Amazon |
| Capacitor Pack (1000µF, 100µF, 10µF) | 1 | ₹50-100 | Local shop |
| Ceramic Capacitor Assortment | 1 | ₹30-60 | Local shop |
| Resistor Pack (10Ω-100kΩ) | 1 | ₹30-60 | Local shop |

#### **F. COMMUNICATION & CONNECTIVITY (₹1,750-3,350)**
| Component | Qty | Price (₹) | Supplier |
|-----------|-----|-----------|----------|
| Wi-Fi Router 2.4GHz | 1 | ₹1,500-3,000 | Flipkart | *Skip if available* |
| USB-to-Serial CH340 Converter | 2 | ₹50-100 ea | Amazon, Robocraze |
| Ethernet CAT6 Cable 5m | 1 | ₹150-250 | IT store |

#### **G. BREADBOARDS & WIRING (₹660-1,220)**
| Component | Qty | Price (₹) | Supplier |
|-----------|-----|-----------|----------|
| Breadboard 830 Tie Points | 2 | ₹100-150 ea | Amazon |
| Jumper Wire Set (M-M, M-F, F-F) | 1 | ₹60-120 | Amazon |
| Hook-up Wire 22 AWG 50m | 1 | ₹150-250 | Electronics shop |
| Soldering Iron 60W + Lead-Free Solder | 1 | ₹300-500 | Electronics shop |
| PCB Prototype Board 7×9cm | 5 | ₹50-100 | Amazon |

#### **H. SOFTWARE (FREE/STUDENT)**
- Arduino IDE (free, open-source)
- Python 3.9+ (free)
- Proteus Design Suite (free student license from Labcenter)
- Jupyter Notebook (free, pip install)
- VS Code (free)
- MQTT Mosquitto (free, open-source)
- Grafana (free, self-hosted)

### 💰 **TOTAL PROJECT BUDGET**
| Category | Min | Max |
|----------|-----|-----|
| Hardware Components | ₹10,900 | ₹20,300 |
| Software Tools | ₹0 | ₹0 |
| **TOTAL** | **₹10,900** | **₹20,300** |

---

## 📅 WEEK-BY-WEEK SCHEDULE (14 WEEKS)

### **PHASE 1: IoT Foundation (Weeks 1-5)**

#### **Week 1: Project Setup & Proteus Circuit Design**
- **Objective**: Establish development environment, design complete circuit in Proteus
- **Team Tasks**:
  - Member 1: Proteus installation, microcontroller schematic (ESP32 + power)
  - Member 2: Sensor modules research, datasheet analysis
  - Member 3: GitHub repository setup, documentation framework
  - Member 4: Power supply design (solar + battery simulation)
  - Member 5: Motor controller circuit design
- **Deliverables**: Proteus schematic (compiles without errors), BOM, component pin-outs
- **Software**: Proteus Design Suite, GitHub Desktop
- **Checkpoint**: ✅ Circuit simulation ready

---

#### **Week 2: Sensor Simulation & I2C Protocol Design**
- **Objective**: Simulate all sensors in Proteus, design communication protocol
- **Key Activities**:
  - Create synthetic vibration signals (healthy + fault conditions) in Python
  - Generate temperature profiles (normal, slow rise, rapid overheat)
  - Simulate power delivery scenarios (voltage sag, load change)
  - Design I2C bus communication sequence
  - Generate virtual oscilloscope captures from Proteus
- **Deliverables**: Synthetic data generator, Proteus sensor simulation, I2C protocol spec
- **Software**: Python (NumPy, SciPy), Proteus analyzer tools
- **Checkpoint**: ✅ Sensor signals match expected patterns

---

#### **Week 3: ESP32 Firmware Development & Serial Communication**
- **Objective**: Write Arduino firmware for sensor reading, test on actual ESP32
- **Key Activities**:
  - Install Arduino IDE + ESP32 board package
  - Implement I2C drivers for ADXL345, DHT22, INA219
  - Write UART serial output (CSV format)
  - Test on actual ESP32 + USB programmer
  - Validate 10 Hz data logging over 60 seconds
- **Deliverables**: Arduino project (.ino), firmware binary, test data log
- **Software**: Arduino IDE, serial monitor
- **Checkpoint**: ✅ ESP32 reads ADXL345 acceleration successfully

---

#### **Week 4: Hardware Assembly & Proteus Validation**
- **Objective**: Assemble physical hardware, validate against Proteus simulation
- **Key Activities**:
  - Mount 775 motor on aluminum frame
  - Affix ADXL345 accelerometer to motor casing
  - Build power supply (battery → buck converter → regulators)
  - Wire sensors on breadboard (I2C connections)
  - Compare hardware vs. Proteus simulation (RMS error analysis)
  - Run 30-minute baseline test (healthy motor)
- **Deliverables**: Assembled hardware, comparison report, baseline data
- **Software**: Multimeter, Python (data comparison), Proteus
- **Checkpoint**: ✅ Hardware & simulation synchronized

---

#### **Week 5: Baseline Data Collection & Feature Extraction**
- **Objective**: Collect 6+ hours of healthy motor data, extract 10+ features
- **Key Activities**:
  - Run Motor-1 (healthy) continuously for 6 hours @ 50% PWM
  - Vary motor speed: 20%, 50%, 100% PWM (30 min each)
  - Extract time-domain features: RMS, peak-to-peak, crest factor, kurtosis
  - Extract frequency-domain features: FFT, band energies (10-50, 50-100, 100-500 Hz)
  - Calculate baseline thresholds (normal, warning, alarm levels)
  - Generate visualization plots (time-series, histograms, FFT spectrum)
- **Deliverables**: 6-hour baseline dataset, feature vectors, threshold CSV, plots (PDF)
- **Software**: Python (NumPy, SciPy, Matplotlib), Jupyter Notebook
- **Checkpoint**: ✅ Baseline established; thresholds calculated

**🎯 PHASE 1 COMPLETE**: IoT foundation ready, baseline data collected

---

### **PHASE 2: ML Model Development (Weeks 6-10)**

#### **Week 6: Imbalance Fault Collection & Feature Analysis**
- **Objective**: Introduce rotor imbalance, collect labeled faulty data
- **Key Activities**:
  - Design imbalance: 5-10g eccentric weight on motor rotor (30-50mm from center)
  - Run Motor-2 (imbalanced) 2 hours @ 50% PWM
  - Extract features (same pipeline as baseline)
  - Compare distributions: healthy vs. imbalanced
  - Document fault signature (RMS ↑ 2-3×, crest factor ↑ 1.5×)
- **Deliverables**: Imbalance dataset, feature comparison plots, fault signature report
- **Checkpoint**: ✅ Imbalance 100% detectable by RMS threshold

---

#### **Week 7: Bearing Fault Simulation & Detectability**
- **Objective**: Introduce bearing wear, validate detection via kurtosis
- **Key Activities**:
  - Create bearing wear: Loosen bearing fit (0.5-1mm radial play) with shims
  - Run Motor-3 (bearing fault) 2 hours @ 50% PWM
  - Capture acoustic data (INMP441 16 kHz sampling)
  - Extract kurtosis (impulsiveness metric): expect ↑ 4-5×
  - Create spectrogram plot showing bearing fault frequencies (1-5 kHz)
- **Deliverables**: Bearing fault dataset, kurtosis analysis, acoustic spectrogram, comparison plots
- **Checkpoint**: ✅ Bearing fault clearly distinguished from imbalance

---

#### **Week 8: Thermal & Power Degradation Faults**
- **Objective**: Simulate remaining fault modes (thermal runaway, power delivery)
- **Key Activities**:
  - **Thermal fault**: Heat motor to 60°C, measure temperature gradient (°C/hour)
  - **Power fault**: Reduce battery voltage (12V → 10V), measure efficiency drop
  - **Multi-fault**: Combine imbalance + thermal (test scenario)
  - Extract features: temperature_gradient, efficiency_loss
  - Build fault decision tree (multi-feature classification)
- **Deliverables**: Thermal dataset, power degradation data, multi-fault scenario, decision tree code
- **Checkpoint**: ✅ 4 distinct fault types fully characterized

---

#### **Week 9: Classical ML Model Training (Scikit-Learn)**
- **Objective**: Train Random Forest, SVM, Logistic Regression classifiers
- **Key Activities**:
  - Consolidate datasets: 43K feature windows (4 fault classes)
  - Train/test split: 80/20, stratified
  - Random Forest: GridSearchCV hyperparameter tuning → >95% accuracy
  - SVM: Scale features, test RBF + poly kernels
  - Logistic Regression: Baseline comparator
  - Generate confusion matrices, feature importance plots
  - Select best model: Random Forest (highest accuracy + reasonable inference time)
- **Deliverables**: Random Forest .pkl model, comparison metrics, feature importance plot
- **Software**: Scikit-learn, Pandas, Matplotlib
- **Checkpoint**: ✅ >95% accuracy on test set

---

#### **Week 10: Deep Learning (Optional) & Final Model Validation**
- **Objective**: Compare CNN to Random Forest, finalize deployment model
- **Key Activities**:
  - Design 1D CNN on raw vibration signals (optional)
  - Perform 5-fold cross-validation (CV score stability)
  - Robustness test: Add noise, verify accuracy >90%
  - Quantize model for ESP32 deployment
  - Model serialization & deployment checklist
- **Deliverables**: CNN model (optional), cross-validation scores, robustness test results, deployment checklist
- **Checkpoint**: ✅ ML model finalized & deployment-ready

**🎯 PHASE 2 COMPLETE**: ML model >95% accuracy, ready for embedded deployment

---

### **PHASE 3: Deployment & Automation (Weeks 11-14)**

#### **Week 11: ESP32 ML Inference & Real-Time Alerts**
- **Objective**: Integrate trained ML model into ESP32 firmware
- **Key Activities**:
  - Implement lightweight feature extraction in C++ (RMS, kurtosis <20ms)
  - Port Random Forest to ESP32 (use microML or TensorFlow Lite library)
  - Write alert generation logic (map predictions to alert levels: Green/Yellow/Red)
  - Implement motor auto-shutdown on RED alert (safety circuit)
  - Test with real data: verify classification consistency
- **Deliverables**: ESP32 firmware with ML inference, alert system code, 1-hour test log
- **Software**: Arduino IDE, PlatformIO
- **Checkpoint**: ✅ Real-time fault detection operational

---

#### **Week 12: Automated Maintenance Reports & Dashboards**
- **Objective**: Generate maintenance reports, create real-time dashboards
- **Key Activities**:
  - Python Flask API: Automated PDF report generation (statistics + recommendations)
  - Grafana dashboard: 6 panels (vibration, temperature, current, fault status, time-to-failure)
  - Predictive scheduler: Estimate days until maintenance (empirical models)
  - MQTT broker setup: Data ingestion pipeline
  - Test dashboard with real data, verify alert triggers
- **Deliverables**: Flask API, PDF report sample, Grafana dashboard JSON, scheduler code
- **Software**: Flask, Grafana, InfluxDB (optional), ReportLab
- **Checkpoint**: ✅ Fully automated alert & report system

---

#### **Week 13: Solar Integration & 48-Hour Reliability Testing**
- **Objective**: Validate solar power + long-duration operation
- **Key Activities**:
  - Install TP4056 charge controller (solar → battery)
  - Measure power consumption: ESP32 (~0.5W) + sensors (0.05W) + motor (18W @ 50%)
  - **48-hour continuous test**: Monitor battery voltage, check for data drops, verify no false positives
  - Fault injection tests: Trigger imbalance, bearing, thermal → verify correct response
  - System stability: No watchdog resets, memory leaks, or MQTT disconnects
- **Deliverables**: Power consumption analysis, 48-hour operation log, fault injection test results
- **Checkpoint**: ✅ System operational 24/7 via solar power

---

#### **Week 14: Final Testing, Documentation & Submission**
- **Objective**: Complete all deliverables, prepare for presentation
- **Key Activities**:
  - Code cleanup: Remove debug prints, optimize firmware
  - Final testing checklist: All sensors, alerts, auto-shutdown verified
  - Write technical report (30-40 pages): Design choices, results, lessons learned
  - Create video demo (4-5 min): Hardware walkthrough, live fault detection, dashboard
  - Prepare presentation slides (15-20 slides) + practice dry-run
  - Organize GitHub repo with README, contributing guide, examples
- **Deliverables**: 
  - Technical report (PDF, 30-40 pages)
  - Video demonstration (MP4, 1080p)
  - Presentation slides (PDF)
  - GitHub repository (fully documented)
  - User manual & troubleshooting guide
  - BOM & supplier links (Excel)
  - Hardware schematics & wiring diagrams
- **Checkpoint**: ✅ Project complete & submission-ready

**🎯 PHASE 3 COMPLETE**: Full system deployed, documented, ready for handover

---

## 🎯 MAJOR MILESTONES

| Week | Milestone | Verification |
|------|-----------|--------------|
| **Week 5** | ✅ IoT Foundation | Proteus circuit + hardware baseline |
| **Week 10** | ✅ ML Model Ready | >95% accuracy, validated |
| **Week 11** | ✅ Embedded ML | Real-time inference on ESP32 |
| **Week 12** | ✅ Automation | Reports & dashboards functional |
| **Week 13** | ✅ Solar Validation | 48-hour continuous operation |
| **Week 14** | ✅ Project Complete | All deliverables finalized |

---

## 📦 FINAL DELIVERABLES CHECKLIST

### **Hardware**
- [ ] Assembled test rig (motor + sensors + solar + battery)
- [ ] Component list (BOM with suppliers)
- [ ] Wiring diagrams & PCB layout (PDF)

### **Software**
- [ ] ESP32 firmware (.ino project)
- [ ] Feature extraction (Python)
- [ ] Random Forest model (.pkl file, >95% accuracy)
- [ ] MQTT server (Mosquitto config)
- [ ] Grafana dashboard (JSON export)

### **Documentation**
- [ ] Technical report (30-40 pages, PDF)
- [ ] User manual (PDF)
- [ ] Component specifications guide (markdown)
- [ ] GitHub README & contributing guide
- [ ] BOM & suppliers spreadsheet

### **Demonstration**
- [ ] Video walkthrough (4-5 min, 1080p)
- [ ] Presentation slides (15-20 slides, PDF)
- [ ] Live hardware demo (ready for in-class presentation)
- [ ] Test results & 48-hour operation log

---

## 💡 KEY TECHNICAL INSIGHTS

### **Why This Architecture?**
- **ESP32**: Dual-core allows concurrent sensor reading + Wi-Fi transmission
- **ADXL345 + DHT22 + INA219**: Covers mechanical (vibration), thermal, and electrical fault modes
- **Random Forest**: >95% accuracy, lightweight (<2MB), fast inference (~1ms)
- **Solar + Battery**: Real-world IoT deployment, 24/7 operation
- **Proteus-First**: Catch firmware bugs before physical testing

### **Fault Detection Strategy**
1. **Imbalance**: High RMS (time-domain), clear 1× shaft frequency peak (FFT)
2. **Bearing wear**: High kurtosis (statistical), impulsive 1-5 kHz noise (acoustic)
3. **Thermal runaway**: Temperature gradient >0.02 °C/sec (trend analysis)
4. **Power degradation**: Efficiency drop while total power stable

### **Data-Driven ML**
- 43K labeled feature windows (4 fault classes, balanced)
- 10 engineered features (RMS, peak-to-peak, crest factor, kurtosis, spectral bands)
- 5-fold cross-validation confirms generalization
- Robustness tested on noisy data (>90% accuracy)

---

## 🚨 RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Sensor unavailable | Order alternatives (e.g., MPU6050 vs ADXL345) |
| Low ML accuracy | Collect more diverse fault data, try ensemble voting |
| Proteus ≠ hardware | Debug with oscilloscope, add noise filters |
| Solar power insufficient | Use AC backup charger, optimize power consumption |
| Team member absent | Cross-trained members can pick up tasks |

---

## 📊 SUCCESS METRICS

| Metric | Target | Expected |
|--------|--------|----------|
| ML Test Accuracy | >95% | ✅ Achievable |
| Fault Detection Latency | <2 min | ✅ Achievable |
| System Uptime (48h test) | >99.5% | ✅ Achievable |
| False Alarm Rate | <1% | ✅ Achievable |
| Report Automation | Fully automated | ✅ Planned |
| Documentation | 40+ pages | ✅ Planned |

---

## 🔗 USEFUL RESOURCES

**Hardware Datasheets**:
- ESP32: https://www.espressif.com
- ADXL345: https://www.analog.com/adxl345
- DHT22: https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf

**Software Libraries**:
- Arduino ADXL345: https://github.com/adafruit/Adafruit_ADXL345
- Python Scikit-learn: https://scikit-learn.org
- MQTT Paho: https://github.com/eclipse/paho.mqtt.python

**Tutorials**:
- Random Nerd Tutorials (ESP32): https://randomnerdtutorials.com
- Grafana Dashboard: https://grafana.com/docs/grafana/latest/dashboards/

---

**Document Generated**: January 2026  
**Total Effort**: 280-350 person-hours (5 people × 14 weeks @ 4 hours/day)  
**Budget**: ₹10,900-20,300 (hardware) + ₹0 (free software)  

**Ready for Final Year Submission! 🎓**
