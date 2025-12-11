import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np
import pandas as pd

def run_model(df):
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    score = r2_score(y_test, y_pred)

    plt.scatter(y_test, y_pred)
    plt.xlabel("True Values")
    plt.ylabel("Predicted Values")
    plt.title("Regression Plot")
    plot_path = "static/plot.png"
    plt.savefig(plot_path)
    plt.close()

    return {"r2_score": round(score, 4)}, plot_path

def prepare_time_series_data(values, window_size=5):
    """Prepare data for time series prediction"""
    X, y = [], []
    for i in range(len(values) - window_size):
        X.append(values[i:i+window_size])
        y.append(values[i+window_size])
    return np.array(X), np.array(y)

def train_and_predict(values, window_size=5, future_steps=3):
    """Train model and make predictions"""
    if len(values) < window_size + 1:
        return {
            'error': 'Not enough data points for prediction',
            'min_required': window_size + 1,
            'current_points': len(values)
        }
    
    try:
        # Prepare data
        X, y = prepare_time_series_data(values, window_size)
        
        # Split data (use last 20% for testing)
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train model
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        # Get predictions for test set
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        # Make future predictions
        future_predictions = []
        last_window = values[-window_size:]
        
        for _ in range(future_steps):
            next_pred = model.predict([last_window])[0]
            future_predictions.append(float(next_pred))
            last_window = np.append(last_window[1:], next_pred)
        
        return {
            'r2_score': float(r2),
            'rmse': float(rmse),
            'future_predictions': future_predictions,
            'model_quality': 'good' if r2 > 0.7 else 'moderate' if r2 > 0.5 else 'poor'
        }
        
    except Exception as e:
        return {'error': str(e)}
