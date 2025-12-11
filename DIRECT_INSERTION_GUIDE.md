# Brent Spence Project - Direct File Insertion Guide

## Overview
The upload button has been **permanently removed** from the frontend. All file insertions now use direct database insertion methods.

## Quick Start

### Method 1: Using the CLI Tool (Recommended)
```bash
# Insert battery data
./insert_data.sh battery data/your_battery_file.csv

# Insert strain data
./insert_data.sh strain data/your_strain_file.csv

# Clear existing data before insertion
./insert_data.sh battery data/your_file.csv --clear
```

### Method 2: Using Docker Commands
```bash
# Copy file to container
docker cp your_file.csv brent-backend:/app/data/

# Insert battery data
docker exec -it brent-backend python3 /app/direct_insert.py /app/data/your_file.csv --type battv

# Insert strain data
docker exec -it brent-backend python3 /app/direct_insert.py /app/data/your_file.csv --type strain
```

### Method 3: Using the API Endpoint
```bash
# Insert battery data
curl -X POST http://localhost:5001/insert-direct \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/app/data/your_file.csv", "type": "battv"}'

# Insert strain data
curl -X POST http://localhost:5001/insert-direct \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/app/data/your_file.csv", "type": "strain"}'
```

## File Requirements

### CSV File Format
- **Required Column**: `TIMESTAMP` (in any standard datetime format)
- **Battery Files**: Should contain battery voltage columns (e.g., `BattV_Min`, `RECORD`, or any column with 'batt', 'voltage', 'volt', 'v' in the name)
- **Strain Files**: Should contain strain gauge columns (e.g., `Strain(1)`, `Strain(2)`, etc.)

### Example CSV Structure
```csv
TIMESTAMP,BattV_Min,Strain(1),Strain(2),Strain(3)
1/1/2024 12:00,12.5,100.2,98.7,102.1
1/1/2024 12:01,12.4,99.8,97.9,101.8
```

## Prerequisites

1. **Docker containers must be running**:
   ```bash
   docker-compose up -d
   ```

2. **Data directory exists** (automatically created):
   ```bash
   mkdir -p ./data
   ```

## CLI Tool Options

### Commands
- `battery FILE` - Insert battery data from CSV file
- `strain FILE` - Insert strain data from CSV file
- `help` - Show help message

### Options
- `--clear` - Clear existing data before insertion
- `--no-clear` - Do not clear existing data (default)

### Examples
```bash
# Basic usage
./insert_data.sh battery data/battery_data.csv
./insert_data.sh strain data/strain_data.csv

# With data clearing
./insert_data.sh battery data/new_data.csv --clear

# Help
./insert_data.sh help
```

## Troubleshooting

### Container Not Running
```bash
# Check container status
docker ps

# Start containers
docker-compose up -d
```

### File Not Found
```bash
# Check if file exists
ls -la data/your_file.csv

# Check container file system
docker exec -it brent-backend ls -la /app/data/
```

### Database Connection Issues
```bash
# Check database container
docker logs brent-mysql

# Check backend container
docker logs brent-backend
```

### Permission Issues
```bash
# Make scripts executable
chmod +x insert_data.sh
chmod +x backend/direct_insert.py
```

## Data Verification

### Check Database Contents
```bash
# Connect to MySQL
docker exec -it brent-mysql mysql -u root -p34KWIDR brent_db1

# Check battery data
SELECT COUNT(*) FROM battery_data;
SELECT * FROM battery_data LIMIT 5;

# Check strain data
SELECT COUNT(*) FROM strain_data;
SELECT strain_type, COUNT(*) FROM strain_data GROUP BY strain_type;
```

### View Data in Web Interface
- Navigate to `http://localhost:3000`
- The data will automatically appear in the charts
- No upload button is needed - data is loaded directly from the database

## Migration from Upload Button

### What Changed
- ✅ Upload button **permanently removed** from frontend
- ✅ Direct file insertion methods implemented
- ✅ Volume mount added for easy file access
- ✅ CLI tool created for simple operations
- ✅ API endpoint available for programmatic access

### Benefits
- **Faster**: No file upload through web interface
- **More reliable**: Direct database insertion
- **Flexible**: Multiple insertion methods available
- **Automated**: Can be scripted and automated
- **Secure**: No web-based file uploads

## Support

If you encounter any issues:
1. Check that Docker containers are running
2. Verify file format matches requirements
3. Check container logs for error messages
4. Ensure proper file permissions

The system is now configured for **permanent direct file insertion** without any upload button dependency.
