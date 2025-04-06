import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:9000/ws"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            # Send a test message
            test_message = {"message": "Hello WebSocket"}
            print(f"Sending: {test_message}")
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Error: {e}")

# Run the async function
if __name__ == "__main__":
    print("Testing WebSocket connection...")
    asyncio.run(test_websocket()) 