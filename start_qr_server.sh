#!/bin/bash

# This script starts the QR generator server using the production WSGI server (Gunicorn)

# Get the absolute path of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Check if gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "Gunicorn is not installed. Installing now..."
    pip install gunicorn
fi

# Check if the server is already running
if [ -f "qr_generator.pid" ]; then
    PID=$(cat qr_generator.pid)
    if ps -p $PID > /dev/null; then
        echo "QR Generator server is already running with PID $PID"
        exit 0
    else
        echo "Removing stale PID file"
        rm qr_generator.pid
    fi
fi

# Start the server using the WSGI wrapper
echo "Starting QR Generator server..."
if [ "$1" == "daemon" ]; then
    # Run in daemon mode (background)
    python qr_generator_wsgi.py > qr_generator.log 2>&1 &
    echo $! > qr_generator.pid
    echo "Server started in background with PID $!"
    echo "Logs are available in qr_generator.log"
else
    # Run in foreground
    python qr_generator_wsgi.py
fi 