import mysql.connector
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database():
    try:
        # Connect to database
        logger.info("Connecting to MySQL...")
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="34KWIDR",
            database="brent_db1"
        )
        cursor = conn.cursor(dictionary=True)

        # Check strain data
        logger.info("\nChecking strain_data table:")
        cursor.execute("SELECT COUNT(*) as count FROM strain_data")
        count = cursor.fetchone()
        logger.info(f"Total strain records: {count['count']}")

        cursor.execute("SELECT strain_type, COUNT(*) as count FROM strain_data GROUP BY strain_type")
        strain_types = cursor.fetchall()
        logger.info("Records by strain type:")
        for strain in strain_types:
            logger.info(f"  {strain['strain_type']}: {strain['count']} records")

        # Show sample strain data
        logger.info("\nSample strain data:")
        cursor.execute("SELECT * FROM strain_data LIMIT 5")
        samples = cursor.fetchall()
        for sample in samples:
            logger.info(f"  {sample}")

        # Check battery data
        logger.info("\nChecking battery_data table:")
        cursor.execute("SELECT COUNT(*) as count FROM battery_data")
        count = cursor.fetchone()
        logger.info(f"Total battery records: {count['count']}")

        # Show sample battery data
        logger.info("\nSample battery data:")
        cursor.execute("SELECT * FROM battery_data LIMIT 5")
        samples = cursor.fetchall()
        for sample in samples:
            logger.info(f"  {sample}")

        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        logger.error(f"Database error: {err}")

if __name__ == "__main__":
    check_database() 