from fastapi import FastAPI, HTTPException
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Test API Server is running"}

@app.get("/api/")
async def api_root():
    return {"message": "API root endpoint"}

@app.get("/api/test")
async def test():
    return {"message": "Test endpoint working"}

@app.get("/api/products")
async def products():
    return [{"id": 1, "name": "Test Product"}]

@app.get("/{file_path:path}")
async def catch_all(file_path: str):
    # Skip if it's an API route
    if file_path.startswith("api/"):
        raise HTTPException(status_code=404, detail=f"API endpoint not found: {file_path}")
    
    return {"file": file_path}

if __name__ == "__main__":
    print("Starting test API server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000) 