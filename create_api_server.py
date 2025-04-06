with open('api_server.py', 'w') as f:
    f.write('''import sqlite3
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

app = FastAPI(title="Smart Inventory API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

DATABASE_PATH = "inventory.db"

# Database connection
def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Pydantic models
class Vendor(BaseModel):
    id: Optional[int] = None
    product_id: int
    name: str
    contact_person: str
    email: str
    phone: str
    price: float

class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: float
    status: str
    qr_code: Optional[str] = None
    current_stock: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProductWithVendors(BaseModel):
    id: int
    name: str
    description: str
    price: float
    status: str
    qr_code: Optional[str] = None
    current_stock: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    vendors: List[Vendor] = []

class Sale(BaseModel):
    id: Optional[int] = None
    customer_name: str
    total_amount: float
    sale_date: Optional[datetime] = None
    payment_method: str
    items: List[dict] = []

class Feedback(BaseModel):
    id: Optional[int] = None
    sale_id: int
    rating: int
    comments: str
    feedback_date: Optional[datetime] = None

class SalesForecast(BaseModel):
    id: Optional[int] = None
    product_id: int
    forecast_date: date
    predicted_quantity: int
    predicted_price: float
    confidence_level: float

class StockForecast(BaseModel):
    id: Optional[int] = None
    product_id: int
    forecast_date: date
    predicted_stock: int
    stockout_risk: float

# API endpoints
@app.get("/")
async def root():
    return {"message": "Smart Inventory API is running"}

# Products endpoints
@app.get("/products", response_model=List[Product])
async def get_products(db: sqlite3.Connection = Depends(get_db)):
    products = db.execute("SELECT * FROM products").fetchall()
    return [dict(product) for product in products]

@app.get("/products/{product_id}", response_model=ProductWithVendors)
async def get_product(product_id: int, db: sqlite3.Connection = Depends(get_db)):
    product = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_dict = dict(product)
    vendors = db.execute("SELECT * FROM vendors WHERE product_id = ?", (product_id,)).fetchall()
    product_dict["vendors"] = [dict(vendor) for vendor in vendors]
    
    return product_dict

@app.post("/products", response_model=Product)
async def create_product(product: Product, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    now = datetime.now()
    cursor.execute(
        "INSERT INTO products (name, description, price, status, qr_code, current_stock, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (product.name, product.description, product.price, product.status, product.qr_code, 
         product.current_stock, now, now)
    )
    db.commit()
    product_id = cursor.lastrowid
    return {**product.dict(), "id": product_id, "created_at": now, "updated_at": now}

@app.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: int, product: Product, db: sqlite3.Connection = Depends(get_db)):
    existing = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    now = datetime.now()
    db.execute(
        "UPDATE products SET name = ?, description = ?, price = ?, status = ?, "
        "qr_code = ?, current_stock = ?, updated_at = ? WHERE id = ?",
        (product.name, product.description, product.price, product.status, 
         product.qr_code, product.current_stock, now, product_id)
    )
    db.commit()
    
    updated = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    return dict(updated)

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: sqlite3.Connection = Depends(get_db)):
    existing = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.execute("DELETE FROM vendors WHERE product_id = ?", (product_id,))
    db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
    
    return {"message": "Product deleted successfully"}

# Vendors endpoints
@app.get("/vendors", response_model=List[Vendor])
async def get_vendors(db: sqlite3.Connection = Depends(get_db)):
    vendors = db.execute("SELECT * FROM vendors").fetchall()
    return [dict(vendor) for vendor in vendors]

@app.get("/vendors/{vendor_id}", response_model=Vendor)
async def get_vendor(vendor_id: int, db: sqlite3.Connection = Depends(get_db)):
    vendor = db.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return dict(vendor)

@app.post("/vendors", response_model=Vendor)
async def create_vendor(vendor: Vendor, db: sqlite3.Connection = Depends(get_db)):
    # Verify product exists
    product = db.execute("SELECT id FROM products WHERE id = ?", (vendor.product_id,)).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO vendors (product_id, name, contact_person, email, phone, price) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (vendor.product_id, vendor.name, vendor.contact_person, vendor.email, vendor.phone, vendor.price)
    )
    db.commit()
    vendor_id = cursor.lastrowid
    return {**vendor.dict(), "id": vendor_id}

# Sales endpoints
@app.get("/sales", response_model=List[Sale])
async def get_sales(limit: int = Query(10, ge=1, le=100), db: sqlite3.Connection = Depends(get_db)):
    sales = db.execute("SELECT * FROM sales ORDER BY sale_date DESC LIMIT ?", (limit,)).fetchall()
    result = []
    
    for sale in sales:
        sale_dict = dict(sale)
        items = db.execute(
            "SELECT si.*, p.name as product_name FROM sale_items si "
            "JOIN products p ON si.product_id = p.id "
            "WHERE si.sale_id = ?", 
            (sale_dict["id"],)
        ).fetchall()
        sale_dict["items"] = [dict(item) for item in items]
        result.append(sale_dict)
    
    return result

@app.post("/sales", response_model=Sale)
async def create_sale(sale: Sale, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    now = datetime.now()
    
    # Insert sale
    cursor.execute(
        "INSERT INTO sales (customer_name, total_amount, sale_date, payment_method) "
        "VALUES (?, ?, ?, ?)",
        (sale.customer_name, sale.total_amount, now, sale.payment_method)
    )
    sale_id = cursor.lastrowid
    
    # Insert sale items
    for item in sale.items:
        cursor.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            (sale_id, item["product_id"], item["quantity"], item["price"])
        )
        
        # Update product stock
        cursor.execute(
            "UPDATE products SET current_stock = current_stock - ? WHERE id = ?",
            (item["quantity"], item["product_id"])
        )
    
    db.commit()
    return {**sale.dict(), "id": sale_id, "sale_date": now}

# Forecasts endpoints
@app.get("/forecasts/sales", response_model=List[SalesForecast])
async def get_sales_forecasts(days: int = Query(15, ge=1, le=30), db: sqlite3.Connection = Depends(get_db)):
    forecasts = db.execute(
        "SELECT * FROM sales_forecasts WHERE DATE(forecast_date) >= DATE('now') "
        "ORDER BY forecast_date LIMIT ?", 
        (days,)
    ).fetchall()
    return [dict(forecast) for forecast in forecasts]

@app.get("/forecasts/stock", response_model=List[StockForecast])
async def get_stock_forecasts(days: int = Query(15, ge=1, le=30), db: sqlite3.Connection = Depends(get_db)):
    forecasts = db.execute(
        "SELECT * FROM stock_forecasts WHERE DATE(forecast_date) >= DATE('now') "
        "ORDER BY forecast_date LIMIT ?", 
        (days,)
    ).fetchall()
    return [dict(forecast) for forecast in forecasts]

@app.get("/forecasts/risk")
async def get_risk_products(risk_threshold: float = Query(0.5, ge=0, le=1), db: sqlite3.Connection = Depends(get_db)):
    risky_products = db.execute(
        """
        SELECT p.id, p.name, p.current_stock, sf.forecast_date, sf.predicted_stock, sf.stockout_risk
        FROM products p
        JOIN stock_forecasts sf ON p.id = sf.product_id
        WHERE sf.stockout_risk >= ?
        AND DATE(sf.forecast_date) >= DATE('now')
        AND DATE(sf.forecast_date) <= DATE('now', '+7 days')
        ORDER BY sf.stockout_risk DESC
        """,
        (risk_threshold,)
    ).fetchall()
    return [dict(product) for product in risky_products]

# Dashboard data
@app.get("/dashboard/summary")
async def get_dashboard_summary(db: sqlite3.Connection = Depends(get_db)):
    # Total products
    total_products = db.execute("SELECT COUNT(*) as count FROM products").fetchone()["count"]
    
    # Low stock products
    low_stock = db.execute(
        "SELECT COUNT(*) as count FROM products WHERE current_stock < 5"
    ).fetchone()["count"]
    
    # Total sales for current month
    current_month_sales = db.execute(
        "SELECT SUM(total_amount) as total FROM sales WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')"
    ).fetchone()
    total_sales = current_month_sales["total"] if current_month_sales["total"] else 0
    
    # High-risk products
    high_risk = db.execute(
        """
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        JOIN stock_forecasts sf ON p.id = sf.product_id
        WHERE sf.stockout_risk > 0.7
        AND DATE(sf.forecast_date) <= DATE('now', '+7 days')
        """
    ).fetchone()["count"]
    
    return {
        "total_products": total_products,
        "low_stock_products": low_stock,
        "total_monthly_sales": total_sales,
        "high_risk_products": high_risk
    }

# Run with: uvicorn api_server:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
''')
print("FastAPI server file created successfully at api_server.py") 