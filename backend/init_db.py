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

        # Create tables for each pier
        logger.info("Creating tables for all piers...")
        
        for pier_num in [1, 2, 3]:
            battery_table = f"pier{pier_num}_battery_data"
            strain_table = f"pier{pier_num}_strain_data"
            
            # Create battery_data table for this pier
            cursor.execute(f"""
                CREATE TABLE {battery_table} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME,
                    battv FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            logger.info(f"{battery_table} table created")

            # Create strain_data table for this pier
            cursor.execute(f"""
                CREATE TABLE {strain_table} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME,
                    strain_type VARCHAR(20),
                    strain_value FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            logger.info(f"{strain_table} table created")

            # Add indexes for better performance
            cursor.execute(f"CREATE INDEX idx_{battery_table}_timestamp ON {battery_table}(timestamp)")
            cursor.execute(f"CREATE INDEX idx_{strain_table}_timestamp ON {strain_table}(timestamp)")
            cursor.execute(f"CREATE INDEX idx_{strain_table}_type ON {strain_table}(strain_type)")
            logger.info(f"Indexes created for pier {pier_num}")
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