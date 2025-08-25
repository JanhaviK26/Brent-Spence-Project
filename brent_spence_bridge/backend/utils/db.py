import mysql.connector
import pandas as pd
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get a MySQL database connection"""
    try:
        logger.info("Attempting to connect to MySQL database...")
        connection = mysql.connector.connect(
            host="db",  # Use Docker Compose service name
            user="root",
            password="34KWIDR",
            database="brent_db1"
        )
        logger.info("Successfully connected to MySQL database")
        return connection
    except mysql.connector.Error as err:
        logger.error(f"Error connecting to MySQL database: {err}")
        raise

def insert_csv_to_db(file_path, data_type='battv', strain_type=None):
    logger.info(f"Reading CSV file from: {file_path}")
    df = pd.read_csv(file_path)
    logger.info(f"CSV columns found: {list(df.columns)}")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create tables if they don't exist
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
        
        if data_type == 'battv':
            # Process battery voltage data
            for _, row in df.iterrows():
                try:
                    timestamp = pd.to_datetime(row['TIMESTAMP'])
                    battv = float(row['BattV'])
                    
                    cursor.execute("""
                        INSERT INTO battery_data (timestamp, battv)
                        VALUES (%s, %s)
                    """, (timestamp, battv))
                    
                except Exception as e:
                    logger.error(f"Error processing row: {row}")
                    logger.error(f"Error details: {str(e)}")
                    continue
                    
        elif data_type == 'strain':
            # Process strain data
            for _, row in df.iterrows():
                try:
                    timestamp = pd.to_datetime(row['TIMESTAMP'])
                    strain_value = float(row[strain_type])
                    
                    cursor.execute("""
                        INSERT INTO strain_data (timestamp, strain_type, strain_value)
                        VALUES (%s, %s, %s)
                    """, (timestamp, strain_type, strain_value))
                    
                except Exception as e:
                    logger.error(f"Error processing row: {row}")
                    logger.error(f"Error details: {str(e)}")
                    continue
        
        conn.commit()
        logger.info("Data insertion completed successfully")
        return {"status": "success", "message": "Data inserted successfully"}
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error inserting data: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def get_plot_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get battery data
        cursor.execute("""
            SELECT timestamp, battv 
            FROM battery_data 
            ORDER BY timestamp
        """)
        battery_data = cursor.fetchall()
        
        # Get strain data for all types
        cursor.execute("""
            SELECT timestamp, strain_type, strain_value 
            FROM strain_data 
            ORDER BY timestamp, strain_type
        """)
        strain_data = cursor.fetchall()
        
        # Initialize the response structure
        response = {
            "timestamps": [],
            "battv": [],
            "strains": {}
        }
        
        # Process battery data if exists
        if battery_data:
            response["timestamps"] = [row['timestamp'].strftime('%Y-%m-%d %H:%M:%S.%f') for row in battery_data]
            response["battv"] = [float(row['battv']) for row in battery_data]
        
        # Process strain data
        strain_dict = {}
        for row in strain_data:
            strain_type = row['strain_type']
            if strain_type not in strain_dict:
                strain_dict[strain_type] = {
                    'timestamps': [],
                    'values': []
                }
            strain_dict[strain_type]['timestamps'].append(row['timestamp'].strftime('%Y-%m-%d %H:%M:%S.%f'))
            strain_dict[strain_type]['values'].append(float(row['strain_value']))
        
        # If we don't have battery data timestamps, use strain data timestamps
        if not response["timestamps"] and strain_dict:
            first_strain = next(iter(strain_dict.values()))
            response["timestamps"] = first_strain['timestamps']
        
        # Add strain values to response
        for strain_type, data in strain_dict.items():
            response["strains"][strain_type] = data['values']
        
        if not response["timestamps"] and not response["strains"]:
            return {"error": "No data available"}
            
        return response
        
    except Exception as e:
        logger.error(f"Error fetching plot data: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()