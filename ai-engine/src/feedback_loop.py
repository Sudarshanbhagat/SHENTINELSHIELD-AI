"""
Human-in-the-Loop (HITL) Feedback Loop System
Analysts can correct AI classifications for model retraining
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)

class FeedbackBuffer:
    """
    Manages feedback from analysts for model retraining
    Triggers retraining when threshold is reached
    """
    
    def __init__(self, retraining_threshold: int = 100):
        """
        Initialize feedback buffer
        
        Args:
            retraining_threshold: Number of feedback samples needed to trigger retraining
        """
        self.retraining_threshold = retraining_threshold
        self.buffer = []
        self.classification_mapping = {
            'threat': 1,
            'anomaly': 0.5,
            'normal': 0
        }
    
    def add_feedback(self, feedback_item: Dict) -> bool:
        """
        Add analyst feedback to buffer
        
        Args:
            feedback_item: Dictionary containing:
                - threat_log_id: UUID of the threat log
                - original_classification: AI's original classification
                - corrected_classification: Analyst's correction
                - confidence_score: Analyst's confidence (0-1)
                - reason: Why analyst corrected the classification
                - analyst_id: UUID of the analyst
        
        Returns:
            True if feedback added successfully
        """
        try:
            # Validate classification
            if feedback_item.get('corrected_classification') not in self.classification_mapping:
                logger.error(f"Invalid classification: {feedback_item.get('corrected_classification')}")
                return False
            
            # Validate confidence score
            confidence = feedback_item.get('confidence_score', 0.5)
            if not (0 <= confidence <= 1):
                logger.warning(f"Confidence score out of range, clamping to [0, 1]")
                feedback_item['confidence_score'] = max(0, min(1, confidence))
            
            # Add timestamp and status
            feedback_item['created_at'] = datetime.utcnow()
            feedback_item['is_processed'] = False
            
            self.buffer.append(feedback_item)
            
            logger.info(f"Feedback added. Buffer size: {len(self.buffer)}/{self.retraining_threshold}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error adding feedback: {str(e)}")
            return False
    
    def should_retrain(self) -> bool:
        """Check if buffer has enough unprocessed feedback for retraining"""
        unprocessed_count = sum(1 for item in self.buffer if not item.get('is_processed', False))
        return unprocessed_count >= self.retraining_threshold
    
    def get_unprocessed_feedback(self) -> List[Dict]:
        """Get all unprocessed feedback items"""
        return [item for item in self.buffer if not item.get('is_processed', False)]
    
    def mark_as_processed(self, feedback_ids: List[str]) -> int:
        """
        Mark feedback items as processed after retraining
        
        Returns:
            Number of items marked as processed
        """
        count = 0
        for item in self.buffer:
            if item.get('threat_log_id') in feedback_ids:
                item['is_processed'] = True
                item['processed_at'] = datetime.utcnow()
                count += 1
        return count
    
    def get_feedback_statistics(self) -> Dict:
        """Get statistics about feedback in the buffer"""
        if not self.buffer:
            return {
                'total_feedback': 0,
                'processed': 0,
                'unprocessed': 0,
                'correction_rate': 0.0
            }
        
        total = len(self.buffer)
        processed = sum(1 for item in self.buffer if item.get('is_processed', False))
        unprocessed = total - processed
        
        # Calculate correction rate (how often analyst disagreed with AI)
        correction_count = sum(
            1 for item in self.buffer
            if item.get('original_classification') != item.get('corrected_classification')
        )
        correction_rate = correction_count / total if total > 0 else 0
        
        return {
            'total_feedback': total,
            'processed': processed,
            'unprocessed': unprocessed,
            'correction_rate': round(correction_rate, 4),
            'feedback_until_retrain': max(0, self.retraining_threshold - unprocessed)
        }
    
    def get_classification_distribution(self) -> Dict:
        """Get distribution of corrected classifications in unprocessed feedback"""
        unprocessed = self.get_unprocessed_feedback()
        
        distribution = defaultdict(int)
        for item in unprocessed:
            classification = item.get('corrected_classification', 'unknown')
            distribution[classification] += 1
        
        return dict(distribution)
    
    def export_training_data(self) -> tuple:
        """
        Export feedback as training data
        
        Returns:
            Tuple of (X, y) where X is features and y is target labels
        """
        unprocessed = self.get_unprocessed_feedback()
        
        if not unprocessed:
            logger.warning("No unprocessed feedback to export")
            return np.array([]), np.array([])
        
        # Extract features and labels
        y_labels = []
        
        for item in unprocessed:
            classification = item.get('corrected_classification')
            label = self.classification_mapping.get(classification, 0)
            y_labels.append(label)
        
        # In a real implementation, we would extract features from threat_logs
        # For now, just return labels
        y = np.array(y_labels)
        
        logger.info(f"Exported training data for {len(unprocessed)} samples")
        
        return y

class ModelRetrainingOrchestrator:
    """
    Orchestrates the model retraining process
    """
    
    def __init__(self):
        self.feedback_buffer = FeedbackBuffer()
        self.retraining_jobs = []
    
    def trigger_retraining(self) -> bool:
        """Trigger model retraining if threshold is met"""
        if not self.feedback_buffer.should_retrain():
            logger.info("Retraining threshold not met")
            return False
        
        try:
            logger.info("Triggering model retraining...")
            
            # Get unprocessed feedback
            unprocessed = self.feedback_buffer.get_unprocessed_feedback()
            feedback_ids = [item['threat_log_id'] for item in unprocessed]
            
            # Create retraining job
            job = {
                'job_id': str(datetime.utcnow().timestamp()),
                'status': 'pending',
                'feedback_count': len(unprocessed),
                'created_at': datetime.utcnow(),
                'feedback_ids': feedback_ids
            }
            
            self.retraining_jobs.append(job)
            
            # Mark feedback as being processed
            self.feedback_buffer.mark_as_processed(feedback_ids)
            
            logger.info(f"Retraining job created: {job['job_id']}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error triggering retraining: {str(e)}")
            return False
    
    def get_retraining_status(self) -> Dict:
        """Get status of ongoing retraining jobs"""
        return {
            'total_jobs': len(self.retraining_jobs),
            'pending': sum(1 for job in self.retraining_jobs if job['status'] == 'pending'),
            'running': sum(1 for job in self.retraining_jobs if job['status'] == 'running'),
            'completed': sum(1 for job in self.retraining_jobs if job['status'] == 'completed'),
            'failed': sum(1 for job in self.retraining_jobs if job['status'] == 'failed'),
        }
    
    def add_feedback(self, feedback_item: Dict) -> bool:
        """Add feedback through the orchestrator"""
        return self.feedback_buffer.add_feedback(feedback_item)
    
    def get_feedback_stats(self) -> Dict:
        """Get feedback statistics"""
        return self.feedback_buffer.get_feedback_statistics()
