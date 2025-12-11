#!/bin/bash
# CLI Tool for Direct File Insertion - Brent Spence Project
# This script provides easy commands to insert CSV files into the database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="brent-backend"
DATA_DIR="./data"
SCRIPT_PATH="/app/backend/direct_insert.py"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker container is running
check_container() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "Container '$CONTAINER_NAME' is not running!"
        print_info "Please start the containers with: docker-compose up -d"
        exit 1
    fi
}

# Function to copy file to container
copy_file_to_container() {
    local file_path="$1"
    local filename=$(basename "$file_path")
    
    print_info "Copying file to container..." >&2
    docker cp "$file_path" "$CONTAINER_NAME:/app/data/$filename" >&2
    
    if [ $? -eq 0 ]; then
        print_success "File copied successfully to container" >&2
        echo "/app/data/$filename"
    else
        print_error "Failed to copy file to container" >&2
        exit 1
    fi
}

# Function to insert battery data
insert_battery() {
    local file_path="$1"
    local clear_data="$2"
    local pier_num="$3"
    
    print_info "Inserting battery data from: $file_path for Pier $pier_num"
    
    # Copy file to container
    local container_path=$(copy_file_to_container "$file_path")
    
    # Build command arguments
    local args=("python3" "$SCRIPT_PATH" "$container_path" "--type" "battv" "--pier" "$pier_num")
    if [ "$clear_data" = "true" ]; then
        args+=("--clear")
    fi
    
    # Execute command in container
    print_info "Executing insertion command..."
    docker exec "$CONTAINER_NAME" "${args[@]}"
    
    if [ $? -eq 0 ]; then
        print_success "Battery data insertion completed for Pier $pier_num!"
    else
        print_error "Battery data insertion failed!"
        exit 1
    fi
}

# Function to insert strain data
insert_strain() {
    local file_path="$1"
    local clear_data="$2"
    local pier_num="$3"
    
    print_info "Inserting strain data from: $file_path for Pier $pier_num"
    
    # Copy file to container
    local container_path=$(copy_file_to_container "$file_path")
    
    # Build command arguments
    local args=("python3" "$SCRIPT_PATH" "$container_path" "--type" "strain" "--pier" "$pier_num")
    if [ "$clear_data" = "true" ]; then
        args+=("--clear")
    fi
    
    # Execute command in container
    print_info "Executing insertion command..."
    docker exec "$CONTAINER_NAME" "${args[@]}"
    
    if [ $? -eq 0 ]; then
        print_success "Strain data insertion completed for Pier $pier_num!"
    else
        print_error "Strain data insertion failed!"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Brent Spence Project - Direct File Insertion CLI Tool"
    echo ""
    echo "Usage: $0 [COMMAND] FILE [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  battery FILE     Insert battery data from CSV file"
    echo "  strain FILE      Insert strain data from CSV file"
    echo "  help             Show this help message"
    echo ""
    echo "Options:"
    echo "  --pier NUM       Pier number (1, 2, or 3) - default: 1"
    echo "  --clear          Clear existing data before insertion"
    echo "  --no-clear       Do not clear existing data (default)"
    echo ""
    echo "Examples:"
    echo "  $0 battery data/pier1/battery.csv --pier 1"
    echo "  $0 strain data/pier1/strain.csv --pier 1 --clear"
    echo "  $0 battery data/battery.csv --pier 2"
    echo ""
    echo "File Requirements:"
    echo "  - CSV files must have a 'TIMESTAMP' column"
    echo "  - Battery files should have battery voltage columns (BattV_Min, etc.)"
    echo "  - Strain files should have 'Strain(1)', 'Strain(2)', etc. columns"
    echo ""
    echo "Prerequisites:"
    echo "  - Docker containers must be running (docker-compose up -d)"
    echo "  - Files will be copied to the container automatically"
}

# Function to check prerequisites
check_prerequisites() {
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if container is running
    check_container
    
    # Check if data directory exists
    if [ ! -d "$DATA_DIR" ]; then
        print_warning "Data directory '$DATA_DIR' does not exist, creating it..."
        mkdir -p "$DATA_DIR"
    fi
}

# Main script logic
main() {
    # Check prerequisites
    check_prerequisites
    
    # Parse arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    local command="$1"
    local file_path=""
    local clear_data="false"
    local pier_num="1"
    
    # Parse remaining arguments
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --pier)
                pier_num="$2"
                shift 2
                ;;
            --clear)
                clear_data="true"
                shift
                ;;
            --no-clear)
                clear_data="false"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$file_path" ]; then
                    file_path="$1"
                else
                    print_error "Unknown argument: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Validate file path
    if [ -z "$file_path" ]; then
        print_error "File path is required"
        show_help
        exit 1
    fi
    
    if [ ! -f "$file_path" ]; then
        print_error "File does not exist: $file_path"
        exit 1
    fi
    
    # Validate pier number
    if [[ ! "$pier_num" =~ ^[1-3]$ ]]; then
        print_error "Invalid pier number: $pier_num (must be 1, 2, or 3)"
        exit 1
    fi
    
    # Execute command
    case "$command" in
        battery)
            insert_battery "$file_path" "$clear_data" "$pier_num"
            ;;
        strain)
            insert_strain "$file_path" "$clear_data" "$pier_num"
            ;;
        help)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
