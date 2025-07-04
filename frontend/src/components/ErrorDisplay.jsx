import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, title = "Service Unavailable" }) => {
  if (!error) return null;

  return (
    <div className="error-display">
      <div className="error-header">
        <span className="error-icon">⚠️</span>
        <h3>{title}</h3>
      </div>
      
      <div className="error-content">
        <p className="error-message">{error.message}</p>
        
        {error.details && (
          <div className="error-details">
            <strong>Details:</strong>
            <p>{error.details}</p>
          </div>
        )}
        
        {error.suggestedActions && error.suggestedActions.length > 0 && (
          <div className="error-actions">
            <strong>Suggested Actions:</strong>
            <ul>
              {error.suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}
        
        {error.timestamp && (
          <div className="error-timestamp">
            <small>Occurred at: {new Date(error.timestamp).toLocaleString()}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
