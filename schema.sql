-- SQLite schema for Smart Inventory Management System

-- Users table for authentication
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT CHECK(role IN ('admin', 'manager', 'staff')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

-- Products table
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    mrp DECIMAL(10, 2) NOT NULL,
    predicted_price DECIMAL(10, 2),
    current_stock INTEGER NOT NULL DEFAULT 0,
    predicted_quantity INTEGER,
    min_stock_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active'
);

-- Vendors table
CREATE TABLE vendors (
    vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active'
);

-- Product Vendor Mapping
CREATE TABLE product_vendors (
    product_id INTEGER,
    vendor_id INTEGER,
    price_offered DECIMAL(10, 2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_preferred INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, vendor_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    type TEXT CHECK(type IN ('stock_in', 'stock_out')) NOT NULL,
    reference_type TEXT CHECK(reference_type IN ('purchase', 'sale', 'adjustment')) NOT NULL,
    reference_id INTEGER,
    unit_price DECIMAL(10, 2),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Sales table
CREATE TABLE sales (
    sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('completed', 'cancelled')) DEFAULT 'completed',
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Sale Items
CREATE TABLE sale_items (
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Invoices
CREATE TABLE invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    invoice_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('paid', 'pending', 'cancelled')) DEFAULT 'pending',
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
);

-- AI Predictions
CREATE TABLE predictions (
    prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    predicted_demand INTEGER,
    predicted_price DECIMAL(10, 2),
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5, 2),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_product_code ON products(code);
CREATE INDEX idx_product_name ON products(name);
CREATE INDEX idx_vendor_name ON vendors(name);
CREATE INDEX idx_sale_date ON sales(sale_date);
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_inventory_transaction_date ON inventory_transactions(transaction_date);

-- Triggers to update timestamps
CREATE TRIGGER update_product_timestamp 
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE product_id = NEW.product_id;
END;

CREATE TRIGGER update_vendor_timestamp 
AFTER UPDATE ON vendors
BEGIN
    UPDATE vendors SET updated_at = CURRENT_TIMESTAMP WHERE vendor_id = NEW.vendor_id;
END;