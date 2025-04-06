#!/usr/bin/env python3
from qr_generator import app
import gunicorn.app.base
import os
import sys
import signal
import atexit
import socket

class GunicornApplication(gunicorn.app.base.BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        for key, value in self.options.items():
            if key in self.cfg.settings and value is not None:
                self.cfg.set(key.lower(), value)

    def load(self):
        return self.application

# Create a PID file to track the server process
def create_pid_file(pid_file):
    with open(pid_file, 'w') as f:
        f.write(str(os.getpid()))
    
    # Register cleanup function
    atexit.register(lambda: os.unlink(pid_file) if os.path.exists(pid_file) else None)

# Function to check if server is already running
def is_server_running(port):
    # Check if PID file exists and process is running
    pid_file = 'qr_generator.pid'
    if os.path.exists(pid_file):
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            # Check if process is still running
            os.kill(pid, 0)  # This doesn't actually kill the process, just checks if it exists
            return True
        except (OSError, ValueError):
            # Process doesn't exist or invalid PID
            if os.path.exists(pid_file):
                os.unlink(pid_file)
    
    # Also check if port is already in use
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result == 0

if __name__ == '__main__':
    port = 5001
    pid_file = 'qr_generator.pid'
    
    # Check if server is already running
    if is_server_running(port):
        print(f"QR Generator server is already running on port {port}")
        sys.exit(0)
    
    # Create PID file
    create_pid_file(pid_file)
    
    # Set up graceful shutdown
    def handle_exit_signal(signum, frame):
        print("Shutting down QR Generator server...")
        if os.path.exists(pid_file):
            os.unlink(pid_file)
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, handle_exit_signal)
    signal.signal(signal.SIGINT, handle_exit_signal)
    
    # Start the server with Gunicorn
    options = {
        'bind': f'127.0.0.1:{port}',
        'workers': 2,
        'timeout': 30,
        'accesslog': '-',
        'errorlog': '-',
        'reload': True,
        'daemon': False
    }
    
    print(f"Starting QR Generator server on http://127.0.0.1:{port}")
    GunicornApplication(app, options).run() 