#!/usr/bin/env python3
import os
import sys
import subprocess
import socket
import time
import signal
import json
from pathlib import Path

def check_server(port=5001):
    """Check if the server is running on the specified port"""
    pid_file = 'qr_generator.pid'
    
    # Check if PID file exists and process is running
    if os.path.exists(pid_file):
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            # Check if process is still running
            os.kill(pid, 0)  # This doesn't actually kill the process, just checks if it exists
            return {"running": True, "pid": pid}
        except (OSError, ValueError):
            # Process doesn't exist or invalid PID
            if os.path.exists(pid_file):
                try:
                    os.unlink(pid_file)
                except:
                    pass
    
    # Also check if port is already in use
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    
    if result == 0:
        return {"running": True, "pid": None}
    
    return {"running": False}

def start_server(port=5001):
    """Start the QR generator server"""
    status = check_server(port)
    
    if status.get("running"):
        return {"success": True, "message": f"Server is already running on port {port}", "pid": status.get("pid")}
    
    # Get the path of the qr_generator_wsgi.py file
    script_dir = Path(__file__).parent.absolute()
    wsgi_path = script_dir / "qr_generator_wsgi.py"
    
    # Make the script executable
    try:
        os.chmod(wsgi_path, 0o755)
    except:
        pass
    
    # Start the server as a background process
    try:
        # Check if gunicorn is installed
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "gunicorn"], 
                          check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except:
            # If gunicorn installation fails, fall back to default server
            process = subprocess.Popen([sys.executable, "qr_generator.py"], 
                                      stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE)
            return {"success": True, "message": f"Started QR generator using development server on port {port}", "pid": process.pid}
        
        # Start with gunicorn
        process = subprocess.Popen([sys.executable, str(wsgi_path)], 
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE)
        
        # Wait a moment to check if server started successfully
        time.sleep(2)
        status = check_server(port)
        
        if status.get("running"):
            return {"success": True, "message": f"Started QR generator server on port {port}", "pid": process.pid}
        else:
            return {"success": False, "message": "Failed to start QR generator server"}
    except Exception as e:
        return {"success": False, "message": f"Error starting server: {str(e)}"}

def stop_server():
    """Stop the QR generator server"""
    status = check_server()
    
    if not status.get("running"):
        return {"success": True, "message": "Server is not running"}
    
    pid_file = 'qr_generator.pid'
    
    if os.path.exists(pid_file):
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Try to terminate gracefully
            os.kill(pid, signal.SIGTERM)
            
            # Wait a moment to check if server stopped
            time.sleep(2)
            
            # Force kill if still running
            try:
                os.kill(pid, 0)
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
            
            if os.path.exists(pid_file):
                os.unlink(pid_file)
            
            return {"success": True, "message": f"Stopped QR generator server (PID: {pid})"}
        except (OSError, ValueError) as e:
            if os.path.exists(pid_file):
                os.unlink(pid_file)
            return {"success": False, "message": f"Error stopping server: {str(e)}"}
    
    return {"success": False, "message": "Could not find PID file"}

if __name__ == "__main__":
    # Command line interface
    if len(sys.argv) < 2:
        print("Usage: python qr_server_manager.py [start|stop|status]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        result = start_server()
        print(result["message"])
        sys.exit(0 if result["success"] else 1)
    
    elif command == "stop":
        result = stop_server()
        print(result["message"])
        sys.exit(0 if result["success"] else 1)
    
    elif command == "status":
        status = check_server()
        if status.get("running"):
            print(f"QR generator server is running" + (f" (PID: {status.get('pid')})" if status.get("pid") else ""))
        else:
            print("QR generator server is not running")
        sys.exit(0)
    
    else:
        print(f"Unknown command: {command}")
        print("Usage: python qr_server_manager.py [start|stop|status]")
        sys.exit(1)
        
# API functions for use in other scripts
def server_status():
    """Get server status as a dict"""
    return check_server()

def ensure_server_running():
    """Make sure the server is running, starting it if needed"""
    status = check_server()
    if not status.get("running"):
        return start_server()
    return {"success": True, "message": "Server is already running", "pid": status.get("pid")} 