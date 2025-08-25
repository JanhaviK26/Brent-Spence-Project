import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
from datetime import datetime

class Autoencoder(nn.Module):
    def __init__(self, input_dim):
        super(Autoencoder, self).__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 4),
            nn.ReLU(),
            nn.Linear(4, 2),
            nn.ReLU()
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(2, 4),
            nn.ReLU(),
            nn.Linear(4, input_dim),
            nn.Sigmoid()
        )

    def forward(self, x):
        x = self.encoder(x)
        x = self.decoder(x)
        return x

class StrainAutoencoder:
    def __init__(self, input_dim=5):
        self.input_dim = input_dim
        self.scaler = MinMaxScaler()
        self.threshold = None
        self.model = Autoencoder(input_dim)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
    def prepare_sequences(self, data, sequence_length=5):
        sequences = []
        for i in range(len(data) - sequence_length + 1):
            sequences.append(data[i:i + sequence_length])
        return np.array(sequences)
    
    def fit(self, data, epochs=50, batch_size=32, validation_split=0.1):
        # Prepare sequences
        sequences = self.prepare_sequences(data)
        
        # Scale the data
        sequences_reshaped = sequences.reshape(-1, self.input_dim)
        sequences_scaled = self.scaler.fit_transform(sequences_reshaped)
        sequences_scaled = sequences_scaled.reshape(sequences.shape)
        
        # Convert to PyTorch tensors
        sequences_tensor = torch.FloatTensor(sequences_scaled).to(self.device)
        
        # Create optimizer
        optimizer = optim.Adam(self.model.parameters())
        criterion = nn.MSELoss()
        
        # Train the autoencoder
        self.model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = self.model(sequences_tensor)
            loss = criterion(outputs, sequences_tensor)
            loss.backward()
            optimizer.step()
            
            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}')
        
        # Calculate reconstruction error distribution
        self.model.eval()
        with torch.no_grad():
            reconstructed = self.model(sequences_tensor)
            mse = torch.mean(torch.pow(sequences_tensor - reconstructed, 2), dim=1)
            mse = mse.cpu().numpy()
        
        # Set threshold as mean + 2 standard deviations
        self.threshold = np.mean(mse) + 2 * np.std(mse)
        
        return {'loss': loss.item()}
    
    def detect_anomalies(self, data, timestamps=None):
        # Prepare sequences
        sequences = self.prepare_sequences(data)
        
        # Scale the data
        sequences_reshaped = sequences.reshape(-1, self.input_dim)
        sequences_scaled = self.scaler.transform(sequences_reshaped)
        sequences_scaled = sequences_scaled.reshape(sequences.shape)
        
        # Convert to PyTorch tensor
        sequences_tensor = torch.FloatTensor(sequences_scaled).to(self.device)
        
        # Get reconstructions
        self.model.eval()
        with torch.no_grad():
            reconstructed = self.model(sequences_tensor)
            mse = torch.mean(torch.pow(sequences_tensor - reconstructed, 2), dim=1)
            mse = mse.cpu().numpy()
        
        # Detect anomalies
        anomalies = mse > self.threshold
        
        # Prepare results
        results = {
            'reconstruction_error': mse.tolist(),
            'is_anomaly': anomalies.tolist(),
            'threshold': float(self.threshold)
        }
        
        if timestamps is not None:
            # Ensure we have the right number of timestamps
            valid_timestamps = timestamps[len(timestamps)-len(anomalies):]
            results['timestamps'] = valid_timestamps
            
            # Group anomalies by date
            anomaly_dates = []
            for i, is_anomaly in enumerate(anomalies):
                if is_anomaly:
                    ts = valid_timestamps[i]
                    if isinstance(ts, (int, float)):
                        ts = datetime.fromtimestamp(ts)
                    anomaly_dates.append(ts.strftime('%Y-%m-%d'))
            
            results['anomaly_dates'] = sorted(list(set(anomaly_dates)))
        
        return results 