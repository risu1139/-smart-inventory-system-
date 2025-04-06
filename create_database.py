import sqlite3
import os
import random
import datetime
from dateutil.relativedelta import relativedelta
from contextlib import contextmanager

# Path to the database file
DB_PATH = 'inventory.db'

# Remove existing database if it exists
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

# Connect to the SQLite database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create the tables according to the schema
def create_tables():
    # Users table
    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Customers table
    cursor.execute('''
    CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        total_purchases INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        last_purchase_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Products table
    cursor.execute('''
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        status TEXT DEFAULT 'active',
        qr_code TEXT,
        qr_image TEXT,
        current_stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Vendors table
    cursor.execute('''
    CREATE TABLE vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        contact TEXT,
        email TEXT,
        phone TEXT,
        price REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    ''')

    # Sales forecasts table
    cursor.execute('''
    CREATE TABLE sales_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        date DATE NOT NULL,
        predicted_quantity INTEGER NOT NULL,
        predicted_price REAL NOT NULL,
        confidence_level REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, date)
    )
    ''')

    # Stock forecasts table
    cursor.execute('''
    CREATE TABLE stock_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        date DATE NOT NULL,
        predicted_stock INTEGER NOT NULL,
        stockout_risk REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, date)
    )
    ''')

    # Price history table
    cursor.execute('''
    CREATE TABLE price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        old_price REAL NOT NULL,
        new_price REAL NOT NULL,
        change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    ''')

    # Stock history table
    cursor.execute('''
    CREATE TABLE stock_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        change_amount INTEGER NOT NULL,
        reason TEXT,
        reference_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    ''')

    # Sales table
    cursor.execute('''
    CREATE TABLE sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
    ''')

    # Sale items table
    cursor.execute('''
    CREATE TABLE sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    ''')

    # Feedback table
    cursor.execute('''
    CREATE TABLE feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL UNIQUE,
        overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )
    ''')

    # Product ratings table
    cursor.execute('''
    CREATE TABLE product_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    ''')

    # Risk assessments table
    cursor.execute('''
    CREATE TABLE risk_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        potential_loss REAL,
        assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    ''')

    # Create indexes
    cursor.execute('CREATE INDEX idx_products_name ON products(name)')
    cursor.execute('CREATE INDEX idx_products_status ON products(status)')
    cursor.execute('CREATE INDEX idx_vendors_product_id ON vendors(product_id)')
    cursor.execute('CREATE INDEX idx_price_history_product_id ON price_history(product_id)')
    cursor.execute('CREATE INDEX idx_stock_history_product_id ON stock_history(product_id)')
    cursor.execute('CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id)')
    cursor.execute('CREATE INDEX idx_sale_items_product_id ON sale_items(product_id)')
    cursor.execute('CREATE INDEX idx_feedback_sale_id ON feedback(sale_id)')
    cursor.execute('CREATE INDEX idx_product_ratings_feedback_id ON product_ratings(feedback_id)')
    cursor.execute('CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id)')
    cursor.execute('CREATE INDEX idx_sales_forecasts_product_id ON sales_forecasts(product_id)')
    cursor.execute('CREATE INDEX idx_sales_forecasts_date ON sales_forecasts(date)')
    cursor.execute('CREATE INDEX idx_stock_forecasts_product_id ON stock_forecasts(product_id)')
    cursor.execute('CREATE INDEX idx_stock_forecasts_date ON stock_forecasts(date)')
    cursor.execute('CREATE INDEX idx_risk_assessments_product_id ON risk_assessments(product_id)')
    cursor.execute('CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level)')

    conn.commit()
    print("Tables created successfully")

# Insert sample data
def insert_sample_data():
    # Sample users
    sample_users = [
        ('admin@example.com', 'admin123', 'Admin User', 'admin'),
        ('user@example.com', 'user123', 'Regular User', 'user'),
    ]
    
    cursor.executemany(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        sample_users
    )
    
    # Sample products
    products = [
        ("Laptop Pro X", "High-performance laptop with 16GB RAM and 512GB SSD", 85000, "active", 50),
        ("Wireless Mouse", "Ergonomic wireless mouse with long battery life", 1500, "active", 120),
        ("External SSD", "500GB external solid-state drive with USB-C", 8500, "active", 30),
        ("Office Chair", "Ergonomic office chair with lumbar support", 12000, "active", 15),
        ("Desk Lamp", "LED desk lamp with adjustable brightness", 2500, "active", 40),
        ("Mechanical Keyboard", "RGB mechanical keyboard with cherry MX switches", 7500, "active", 25),
        ("Monitor 27-inch", "27-inch 4K monitor with HDR support", 32000, "active", 10),
        ("Wireless Earbuds", "Noise-cancelling wireless earbuds", 9500, "active", 60),
        ("Power Bank", "20000mAh power bank with fast charging", 2800, "active", 45),
        ("Smart Watch", "Fitness tracking smartwatch with heart rate monitor", 15000, "inactive", 20)
    ]
    
    for product in products:
        name, description, price, status, stock = product
        cursor.execute('''
        INSERT INTO products (name, description, price, status, current_stock)
        VALUES (?, ?, ?, ?, ?)
        ''', (name, description, price, status, stock))
        
        # Get the product_id of the inserted product
        product_id = cursor.lastrowid
        
        # Insert initial price history
        cursor.execute('''
        INSERT INTO price_history (product_id, old_price, new_price)
        VALUES (?, ?, ?)
        ''', (product_id, price, price))
        
        # Insert initial stock history
        cursor.execute('''
        INSERT INTO stock_history (product_id, change_amount, reason)
        VALUES (?, ?, ?)
        ''', (product_id, stock, 'initial inventory'))
        
        # Insert vendor data (2 vendors per product)
        vendor_names = ["Tech Suppliers Inc.", "Global Electronics", "Office Solutions", "Digital World", "Smart Gadgets"]
        for i in range(2):
            vendor_name = random.choice(vendor_names)
            contact = f"Contact Person {i+1}"
            email = f"contact{i+1}@{vendor_name.lower().replace(' ', '')}.com"
            phone = f"98765{random.randint(10000, 99999)}"
            # Vendor price is slightly lower than retail price
            vendor_price = price * (0.75 + random.random() * 0.1)  # 75-85% of retail price
            
            cursor.execute('''
            INSERT INTO vendors (product_id, name, contact, email, phone, price)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (product_id, vendor_name, contact, email, phone, vendor_price))
        
        # Insert sales forecasts for next 15 days
        today = datetime.date.today()
        for i in range(15):
            forecast_date = today + datetime.timedelta(days=i+1)
            # Predicted quantity varies based on product and day
            predicted_quantity = int(random.normalvariate(stock * 0.1, stock * 0.03))
            if predicted_quantity < 1:
                predicted_quantity = 1
            
            # Predicted price might vary slightly from current price
            price_variation = random.uniform(-0.05, 0.05)  # -5% to +5%
            predicted_price = price * (1 + price_variation)
            confidence_level = random.uniform(0.7, 0.95)  # 70-95% confidence
            
            cursor.execute('''
            INSERT INTO sales_forecasts (product_id, date, predicted_quantity, predicted_price, confidence_level)
            VALUES (?, ?, ?, ?, ?)
            ''', (product_id, forecast_date, predicted_quantity, predicted_price, confidence_level))
        
        # Insert stock forecasts for next 15 days
        remaining_stock = stock
        for i in range(15):
            forecast_date = today + datetime.timedelta(days=i+1)
            
            # Get predicted sales for this date
            cursor.execute('''
            SELECT predicted_quantity FROM sales_forecasts 
            WHERE product_id = ? AND date = ?
            ''', (product_id, forecast_date))
            
            predicted_sales = cursor.fetchone()[0]
            remaining_stock -= predicted_sales
            if remaining_stock < 0:
                remaining_stock = 0
            
            # Calculate stockout risk (higher when stock is low)
            if remaining_stock == 0:
                stockout_risk = 1.0  # 100% risk
            elif remaining_stock < predicted_sales * 2:
                stockout_risk = 0.7  # 70% risk
            elif remaining_stock < predicted_sales * 5:
                stockout_risk = 0.3  # 30% risk
            else:
                stockout_risk = 0.05  # 5% risk
            
            cursor.execute('''
            INSERT INTO stock_forecasts (product_id, date, predicted_stock, stockout_risk)
            VALUES (?, ?, ?, ?)
            ''', (product_id, forecast_date, remaining_stock, stockout_risk))
        
        # Insert risk assessment
        risk_levels = {
            0: "low",
            1: "medium",
            2: "high"
        }
        
        # Determine risk level based on days of stock left
        if remaining_stock == 0:
            risk_index = 2  # high risk
        elif remaining_stock < predicted_sales * 3:
            risk_index = 1  # medium risk
        else:
            risk_index = 0  # low risk
        
        potential_loss = price * predicted_sales * 5 if risk_index > 0 else 0
        
        cursor.execute('''
        INSERT INTO risk_assessments (product_id, risk_level, potential_loss)
        VALUES (?, ?, ?)
        ''', (product_id, risk_levels[risk_index], potential_loss))
    
    # Sample sales data (generate 30 days of sales)
    customer_names = ["John Smith", "Jane Doe", "Michael Johnson", "Sarah Williams", "Robert Brown", "Emily Davis"]
    customer_emails = ["john@example.com", "jane@example.com", "michael@example.com", "sarah@example.com", "robert@example.com", "emily@example.com"]
    customer_phones = ["9876543210", "8765432109", "7654321098", "6543210987", "5432109876", "4321098765"]
    
    start_date = datetime.datetime.today() - datetime.timedelta(days=30)
    
    for day in range(30):
        # Generate 1-5 sales per day
        sales_count = random.randint(1, 5)
        sale_date = start_date + datetime.timedelta(days=day)
        
        for _ in range(sales_count):
            # Select random customer
            idx = random.randint(0, len(customer_names) - 1)
            customer_name = customer_names[idx]
            customer_email = customer_emails[idx]
            customer_phone = customer_phones[idx]
            
            # Each sale has 1-3 items
            items_count = random.randint(1, 3)
            total_amount = 0
            
            # Create sale
            cursor.execute('''
            INSERT INTO sales (customer_id, customer_name, customer_email, customer_phone, total_amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (None, customer_name, customer_email, customer_phone, 0, sale_date))
            
            sale_id = cursor.lastrowid
            
            # Add items to sale
            selected_products = random.sample(range(1, len(products) + 1), items_count)
            for product_id in selected_products:
                # Get product info
                cursor.execute("SELECT price, current_stock FROM products WHERE id = ?", (product_id,))
                product_info = cursor.fetchone()
                price = product_info[0]
                current_stock = product_info[1]
                
                # Determine quantity - avoid empty range error
                max_qty = max(1, min(3, current_stock))
                quantity = random.randint(1, max_qty)
                item_total = price * quantity
                total_amount += item_total
                
                # Add sale item
                cursor.execute('''
                INSERT INTO sale_items (sale_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)
                ''', (sale_id, product_id, quantity, price))
                
                # Update product stock
                cursor.execute('''
                UPDATE products SET current_stock = current_stock - ? WHERE id = ?
                ''', (quantity, product_id))
                
                # Add stock history entry
                cursor.execute('''
                INSERT INTO stock_history (product_id, change_amount, reason, reference_id)
                VALUES (?, ?, ?, ?)
                ''', (product_id, -quantity, 'sale', sale_id))
            
            # Update sale total
            cursor.execute("UPDATE sales SET total_amount = ? WHERE id = ?", (total_amount, sale_id))
            
            # Add feedback (80% chance)
            if random.random() < 0.8:
                overall_rating = random.randint(3, 5)  # Mostly positive ratings
                comments = [
                    "Great products and service!",
                    "Very satisfied with my purchase.",
                    "Fast shipping and good quality.",
                    "Products were as described.",
                    "Will shop again!"
                ]
                
                cursor.execute('''
                INSERT INTO feedback (sale_id, overall_rating, comment)
                VALUES (?, ?, ?)
                ''', (sale_id, overall_rating, random.choice(comments)))
                
                feedback_id = cursor.lastrowid
                
                # Add product ratings
                cursor.execute("SELECT product_id FROM sale_items WHERE sale_id = ?", (sale_id,))
                products_in_sale = cursor.fetchall()
                
                for product_row in products_in_sale:
                    product_id = product_row[0]
                    # Product rating might differ slightly from overall
                    product_rating = min(5, max(1, overall_rating + random.randint(-1, 1)))
                    
                    product_comments = [
                        "Love this product!",
                        "Works as expected.",
                        "Good value for money.",
                        "High quality product.",
                        "Would recommend."
                    ]
                    
                    cursor.execute('''
                    INSERT INTO product_ratings (feedback_id, product_id, rating, comment)
                    VALUES (?, ?, ?, ?)
                    ''', (feedback_id, product_id, product_rating, random.choice(product_comments)))
    
    conn.commit()
    print("Sample data inserted successfully")

# Run some sample queries to verify the database
def run_sample_queries():
    print("\nSample Queries:\n")
    
    # 1. Get all products with their current stock
    print("Products with current stock:")
    cursor.execute('''
    SELECT id, name, price, current_stock, status FROM products ORDER BY current_stock
    ''')
    for row in cursor.fetchall():
        print(f"ID: {row[0]}, Name: {row[1]}, Price: ₹{row[2]}, Stock: {row[3]}, Status: {row[4]}")
    
    print("\n")
    
    # 2. Get products with low stock (stockout risk > 0.5 in next 7 days)
    print("Products with high stockout risk in next 7 days:")
    cursor.execute('''
    SELECT p.id, p.name, p.current_stock, sf.date, sf.predicted_stock, sf.stockout_risk
    FROM products p
    JOIN stock_forecasts sf ON p.id = sf.product_id
    WHERE sf.stockout_risk > 0.5
    AND sf.date <= date('now', '+7 day')
    ORDER BY sf.stockout_risk DESC, sf.date
    ''')
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, Name: {row[1]}, Current Stock: {row[2]}, Forecast Date: {row[3]}, Predicted Stock: {row[4]}, Stockout Risk: {row[5]:.2f}")
    
    print("\n")
    
    # 3. Get sales forecast for next 15 days
    print("Sales forecast for next 15 days (Total predicted revenue):")
    cursor.execute('''
    SELECT sf.date, SUM(sf.predicted_quantity * sf.predicted_price) as predicted_revenue
    FROM sales_forecasts sf
    GROUP BY sf.date
    ORDER BY sf.date
    LIMIT 15
    ''')
    for row in cursor.fetchall():
        print(f"Date: {row[0]}, Predicted Revenue: ₹{row[1]:.2f}")
    
    print("\n")
    
    # 4. Get recent sales
    print("Recent sales:")
    cursor.execute('''
    SELECT s.id, s.customer_name, s.total_amount, s.created_at,
           COUNT(si.id) as item_count
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT 5
    ''')
    for row in cursor.fetchall():
        print(f"Sale ID: {row[0]}, Customer: {row[1]}, Total: ₹{row[2]}, Date: {row[3]}, Items: {row[4]}")
    
    print("\n")
    
    # 5. Get top-rated products
    print("Top-rated products:")
    cursor.execute('''
    SELECT p.id, p.name, AVG(pr.rating) as avg_rating, COUNT(pr.id) as review_count
    FROM products p
    JOIN product_ratings pr ON p.id = pr.product_id
    GROUP BY p.id
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT 5
    ''')
    for row in cursor.fetchall():
        print(f"ID: {row[0]}, Name: {row[1]}, Average Rating: {row[2]:.1f}/5, Review Count: {row[3]}")

# Execute the functions
if __name__ == "__main__":
    print("Creating database...")
    create_tables()
    print("Inserting sample data...")
    insert_sample_data()
    print("Running sample queries...")
    run_sample_queries()
    
    print(f"\nDatabase created successfully at: {os.path.abspath(DB_PATH)}")
    
    # Close connection
    conn.close()

@contextmanager
def get_db():
    db = sqlite3.connect('inventory.db')
    try:
        yield db
    finally:
        db.close()
