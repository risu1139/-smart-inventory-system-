import sqlite3
import os

def init_database():
    # Check if database file exists
    if os.path.exists('inventory.db'):
        print("Database already exists!")
        return
    
    # Create new database
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    
    # Read and execute the schema
    with open('schema.sql', 'r') as schema_file:
        schema = schema_file.read()
        cursor.executescript(schema)
    
    # Insert sample data
    sample_data = [
        # Sample user (password is 'admin123')
        """INSERT INTO users (username, password_hash, full_name, email, role) 
           VALUES ('admin', 'pbkdf2:sha256:260000$7NEeGIQr$ed9b77d2fb52b063b904769437d0eba96c3b6dd348ed48d3f8fbe882f907e9f1', 
           'Admin User', 'admin@example.com', 'admin')""",
        
        # Sample products
        """INSERT INTO products (code, name, description, mrp, current_stock) 
           VALUES 
           ('PROD001', 'Laptop Pro X', 'High-performance laptop', 85000.00, 10),
           ('PROD002', 'Wireless Mouse', 'Ergonomic wireless mouse', 1500.00, 50),
           ('PROD003', 'External SSD', '1TB External SSD', 8500.00, 25)""",
        
        # Sample vendors
        """INSERT INTO vendors (name, contact_person, email, phone) 
           VALUES 
           ('ABC Suppliers', 'John Doe', 'john@abcsuppliers.com', '+91 98765 43210'),
           ('XYZ Trading', 'Jane Smith', 'jane@xyztrading.com', '+91 98765 43211')"""
    ]
    
    for command in sample_data:
        cursor.execute(command)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()