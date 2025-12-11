#!/usr/bin/env python3
"""
Direct File Insertion Script for Brent Spence Project
This script allows direct insertion of CSV files into the database.
"""

import os
import sys
import pandas as pd
import mysql.connector
import argparse
import logging
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.db import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def clear_tables(pier_num, table_type='all'):
    """Clear existing data from pier-specific tables"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        battery_table = f"pier{pier_num}_battery_data"
        strain_table = f"pier{pier_num}_strain_data"
        
        # Clear only the specified table type
        if table_type in ['all', 'battery', 'battv']:
            try:
                cursor.execute(f"DELETE FROM {battery_table}")
                logger.info(f"Cleared {battery_table} table")
            except mysql.connector.Error as e:
                if e.errno != 1146:  # Table doesn't exist error
                    raise
                logger.info(f"{battery_table} table doesn't exist, skipping clear")
        
        if table_type in ['all', 'strain']:
            try:
                cursor.execute(f"DELETE FROM {strain_table}")
                logger.info(f"Cleared {strain_table} table")
            except mysql.connector.Error as e:
                if e.errno != 1146:  # Table doesn't exist error
                    raise
                logger.info(f"{strain_table} table doesn't exist, skipping clear")
        
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Successfully cleared {table_type} table(s) for pier {pier_num}")
    except Exception as e:
        logger.error(f"Error clearing tables: {str(e)}")
        raise

def create_tables(pier_num):
    """Create pier-specific tables if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        battery_table = f"pier{pier_num}_battery_data"
        strain_table = f"pier{pier_num}_strain_data"
        
        # Create battery_data table for this pier
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {battery_table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME(3),
                battv FLOAT
            )
        """)
        
        # Create strain_data table for this pier
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {strain_table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME(3),
                strain_type VARCHAR(20),
                strain_value FLOAT
            )
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Successfully created/verified database tables for pier {pier_num}")
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
        raise

def insert_battery_data(file_path, pier_num):
    """Insert battery data from CSV file into pier-specific table"""
    logger.info(f"Processing battery data from: {file_path} for pier {pier_num}")
    
    try:
        df = pd.read_csv(file_path)
        logger.info(f"Successfully read CSV file. Columns found: {df.columns.tolist()}")
        logger.info(f"Number of rows in CSV: {len(df)}")
    except Exception as e:
        logger.error(f"Error reading CSV file: {str(e)}")
        raise
    
    # Ensure required columns exist
    if 'TIMESTAMP' not in df.columns:
        logger.error("TIMESTAMP column not found in CSV")
        raise ValueError("TIMESTAMP column not found in CSV")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    success_count = 0
    error_count = 0
    values_to_insert = []
    batch_size = 1000
    
    for index, row in df.iterrows():
        try:
            # Parse timestamp
            timestamp_str = str(row['TIMESTAMP'])
            try:
                timestamp = pd.to_datetime(timestamp_str)
                mysql_timestamp = timestamp.strftime('%Y-%m-%d %H:%M:%S')
            except Exception as e:
                logger.error(f"Error parsing timestamp {timestamp_str}: {str(e)}")
                error_count += 1
                continue
            
            # Try to find battery voltage data
            battv = None
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
                
            if pd.isna(battv) or battv <= 0:
                error_count += 1
                continue
                
            values_to_insert.append((mysql_timestamp, battv))
            success_count += 1
            
            # Batch insert
            if len(values_to_insert) >= batch_size:
                battery_table = f"pier{pier_num}_battery_data"
                cursor.executemany(
                    f"INSERT INTO {battery_table} (timestamp, battv) VALUES (%s, %s)",
                    values_to_insert
                )
                conn.commit()
                values_to_insert = []
                
        except (ValueError, KeyError) as e:
            logger.error(f"Error processing battery data at row {index}: {str(e)}")
            error_count += 1
        except Exception as e:
            logger.error(f"Error processing row {index}: {str(e)}")
            error_count += 1
            continue
    
    # Insert any remaining records
    try:
        battery_table = f"pier{pier_num}_battery_data"
        if values_to_insert:
            cursor.executemany(
                f"INSERT INTO {battery_table} (timestamp, battv) VALUES (%s, %s)",
                values_to_insert
            )
            conn.commit()
        
        # Verify data was inserted
        cursor.execute(f"SELECT COUNT(*) FROM {battery_table}")
        count = cursor.fetchone()[0]
        logger.info(f"Verified {count} records in {battery_table} table")
        
    except Exception as e:
        logger.error(f"Error inserting data: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()
    
    logger.info(f"Battery data processing complete. Success: {success_count}, Errors: {error_count}")
    return success_count, error_count, count

def insert_strain_data(file_path, pier_num):
    """Insert strain data from CSV file into pier-specific table"""
    logger.info(f"Processing strain data from: {file_path} for pier {pier_num}")
    
    try:
        df = pd.read_csv(file_path)
        logger.info(f"Successfully read CSV file. Columns found: {df.columns.tolist()}")
        logger.info(f"Number of rows in CSV: {len(df)}")
    except Exception as e:
        logger.error(f"Error reading CSV file: {str(e)}")
        raise
    
    # Ensure required columns exist
    if 'TIMESTAMP' not in df.columns:
        logger.error("TIMESTAMP column not found in CSV")
        raise ValueError("TIMESTAMP column not found in CSV")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    success_count = 0
    error_count = 0
    values_to_insert = []
    batch_size = 1000
    
    for index, row in df.iterrows():
        try:
            # Parse timestamp
            timestamp_str = str(row['TIMESTAMP'])
            try:
                timestamp = pd.to_datetime(timestamp_str)
                mysql_timestamp = timestamp.strftime('%Y-%m-%d %H:%M:%S')
            except Exception as e:
                logger.error(f"Error parsing timestamp {timestamp_str}: {str(e)}")
                error_count += 1
                continue
            
            # Process all strain columns
            strain_columns = [col for col in df.columns if col.startswith('Strain(')]
            for strain_col in strain_columns:
                try:
                    strain_value = float(row[strain_col])
                    if pd.isna(strain_value):
                        continue
                    
                    values_to_insert.append((mysql_timestamp, strain_col, strain_value))
                    success_count += 1
                    
                    # Batch insert
                    if len(values_to_insert) >= batch_size:
                        strain_table = f"pier{pier_num}_strain_data"
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
            logger.error(f"Error processing row {index}: {str(e)}")
            error_count += 1
            continue
    
    # Insert any remaining records
    try:
        strain_table = f"pier{pier_num}_strain_data"
        if values_to_insert:
            cursor.executemany(
                f"INSERT INTO {strain_table} (timestamp, strain_type, strain_value) VALUES (%s, %s, %s)",
                values_to_insert
            )
            conn.commit()
        
        # Verify data was inserted
        cursor.execute(f"SELECT COUNT(*) FROM {strain_table}")
        count = cursor.fetchone()[0]
        logger.info(f"Verified {count} records in {strain_table} table")
        
    except Exception as e:
        logger.error(f"Error inserting data: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()
    
    logger.info(f"Strain data processing complete. Success: {success_count}, Errors: {error_count}")
    return success_count, error_count, count

def main():
    parser = argparse.ArgumentParser(description='Insert CSV files directly into the database')
    parser.add_argument('file_path', help='Path to CSV file')
    parser.add_argument('--type', choices=['battv', 'strain'], required=True, help='Data type (battv or strain)')
    parser.add_argument('--pier', type=int, choices=[1, 2, 3], required=True, help='Pier number (1, 2, or 3)')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before insertion')
    parser.add_argument('--no-clear', action='store_true', help='Do not clear existing data (default behavior)')
    
    args = parser.parse_args()
    
    # Check if file exists
    if not os.path.exists(args.file_path):
        logger.error(f"File not found: {args.file_path}")
        sys.exit(1)
    
    try:
        # Create tables if they don't exist
        create_tables(args.pier)
        
        # Clear existing data if requested (only the table being inserted)
        if args.clear:
            clear_tables(args.pier, args.type)
        
        # Process the file based on type
        if args.type == 'battv':
            success_count, error_count, db_count = insert_battery_data(args.file_path, args.pier)
            print(f"\n✅ Battery data insertion completed for Pier {args.pier}!")
            print(f"   Successfully processed: {success_count} rows")
            print(f"   Errors: {error_count} rows")
            print(f"   Total records in database: {db_count}")
        else:
            success_count, error_count, db_count = insert_strain_data(args.file_path, args.pier)
            print(f"\n✅ Strain data insertion completed for Pier {args.pier}!")
            print(f"   Successfully processed: {success_count} rows")
            print(f"   Errors: {error_count} rows")
            print(f"   Total records in database: {db_count}")
        
        if success_count == 0:
            logger.error("No valid data rows were processed. Please check your file format and column names.")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
