"""
Threat Detection Engine for SentinelShield AI
Implements Isolation Forest for anomaly detection with risk scoring
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import joblib
import logging

logger = logging.getLogger(__name__)

class ThreatDetectionEngine:
    """
    Real-time threat detection using Isolation Forest
    Risk Score Formula: R = (AnomalyScore × 0.6) + (VelocityWeight × 0.4)
    """
    
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        """
        Initialize the threat detection engine
        
        Args:
            contamination: Expected proportion of outliers (0.05-0.2)
            random_state: Random seed for reproducibility
        """
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
            max_samples='auto'
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = []
        self.velocity_cache = {}  # Cache for velocity calculations
        
    def extract_features(self, threat_log: Dict) -> np.ndarray:
        """
        Extract features from a threat log entry
        
        Features:
        - Response time (ms)
        - Status code (categorical encoded)
        - Time of day (hour)
        - Day of week
        - Previous actions count in time window
        """
        features = []
        
        # Response time
        response_time = threat_log.get('response_time_ms', 0)
        features.append(float(response_time))
        
        # Status code (categorical)
        status_code = threat_log.get('status_code', 200)
        features.append(float(status_code))
        
        # Time of day (hour)
        timestamp = threat_log.get('timestamp', datetime.utcnow())
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        hour = timestamp.hour
        features.append(float(hour))
        
        # Day of week
        day_of_week = timestamp.weekday()
        features.append(float(day_of_week))
        
        # User agent length (can indicate bots)
        user_agent = threat_log.get('user_agent', '')
        ua_length = len(user_agent) if user_agent else 0
        features.append(float(ua_length))
        
        # IP reputation score (placeholder, would integrate with IP intel)
        ip_reputation = threat_log.get('ip_reputation_score', 0.5)
        features.append(float(ip_reputation))
        
        return np.array(features).reshape(1, -1)
    
    def calculate_velocity_weight(self, source_ip: str, time_window_minutes: int = 1) -> float:
        """
        Calculate velocity weight based on actions per time unit
        
        Args:
            source_ip: Source IP address
            time_window_minutes: Time window for velocity calculation
        
        Returns:
            Velocity weight normalized to 0-1 range
        """
        now = datetime.utcnow()
        cutoff_time = now - timedelta(minutes=time_window_minutes)
        
        # Clean old entries from cache
        if source_ip in self.velocity_cache:
            self.velocity_cache[source_ip] = [
                ts for ts in self.velocity_cache[source_ip]
                if ts > cutoff_time
            ]
        else:
            self.velocity_cache[source_ip] = []
        
        # Add current timestamp
        self.velocity_cache[source_ip].append(now)
        
        # Calculate velocity (actions per minute)
        action_count = len(self.velocity_cache[source_ip])
        velocity = action_count / time_window_minutes
        
        # Normalize to 0-1 (threshold at 5 actions per minute)
        velocity_weight = min(velocity / 5.0, 1.0)
        
        return velocity_weight
    
    def train(self, threat_logs: List[Dict]) -> bool:
        """
        Train the Isolation Forest model
        
        Args:
            threat_logs: List of threat log dictionaries
        
        Returns:
            True if training successful, False otherwise
        """
        try:
            if len(threat_logs) < 10:
                logger.warning("Insufficient data to train model (minimum 10 samples)")
                return False
            
            # Extract features
            features = []
            for log in threat_logs:
                feature = self.extract_features(log)
                features.append(feature[0])
            
            X = np.array(features)
            self.feature_names = [
                'response_time_ms',
                'status_code',
                'hour_of_day',
                'day_of_week',
                'user_agent_length',
                'ip_reputation_score'
            ]
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model.fit(X_scaled)
            self.is_trained = True
            
            logger.info(f"Model trained successfully on {len(threat_logs)} samples")
            return True
        
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return False
    
    def predict(self, threat_log: Dict) -> Dict:
        """
        Predict threat score for a single log entry
        
        Args:
            threat_log: Threat log dictionary
        
        Returns:
            Dictionary with anomaly_score, velocity_weight, and risk_score
        """
        if not self.is_trained:
            logger.warning("Model not trained, returning default scores")
            return {
                'anomaly_score': 0.0,
                'velocity_weight': 0.0,
                'risk_score': 0.0,
                'is_anomaly': False
            }
        
        try:
            # Extract and scale features
            features = self.extract_features(threat_log)
            X_scaled = self.scaler.transform(features)
            
            # Get anomaly score (-1 for anomaly, 1 for normal)
            anomaly_prediction = self.model.predict(X_scaled)[0]
            
            # Get anomaly probability (lower = more anomalous)
            # Negative scores are anomalies; convert to 0-1 probability
            anomaly_scores = self.model.score_samples(X_scaled)
            anomaly_score = 1 / (1 + np.exp(anomaly_scores[0]))  # Sigmoid normalization
            
            # Ensure score is between 0 and 1
            anomaly_score = max(0.0, min(1.0, float(anomaly_score)))
            
            # Calculate velocity weight
            source_ip = threat_log.get('source_ip', 'unknown')
            velocity_weight = self.calculate_velocity_weight(source_ip)
            
            # Combined risk score
            # Risk Score = (AnomalyScore × 0.6) + (VelocityWeight × 0.4)
            risk_score = (anomaly_score * 0.6) + (velocity_weight * 0.4)
            
            return {
                'anomaly_score': round(anomaly_score, 4),
                'velocity_weight': round(velocity_weight, 4),
                'risk_score': round(risk_score, 4),
                'is_anomaly': anomaly_prediction == -1
            }
        
        except Exception as e:
            logger.error(f"Error predicting threat score: {str(e)}")
            return {
                'anomaly_score': 0.0,
                'velocity_weight': 0.0,
                'risk_score': 0.0,
                'is_anomaly': False
            }
    
    def batch_predict(self, threat_logs: List[Dict]) -> List[Dict]:
        """
        Predict threat scores for multiple log entries
        
        Args:
            threat_logs: List of threat log dictionaries
        
        Returns:
            List of prediction dictionaries
        """
        predictions = []
        for log in threat_logs:
            prediction = self.predict(log)
            predictions.append(prediction)
        
        return predictions
    
    def save_model(self, filepath: str) -> bool:
        """Save trained model to disk"""
        try:
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'is_trained': self.is_trained
            }, filepath)
            logger.info(f"Model saved to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return False
    
    def load_model(self, filepath: str) -> bool:
        """Load trained model from disk"""
        try:
            data = joblib.load(filepath)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_names = data['feature_names']
            self.is_trained = data['is_trained']
            logger.info(f"Model loaded from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False

# Singleton instance
_engine_instance = None

def get_threat_detection_engine() -> ThreatDetectionEngine:
    """Get or create the threat detection engine singleton"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = ThreatDetectionEngine()
    return _engine_instance
