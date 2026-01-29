# AI Engine - SentinelShield AI

Machine learning models and threat detection algorithms.

## Components

### 1. Threat Detection Engine (`threat_detector.py`)
- Isolation Forest for anomaly detection
- Velocity-based scoring
- Risk score calculation: R = (AnomalyScore × 0.6) + (VelocityWeight × 0.4)
- Real-time feature extraction

### 2. Feedback Loop (`feedback_loop.py`)
- Collects analyst corrections to AI classifications
- Triggers model retraining when threshold is reached
- Tracks retraining jobs
- Exports training data

## Usage

```python
from src.threat_detector import get_threat_detection_engine

# Get the engine
engine = get_threat_detection_engine()

# Train on historical data
engine.train(threat_logs)

# Predict on new data
prediction = engine.predict(threat_log)
print(prediction)
# Output: {
#   'anomaly_score': 0.85,
#   'velocity_weight': 0.3,
#   'risk_score': 0.69,
#   'is_anomaly': True
# }
```

## Model Details

### Features
- Response time (milliseconds)
- HTTP status code
- Time of day (hour)
- Day of week
- User agent length
- IP reputation score

### Training
Requires minimum 10 samples for model training.

### Retraining
Model is automatically retrained when 100+ feedback samples are collected.
