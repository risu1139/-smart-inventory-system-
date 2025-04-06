import sqlite3
import os
from contextlib import contextmanager
import datetime

# Path to the database file
DB_PATH = 'inventory.db'

# Connect to the SQLite database
def add_customers_table():
    print("Checking for customers table...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if customers table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'")
    if cursor.fetchone():
        print("Customers table already exists.")
    else:
        print("Creating customers table...")
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
        print("Customers table created successfully.")

    # Check if sale_items table has feedback_id
    cursor.execute("PRAGMA table_info(sales)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'customer_id' not in columns:
        print("Adding customer_id reference to sales table...")
        # Safe way to add column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE sales ADD COLUMN customer_id INTEGER REFERENCES customers(id)")
            print("Added customer_id column to sales table.")
        except sqlite3.OperationalError as e:
            print(f"Note: {e}")
    
    # Check for feedback and product_ratings tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'")
    if not cursor.fetchone():
        print("Creating feedback table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL UNIQUE,
            overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )
        ''')
        print("Feedback table created successfully.")

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_ratings'")
    if not cursor.fetchone():
        print("Creating product_ratings table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_ratings (
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
        print("Product ratings table created successfully.")

    # Commit and close
    conn.commit()
    conn.close()
    print("Database update complete!")

if __name__ == "__main__":
    add_customers_table() 