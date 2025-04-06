# QR Generator Server Production Deployment Guide

This guide explains how to deploy the QR Generator server in a production environment.

## Options for Production Deployment

### 1. Automatic Management (Recommended)

The system has been set up to automatically manage the QR Generator server. When a user clicks the "SCAN QR" button, the system will:

1. Check if the QR Generator server is already running
2. If not, automatically start it using a production WSGI server (Gunicorn)
3. Show feedback to the user about the server status

No additional configuration is needed for this to work, as long as the API server is running.

### 2. Manual Management with Bash Script

You can manually start and manage the QR Generator server using the provided bash script:

```bash
# Start the server in foreground mode
./start_qr_server.sh

# Start the server in background (daemon) mode
./start_qr_server.sh daemon
```

The script will handle checking if the server is already running and will install Gunicorn if needed.

### 3. Systemd Service (For Linux Servers)

For a more robust production deployment on Linux servers, you can use the provided systemd service file:

1. Edit the `qr-generator.service` file to set the correct paths:
   ```
   WorkingDirectory=/path/to/your/app
   ExecStart=/usr/bin/python3 /path/to/your/app/qr_generator_wsgi.py
   ```

2. Install the service:
   ```bash
   sudo cp qr-generator.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable qr-generator
   sudo systemctl start qr-generator
   ```

3. Check the service status:
   ```bash
   sudo systemctl status qr-generator
   ```

4. View logs:
   ```bash
   sudo journalctl -u qr-generator -f
   ```

## Requirements

- Python 3.6 or higher
- Gunicorn (`pip install gunicorn`)
- QR Code library (`pip install qrcode`)
- Flask (`pip install flask flask-cors`)

## Additional Configuration

### Gunicorn Options

You can customize the Gunicorn configuration by editing the `qr_generator_wsgi.py` file. The following options are available:

```python
options = {
    'bind': '127.0.0.1:5001',  # Change to '0.0.0.0:5001' to allow external access
    'workers': 2,               # Number of worker processes
    'timeout': 30,              # Timeout in seconds
    'accesslog': '-',           # Access log file (- for stdout)
    'errorlog': '-',            # Error log file (- for stdout)
    'reload': True,             # Auto-reload on code changes (set to False in production)
    'daemon': False             # Run in daemon mode (background)
}
```

### Security Considerations

- The QR Generator server is configured to listen only on localhost (127.0.0.1) by default
- To expose it to your network, change the bind address to '0.0.0.0:5001'
- Consider setting up a reverse proxy (Nginx, Apache) for added security
- Use HTTPS in production

## Troubleshooting

If you encounter issues with the QR Generator server:

1. Check if the server is running:
   ```bash
   python qr_server_manager.py status
   ```

2. Start the server manually:
   ```bash
   python qr_server_manager.py start
   ```

3. Check the logs:
   ```bash
   cat qr_generator.log
   ```

4. Ensure gunicorn is installed:
   ```bash
   pip install gunicorn
   ```

5. Test the QR Generator API directly:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"data":"test"}' http://localhost:5001/generate-qr
   ```

## API Endpoints

- **Generate QR Code**: `POST http://localhost:5001/generate-qr`
  ```json
  {
    "data": "product_name_or_id"
  }
  ```

- **Check Server Status**: `GET http://localhost:9000/api/qr-server-status`
- **Start Server**: `POST http://localhost:9000/api/start-qr-server` 