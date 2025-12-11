#!/bin/bash
# Load All Data for Brent Spence Project
# This script loads battery and strain data for all piers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Brent Spence - Load All Data${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Make insert script executable
chmod +x insert_data.sh

# Load Pier 1 data (battery and strain)
echo -e "${GREEN}Loading Pier 1 data...${NC}"
./insert_data.sh strain data/pier1/CR1000XESeries_TableR1.csv --pier 1 --clear
./insert_data.sh battery data/pier1/CR1000XESeries_TableR1.csv --pier 1 --clear

echo ""

# Load Pier 2 data (battery and strain)  
echo -e "${GREEN}Loading Pier 2 data...${NC}"
./insert_data.sh strain "data/pier2/CR1000XESeries_TableL1 (1).csv" --pier 2 --clear
./insert_data.sh battery "data/pier2/CR1000XESeries_TableL1 (1).csv" --pier 2 --clear

echo ""

# Load Pier 3 data (battery only)
echo -e "${GREEN}Loading Pier 3 data (battery only)...${NC}"
./insert_data.sh battery "data/CR1000XESeries_TableR2(2).csv" --pier 3 --clear

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All data loaded successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "You can now access the application at: http://localhost:3000"
echo "The data for Pier 1, 2, and 3 is now available for plotting."

