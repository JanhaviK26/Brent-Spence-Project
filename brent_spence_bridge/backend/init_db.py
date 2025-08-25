import mysql.connector
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    try:
        # First connect without database
        logger.info("Connecting to MySQL...")
        conn = mysql.connector.connect(
            host="db",
            user="root",
            password="34KWIDR"
        )
        cursor = conn.cursor()

        # Create database if it doesn't exist
        logger.info("Creating database if it doesn't exist...")
        cursor.execute("DROP DATABASE IF EXISTS brent_db1")  # Reset database
        cursor.execute("CREATE DATABASE brent_db1")
        cursor.execute("USE brent_db1")
        logger.info("Using database brent_db1")

        # Create tables
        logger.info("Creating tables if they don't exist...")
        
        # Create battery_data table
        cursor.execute("""
            CREATE TABLE battery_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME,
                battv FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        logger.info("battery_data table created")

        # Create strain_data table
        cursor.execute("""
            CREATE TABLE strain_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME,
                strain_type VARCHAR(20),
                strain_value FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        logger.info("strain_data table created")

        # Add indexes for better performance
        cursor.execute("CREATE INDEX idx_battery_timestamp ON battery_data(timestamp)")
        cursor.execute("CREATE INDEX idx_strain_timestamp ON strain_data(timestamp)")
        cursor.execute("CREATE INDEX idx_strain_type ON strain_data(strain_type)")
        logger.info("Indexes created")
        # Show tables for verification
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        logger.info(f"Tables in database: {[table[0] for table in tables]}")

        cursor.close()
        conn.close()
        logger.info("Database initialization complete")
        return True

    except mysql.connector.Error as err:
        logger.error(f"Error initializing database: {err}")
        return False

if __name__ == "__main__":
    init_database()