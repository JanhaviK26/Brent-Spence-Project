from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
import mysql.connector
from datetime import datetime, timedelta
import logging
from utils.db import get_db_connection
import json
from model.ml import train_and_predict
from model.autoencoder import StrainAutoencoder

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize autoencoder models
strain_autoencoders = {}

# Custom JSON encoder to handle datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S.%f')
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

def parse_timestamp(ts_str):
    try:
        # First try parsing as complete datetime with pandas (handles MM/DD/YY HH:MM format)
        try:
            # Use pandas to_datetime which handles various formats including MM/DD/YY HH:MM
            parsed_dt = pd.to_datetime(ts_str, infer_datetime_format=True)
            logger.info(f"Successfully parsed timestamp: {ts_str} -> {parsed_dt}")
            return parsed_dt
        except Exception as e:
            logger.warning(f"Pandas parsing failed for {ts_str}: {str(e)}")
            pass

        # Handle MM:SS.f format (fallback for time-only data)
        if ':' in ts_str and '.' in ts_str:
            try:
                parts = ts_str.split(':')
                if len(parts) == 2:  # MM:SS.f format
                    minutes, seconds = parts
                    total_seconds = int(minutes) * 60 + float(seconds)
                elif len(parts) == 3:  # HH:MM:SS format
                    hours, minutes, seconds = parts
                    total_seconds = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
                
                # Use current date as reference for time-only data
                base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                return base_date + timedelta(seconds=total_seconds)
            except Exception as e:
                logger.warning(f"Failed to parse time-only timestamp {ts_str}: {str(e)}")
                pass

        # If all parsing attempts fail, return None
        logger.warning(f"Could not parse timestamp: {ts_str}")
        return None
    except Exception as e:
        logger.error(f"Error parsing timestamp {ts_str}: {str(e)}")
        return None

def clear_tables():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Clear both tables (only if they exist)
        try:
            cursor.execute("DELETE FROM battery_data")
        except mysql.connector.Error as e:
            if e.errno != 1146:  # Table doesn't exist error
                raise
            logger.info("battery_data table doesn't exist, skipping clear")
        
        try:
            cursor.execute("DELETE FROM strain_data")
        except mysql.connector.Error as e:
            if e.errno != 1146:  # Table doesn't exist error
                raise
            logger.info("strain_data table doesn't exist, skipping clear")
        
        conn.commit()
        cursor.close()
        conn.close()
        logger.info("Successfully cleared all tables")
    except Exception as e:
        logger.error(f"Error clearing tables: {str(e)}")
        raise

@app.route('/')
def home():
    return jsonify({"message": "Server is running"})

@app.route('/piers', methods=['GET'])
def get_piers():
    """Return list of available piers"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        # Extract pier numbers from table names
        piers = set()
        for table in tables:
            if table.startswith('pier') and '_' in table:
                pier_num = table.split('_')[0].replace('pier', '')
                if pier_num.isdigit():
                    piers.add(int(pier_num))
        
        return jsonify({'piers': sorted(list(piers))})
    except Exception as e:
        logger.error(f"Error getting piers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/columns', methods=['POST'])
def get_columns():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Save file temporarily
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', file.filename)
        file.save(file_path)
        
        try:
            # Read CSV columns
            df = pd.read_csv(file_path)
            columns = list(df.columns)
            os.remove(file_path)  # Clean up
            return jsonify({'columns': columns})
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'Failed to read CSV columns: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify-data', methods=['GET'])
def verify_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check battery data
        cursor.execute("SELECT COUNT(*) as count FROM battery_data")
        battery_count = cursor.fetchone()['count']
        
        # Check strain data
        cursor.execute("SELECT strain_type, COUNT(*) as count FROM strain_data GROUP BY strain_type")
        strain_counts = cursor.fetchall()
        
        # Get sample data
        cursor.execute("SELECT * FROM strain_data LIMIT 5")
        sample_strain = cursor.fetchall()
        
        cursor.execute("SELECT * FROM battery_data LIMIT 5")
        sample_battery = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Convert datetime objects to strings
        for sample in sample_strain:
            if 'timestamp' in sample:
                sample['timestamp'] = sample['timestamp'].strftime('%Y-%m-%d %H:%M:%S.%f')
                
        for sample in sample_battery:
            if 'timestamp' in sample:
                sample['timestamp'] = sample['timestamp'].strftime('%Y-%m-%d %H:%M:%S.%f')
        
        return jsonify({
            'battery_data_count': battery_count,
            'strain_data_counts': strain_counts,
            'sample_strain_data': sample_strain,
            'sample_battery_data': sample_battery
        })
        
    except Exception as e:
        logger.error(f"Error verifying data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        logger.info("Starting file upload process...")
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        file_type = request.form.get('type')
        
        logger.info(f"Received file upload request - Type: {file_type}")
        
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # First ensure tables exist, then clear existing data
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS battery_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME(3),
                    battv FLOAT
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS strain_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME(3),
                    strain_type VARCHAR(20),
                    strain_value FLOAT
                )
            """)
            
            conn.commit()
            logger.info("Successfully created/verified database tables")
        except Exception as e:
            logger.error(f"Error creating tables: {str(e)}")
            return jsonify({'error': f'Database setup error: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
        
        # Now clear existing data
        clear_tables()
        logger.info("Cleared existing data from tables")
        
        # Read CSV file
        try:
            # Save the original uploaded file
            upload_folder = 'uploads'
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            
            original_filename = f"original_upload_{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            file_path = os.path.join(upload_folder, original_filename)
            
            # Reset file pointer to beginning
            file.seek(0)
            file.save(file_path)
            logger.info(f"Saved original file to: {file_path}")
            
            # Store the file path in a simple way (you could use database for production)
            with open('uploads/latest_upload_info.txt', 'w') as info_file:
                info_file.write(f"{file_type},{file_path},{original_filename}")
            
            # Reset file pointer again to read for processing
            file.seek(0)
            df = pd.read_csv(file)
            logger.info(f"Successfully read CSV file. Columns found: {df.columns.tolist()}")
            logger.info(f"Number of rows in CSV: {len(df)}")
            logger.info(f"First row data: {df.iloc[0].to_dict()}")
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            return jsonify({'error': f'Error reading CSV file: {str(e)}'}), 400
        
        # Ensure required columns exist
        if 'TIMESTAMP' not in df.columns:
            logger.error("TIMESTAMP column not found in CSV")
            return jsonify({'error': 'TIMESTAMP column not found in CSV'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Process the data
        success_count = 0
        error_count = 0
        
        # Prepare data for batch insert
        values_to_insert = []
        batch_size = 1000
        
        for index, row in df.iterrows():
            try:
                # Parse timestamp
                timestamp_str = str(row['TIMESTAMP'])
                try:
                    # Parse the timestamp format from your CSV (M/D/YYYY HH:MM)
                    timestamp = pd.to_datetime(timestamp_str)
                    mysql_timestamp = timestamp.strftime('%Y-%m-%d %H:%M:%S')
                except Exception as e:
                    logger.error(f"Error parsing timestamp {timestamp_str}: {str(e)}")
                    error_count += 1
                    continue
                
                if file_type == 'battv':
                    try:
                        # Try to find battery voltage data
                        if 'BattV_Min' in df.columns:
                            battv = float(row['BattV_Min'])
                        elif 'RECORD' in df.columns:
                            battv = float(row['RECORD'])
                        else:
                            batt_columns = [col for col in df.columns if any(x in col.lower() for x in ['batt', 'voltage', 'volt', 'v'])]
                            if not batt_columns:
                                error_count += 1
                                continue
                            battv = float(row[batt_columns[0]])
                            
                        if pd.isna(battv):
                            error_count += 1
                            continue
                            
                        values_to_insert.append((mysql_timestamp, battv))
                        success_count += 1
                        
                        if len(values_to_insert) >= batch_size:
                            cursor.executemany(
                                f"INSERT INTO {battery_table} (timestamp, battv) VALUES (%s, %s)",
                                values_to_insert
                            )
                            conn.commit()
                            values_to_insert = []
                            
                    except (ValueError, KeyError) as e:
                        logger.error(f"Error processing battery data at row {index}: {str(e)}")
                        error_count += 1
                        
                elif file_type == 'strain':
                    try:
                        # Process all strain columns at once
                        strain_columns = [col for col in df.columns if col.startswith('Strain(')]
                        for strain_col in strain_columns:
                            try:
                                strain_value = float(row[strain_col])
                                if pd.isna(strain_value):
                                    continue
                                
                                values_to_insert.append((mysql_timestamp, strain_col, strain_value))
                                success_count += 1
                                
                                if len(values_to_insert) >= batch_size:
                                    cursor.executemany(
                                        f"INSERT INTO {strain_table} (timestamp, strain_type, strain_value) VALUES (%s, %s, %s)",
                                        values_to_insert
                                    )
                                    conn.commit()
                                    values_to_insert = []
                                    
                            except (ValueError, KeyError) as e:
                                logger.error(f"Error processing strain data at row {index}, column {strain_col}: {str(e)}")
                                error_count += 1
                                
                    except Exception as e:
                        logger.error(f"Error processing strain data at row {index}: {str(e)}")
                        error_count += 1
                        
            except Exception as e:
                logger.error(f"Error processing row {index}: {str(e)}")
                error_count += 1
                continue
        
        # Insert any remaining records
        try:
            if values_to_insert:
                if file_type == 'battv':
                    cursor.executemany(
                        "INSERT INTO battery_data (timestamp, battv) VALUES (%s, %s)",
                        values_to_insert
                    )
                else:
                    cursor.executemany(
                        "INSERT INTO strain_data (timestamp, strain_type, strain_value) VALUES (%s, %s, %s)",
                        values_to_insert
                    )
                conn.commit()
            
            # Verify data was inserted
            if file_type == 'battv':
                cursor.execute("SELECT COUNT(*) FROM battery_data")
            else:
                cursor.execute("SELECT COUNT(*) FROM strain_data")
            count = cursor.fetchone()[0]
            logger.info(f"Verified {count} records in database for {'battery' if file_type == 'battv' else 'strain'}")
            
        except Exception as e:
            logger.error(f"Error inserting data: {str(e)}")
            return jsonify({'error': f'Error inserting data: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
        
        logger.info(f"File processing complete. Success: {success_count}, Errors: {error_count}")
        
        if success_count == 0:
            return jsonify({'error': 'No valid data rows were processed. Please check your file format and column names.'}), 400
            
        return jsonify({
            'message': 'File processed',
            'success_count': success_count,
            'error_count': error_count,
            'database_count': count
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/plot-data', methods=['GET'])
def get_plot_data():
    try:
        # Get pier parameter (default to pier 1 for backward compatibility)
        pier = request.args.get('pier', '1', type=str)
        logger.info(f"Fetching plot data for pier {pier}...")
        
        battery_table = f"pier{pier}_battery_data"
        strain_table = f"pier{pier}_strain_data"
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get battery data
        logger.info(f"Fetching battery data from {battery_table}...")
        try:
            cursor.execute(f"""
                SELECT UNIX_TIMESTAMP(timestamp) as timestamp, battv 
                FROM {battery_table} 
                ORDER BY timestamp
            """)
            battery_data = cursor.fetchall()
            logger.info(f"Found {len(battery_data)} battery data points")
        except mysql.connector.Error as e:
            if e.errno == 1146:  # Table doesn't exist
                logger.warning(f"{battery_table} doesn't exist")
                battery_data = []
            else:
                raise
        
        # Get strain data (filter out invalid values like -9999.0)
        logger.info(f"Fetching strain data from {strain_table}...")
        try:
            cursor.execute(f"""
                SELECT UNIX_TIMESTAMP(timestamp) as timestamp, strain_type, strain_value 
                FROM {strain_table} 
                WHERE strain_value != -9999.0 AND strain_value IS NOT NULL
                ORDER BY timestamp
            """)
            strain_data = cursor.fetchall()
            logger.info(f"Found {len(strain_data)} valid strain data points (filtered out invalid values)")
        except mysql.connector.Error as e:
            if e.errno == 1146:  # Table doesn't exist
                logger.warning(f"{strain_table} doesn't exist")
                strain_data = []
            else:
                raise
        
        # Process data
        timestamps = []
        battv = []
        strains = {}
        
        # Initialize strain arrays for all 17 strain gauges
        for i in range(1, 18):
            strains[f'Strain({i})'] = []
            
        # Process battery data
        if battery_data:
            timestamps = [float(row['timestamp']) for row in battery_data]
            battv = [float(row['battv']) for row in battery_data]
            logger.info(f"Processed {len(battv)} battery values")
            
        # Process strain data with validation
        strain_timestamps = {}
        strain_values = {}
        
        if strain_data:
            for row in strain_data:
                strain_type = row['strain_type']
                strain_value = row['strain_value']
                
                # Additional validation to ensure we have valid numeric data
                try:
                    strain_value_float = float(strain_value)
                    if strain_value_float == -9999.0 or strain_value_float is None:
                        continue  # Skip invalid values
                        
                    if strain_type not in strain_timestamps:
                        strain_timestamps[strain_type] = []
                        strain_values[strain_type] = []
                        logger.info(f"Processing strain type: {strain_type}")
                    
                    strain_timestamps[strain_type].append(float(row['timestamp']))
                    strain_values[strain_type].append(strain_value_float)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Skipping invalid strain value {strain_value} for {strain_type}: {e}")
                    continue
        
        # Update strains dictionary
        for strain_type in strains:
            if strain_type in strain_values:
                strains[strain_type] = strain_values[strain_type]
                if not timestamps and strain_timestamps.get(strain_type):  # If no battery data, use strain timestamps
                    timestamps = strain_timestamps[strain_type]
                logger.info(f"Added {len(strains[strain_type])} values for {strain_type}")
                
        cursor.close()
        conn.close()
        
        if not timestamps and not any(strains.values()):
            logger.warning("No data available in the database")
            return jsonify({'error': 'No data available in the database. Please upload data first.'}), 404
            
        response_data = {
            'timestamps': timestamps,
            'battv': battv,
            'strains': strains
        }
        logger.info(f"Returning data with {len(timestamps)} timestamps and {len(strains)} strain types")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching plot data: {str(e)}")
        return jsonify({'error': 'Failed to fetch plot data: ' + str(e)}), 500

@app.route('/predict', methods=['GET'])
def get_predictions():
    try:
        logger.info("Fetching data for predictions...")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get battery predictions
        cursor.execute("""
            SELECT battv 
            FROM battery_data 
            ORDER BY timestamp
        """)
        battery_data = cursor.fetchall()
        battery_values = [float(row['battv']) for row in battery_data]
        
        # Get strain predictions for each type
        cursor.execute("""
            SELECT strain_type, strain_value 
            FROM strain_data 
            ORDER BY timestamp, strain_type
        """)
        strain_data = cursor.fetchall()
        
        # Group strain data by type
        strain_values = {}
        for row in strain_data:
            strain_type = row['strain_type']
            if strain_type not in strain_values:
                strain_values[strain_type] = []
            strain_values[strain_type].append(float(row['strain_value']))
        
        # Get predictions
        predictions = {
            'battery': train_and_predict(battery_values) if battery_values else {'error': 'No battery data available'},
            'strains': {}
        }
        
        # Get predictions for each strain type
        for strain_type, values in strain_values.items():
            predictions['strains'][strain_type] = train_and_predict(values)
        
        cursor.close()
        conn.close()
        
        return jsonify(predictions)
        
    except Exception as e:
        logger.error(f"Error getting predictions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/detect-anomalies', methods=['GET'])
def detect_anomalies():
    try:
        logger.info("Starting anomaly detection...")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get strain type from query params
        strain_type = request.args.get('strain_type', 'Strain(1)')
        
        # Get strain data
        cursor.execute("""
            SELECT UNIX_TIMESTAMP(timestamp) as timestamp, strain_value 
            FROM strain_data 
            WHERE strain_type = %s
            ORDER BY timestamp
        """, (strain_type,))
        
        strain_data = cursor.fetchall()
        if not strain_data:
            return jsonify({'error': f'No data available for {strain_type}'}), 404
            
        # Extract values and timestamps
        values = [float(row['strain_value']) for row in strain_data]
        timestamps = [float(row['timestamp']) for row in strain_data]
        
        # Initialize or get autoencoder for this strain type
        if strain_type not in strain_autoencoders:
            strain_autoencoders[strain_type] = StrainAutoencoder()
            # Train the model
            strain_autoencoders[strain_type].fit(values)
        
        # Detect anomalies
        results = strain_autoencoders[strain_type].detect_anomalies(values, timestamps)
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/export-data', methods=['GET'])
def export_data():
    try:
        logger.info("Exporting original uploaded file...")
        
        # Check if we have a record of the last uploaded file
        info_file_path = 'uploads/latest_upload_info.txt'
        if not os.path.exists(info_file_path):
            return jsonify({'error': 'No uploaded file found. Please upload a file first.'}), 400
        
        # Read the upload info
        with open(info_file_path, 'r') as info_file:
            upload_info = info_file.read().strip().split(',')
            if len(upload_info) != 3:
                return jsonify({'error': 'Invalid upload info. Please upload a file again.'}), 400
            
            file_type, file_path, original_filename = upload_info
        
        # Check if the original file exists
        if not os.path.exists(file_path):
            return jsonify({'error': 'Original uploaded file not found. Please upload the file again.'}), 400
        
        # Read the original file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                csv_content = f.read()
        except Exception as e:
            logger.error(f"Error reading original file: {str(e)}")
            return jsonify({'error': 'Error reading original file.'}), 500
        
        # Extract just the filename without path for download
        download_filename = f"exported_{original_filename}"
        
        return jsonify({
            'csv': csv_content,
            'filename': download_filename
        })
        
    except Exception as e:
        logger.error(f"Error exporting original file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/insert-direct', methods=['POST'])
def insert_direct():
    try:
        data = request.get_json()
        file_path = data.get('file_path')  # Path inside container
        file_type = data.get('type', 'battv')
        pier = data.get('pier', '1')  # Default to pier 1
        
        if not file_path:
            return jsonify({'error': 'File path required'}), 400
        
        logger.info(f"Starting direct file insertion - Path: {file_path}, Type: {file_type}, Pier: {pier}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': f'File not found: {file_path}'}), 400
        
        # Set up pier-specific table names
        battery_table = f"pier{pier}_battery_data"
        strain_table = f"pier{pier}_strain_data"
        
        # First ensure tables exist, then clear existing data
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        try:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {battery_table} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME(3),
                    battv FLOAT
                )
            """)
            
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {strain_table} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME(3),
                    strain_type VARCHAR(20),
                    strain_value FLOAT
                )
            """)
            
            conn.commit()
            logger.info(f"Successfully created/verified database tables for pier {pier}")
        except Exception as e:
            logger.error(f"Error creating tables: {str(e)}")
            return jsonify({'error': f'Database setup error: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
        
        # Now clear existing data for this pier (only the table being inserted)
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            table_to_clear = battery_table if file_type == 'battv' else strain_table
            cursor.execute(f"DELETE FROM {table_to_clear}")
            conn.commit()
            cursor.close()
            conn.close()
            logger.info(f"Cleared existing data from {table_to_clear}")
        except Exception as e:
            logger.warning(f"Error clearing table: {str(e)}")
        
        # Read CSV file
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Successfully read CSV file. Columns found: {df.columns.tolist()}")
            logger.info(f"Number of rows in CSV: {len(df)}")
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            return jsonify({'error': f'Error reading CSV file: {str(e)}'}), 400
        
        # Ensure required columns exist
        if 'TIMESTAMP' not in df.columns:
            logger.error("TIMESTAMP column not found in CSV")
            return jsonify({'error': 'TIMESTAMP column not found in CSV'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Process the data
        success_count = 0
        error_count = 0
        
        # Prepare data for batch insert
        values_to_insert = []
        batch_size = 1000
        
        for index, row in df.iterrows():
            try:
                # Parse timestamp
                timestamp_str = str(row['TIMESTAMP'])
                try:
                    # Parse the timestamp format from your CSV (M/D/YYYY HH:MM)
                    timestamp = pd.to_datetime(timestamp_str)
                    mysql_timestamp = timestamp.strftime('%Y-%m-%d %H:%M:%S')
                except Exception as e:
                    logger.error(f"Error parsing timestamp {timestamp_str}: {str(e)}")
                    error_count += 1
                    continue
                
                if file_type == 'battv':
                    try:
                        # Try to find battery voltage data
                        if 'BattV_Min' in df.columns:
                            battv = float(row['BattV_Min'])
                        elif 'RECORD' in df.columns:
                            battv = float(row['RECORD'])
                        else:
                            batt_columns = [col for col in df.columns if any(x in col.lower() for x in ['batt', 'voltage', 'volt', 'v'])]
                            if not batt_columns:
                                error_count += 1
                                continue
                            battv = float(row[batt_columns[0]])
                            
                        if pd.isna(battv):
                            error_count += 1
                            continue
                            
                        values_to_insert.append((mysql_timestamp, battv))
                        success_count += 1
                        
                        if len(values_to_insert) >= batch_size:
                            cursor.executemany(
                                f"INSERT INTO {battery_table} (timestamp, battv) VALUES (%s, %s)",
                                values_to_insert
                            )
                            conn.commit()
                            values_to_insert = []
                            
                    except (ValueError, KeyError) as e:
                        logger.error(f"Error processing battery data at row {index}: {str(e)}")
                        error_count += 1
                        
                elif file_type == 'strain':
                    try:
                        # Process all strain columns at once
                        strain_columns = [col for col in df.columns if col.startswith('Strain(')]
                        for strain_col in strain_columns:
                            try:
                                strain_value = float(row[strain_col])
                                if pd.isna(strain_value):
                                    continue
                                
                                values_to_insert.append((mysql_timestamp, strain_col, strain_value))
                                success_count += 1
                                
                                if len(values_to_insert) >= batch_size:
                                    cursor.executemany(
                                        f"INSERT INTO {strain_table} (timestamp, strain_type, strain_value) VALUES (%s, %s, %s)",
                                        values_to_insert
                                    )
                                    conn.commit()
                                    values_to_insert = []
                                    
                            except (ValueError, KeyError) as e:
                                logger.error(f"Error processing strain data at row {index}, column {strain_col}: {str(e)}")
                                error_count += 1
                                
                    except Exception as e:
                        logger.error(f"Error processing strain data at row {index}: {str(e)}")
                        error_count += 1
                        
            except Exception as e:
                logger.error(f"Error processing row {index}: {str(e)}")
                error_count += 1
                continue
        
        # Insert any remaining records
        try:
            if values_to_insert:
                if file_type == 'battv':
                    cursor.executemany(
                        f"INSERT INTO {battery_table} (timestamp, battv) VALUES (%s, %s)",
                        values_to_insert
                    )
                else:
                    cursor.executemany(
                        f"INSERT INTO {strain_table} (timestamp, strain_type, strain_value) VALUES (%s, %s, %s)",
                        values_to_insert
                    )
                conn.commit()
            
            # Verify data was inserted
            if file_type == 'battv':
                cursor.execute(f"SELECT COUNT(*) FROM {battery_table}")
            else:
                cursor.execute(f"SELECT COUNT(*) FROM {strain_table}")
            count = cursor.fetchone()[0]
            logger.info(f"Verified {count} records in pier {pier} database for {'battery' if file_type == 'battv' else 'strain'}")
            
        except Exception as e:
            logger.error(f"Error inserting data: {str(e)}")
            return jsonify({'error': f'Error inserting data: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
        
        logger.info(f"Direct file processing complete for pier {pier}. Success: {success_count}, Errors: {error_count}")
        
        if success_count == 0:
            return jsonify({'error': 'No valid data rows were processed. Please check your file format and column names.'}), 400
            
        return jsonify({
            'message': 'File processed successfully',
            'success_count': success_count,
            'error_count': error_count,
            'database_count': count
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/export-filtered-data', methods=['GET'])
def export_filtered_data():
    try:
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')
        plot_type = request.args.get('plotType', 'battery')
        selected_sensors = request.args.get('selectedSensors', '')
        pier = request.args.get('pier', '1')
        
        logger.info(f"Exporting filtered data - Type: {plot_type}, Pier: {pier}, Date range: {start_date_str} to {end_date_str}")
        
        # Set table names based on pier
        battery_table = f"pier{pier}_battery_data"
        strain_table = f"pier{pier}_strain_data"
        
        # Parse dates if provided, otherwise export all data
        start_date = None
        end_date = None
        
        if start_date_str and end_date_str:
            try:
                from datetime import datetime
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            except Exception as e:
                logger.error(f"Error parsing dates: {str(e)}")
                return jsonify({'error': 'Invalid date format'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if plot_type == 'battery':
            # Export battery data (filtered or all)
            if start_date and end_date:
                cursor.execute(f"""
                    SELECT timestamp, battv 
                    FROM {battery_table} 
                    WHERE timestamp BETWEEN %s AND %s
                    ORDER BY timestamp
                """, (start_date, end_date))
            else:
                cursor.execute(f"""
                    SELECT timestamp, battv 
                    FROM {battery_table} 
                    ORDER BY timestamp
                """)
            data = cursor.fetchall()
            
            if not data:
                return jsonify({'error': 'No battery data available'}), 400
            
            # Create CSV content
            csv_lines = ['TIMESTAMP,BattV']
            for row in data:
                timestamp_str = row['timestamp'].strftime('%m/%d/%Y %H:%M')
                csv_lines.append(f"{timestamp_str},{row['battv']}")
                
        else:  # strain data
            # Get selected sensors
            if selected_sensors:
                sensor_list = selected_sensors.split(',')
            else:
                return jsonify({'error': 'No strain sensors selected'}), 400
            
            # Get strain data (filtered or all)
            placeholders = ','.join(['%s'] * len(sensor_list))
            if start_date and end_date:
                cursor.execute(f"""
                    SELECT timestamp, strain_type, strain_value 
                    FROM {strain_table} 
                    WHERE strain_type IN ({placeholders})
                    AND timestamp BETWEEN %s AND %s
                    ORDER BY timestamp, strain_type
                """, sensor_list + [start_date, end_date])
            else:
                cursor.execute(f"""
                    SELECT timestamp, strain_type, strain_value 
                    FROM {strain_table} 
                    WHERE strain_type IN ({placeholders})
                    ORDER BY timestamp, strain_type
                """, sensor_list)
            
            data = cursor.fetchall()
            
            if not data:
                return jsonify({'error': 'No strain data available for selected sensors'}), 400
            
            # Organize data by timestamp
            timestamps = {}
            for row in data:
                ts = row['timestamp'].strftime('%m/%d/%Y %H:%M')
                if ts not in timestamps:
                    timestamps[ts] = {}
                timestamps[ts][row['strain_type']] = row['strain_value']
            
            # Create CSV content
            csv_lines = ['TIMESTAMP,' + ','.join(sorted(sensor_list))]
            for timestamp in sorted(timestamps.keys()):
                row_data = [timestamp]
                for sensor in sorted(sensor_list):
                    value = timestamps[timestamp].get(sensor, '')
                    row_data.append(str(value) if value != '' else '')
                csv_lines.append(','.join(row_data))
        
        cursor.close()
        conn.close()
        
        csv_content = '\n'.join(csv_lines)
        
        # Create filename
        start_str = start_date.strftime('%Y%m%d') if start_date else 'all'
        end_str = end_date.strftime('%Y%m%d') if end_date else 'all'
        if plot_type == 'strain' and selected_sensors:
            filename = f"filtered_{plot_type}_data_{start_str}_to_{end_str}_sensors_{len(sensor_list)}.csv"
        else:
            filename = f"filtered_{plot_type}_data_{start_str}_to_{end_str}.csv"
        
        return jsonify({
            'csv': csv_content,
            'filename': filename
        })
        
    except Exception as e:
        logger.error(f"Error exporting filtered data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
