from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import webbrowser
import websockets
import asyncio
import json
import threading

class ReloadHandler(FileSystemEventHandler):
    def __init__(self, websocket_server):
        self.websocket_server = websocket_server

    def on_modified(self, event):
        if event.src_path.endswith(('.html', '.css', '.js')):
            print(f"File {event.src_path} has been modified")
            asyncio.run(self.websocket_server.notify_clients())

class WebSocketServer:
    def __init__(self):
        self.clients = set()

    async def register(self, websocket):
        self.clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    async def notify_clients(self):
        if self.clients:
            message = json.dumps({"type": "reload"})
            await asyncio.gather(
                *[client.send(message) for client in self.clients]
            )

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return SimpleHTTPRequestHandler.do_GET(self)

async def start_websocket_server(websocket_server):
    async with websockets.serve(
        websocket_server.register,
        "localhost",
        8001
    ):
        await asyncio.Future()  # run forever

def run_http_server(port=8000):
    with socketserver.TCPServer(("", port), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{port}")
        webbrowser.open(f'http://localhost:{port}')
        httpd.serve_forever()

def main():
    # Create WebSocket server
    websocket_server = WebSocketServer()
    
    # Start WebSocket server in a separate thread
    websocket_thread = threading.Thread(
        target=lambda: asyncio.run(start_websocket_server(websocket_server))
    )
    websocket_thread.daemon = True
    websocket_thread.start()
    
    # Set up file watching
    event_handler = ReloadHandler(websocket_server)
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    observer.start()
    
    try:
        # Start HTTP server
        run_http_server()
    except KeyboardInterrupt:
        observer.stop()
        observer.join()
        print("\nServer stopped.")

if __name__ == '__main__':
    main() 