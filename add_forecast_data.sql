-- Clear existing forecast data to avoid duplicates
DELETE FROM sales_forecasts;
DELETE FROM stock_forecasts;

-- Insert data for the next 14 days for sales forecasts
-- For each product and each day, add a prediction
INSERT INTO sales_forecasts (product_id, date, predicted_quantity, predicted_price, confidence_level)
WITH
    products_list AS (
        SELECT id FROM products
    ),
    dates_list AS (
        SELECT date('now', '+' || day || ' days') as forecast_date
        FROM (
            SELECT 1 as day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
            SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
            SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
        )
    )
SELECT 
    p.id as product_id,
    d.forecast_date as date,
    -- Generate random predicted quantities based on product ID
    CASE 
        WHEN p.id IN (1, 5, 8) THEN ABS(random() % 10) + 5 -- High demand products
        WHEN p.id IN (2, 3, 9) THEN ABS(random() % 5) + 1  -- Medium demand products
        ELSE ABS(random() % 3) + 1                       -- Low demand products
    END as predicted_quantity,
    -- Generate predicted prices (slightly varying from day to day)
    CASE
        WHEN p.id = 1 THEN 85000 + (random() % 5000)     -- Laptop Pro X
        WHEN p.id = 2 THEN 1500 + (random() % 200)       -- Wireless Mouse
        WHEN p.id = 3 THEN 8500 + (random() % 500)       -- External SSD
        WHEN p.id = 4 THEN 12000 + (random() % 1000)     -- Office Chair
        WHEN p.id = 5 THEN 2500 + (random() % 300)       -- Desk Lamp
        WHEN p.id = 6 THEN 7500 + (random() % 500)       -- Mechanical Keyboard
        WHEN p.id = 7 THEN 32000 + (random() % 2000)     -- Monitor 27-inch
        WHEN p.id = 8 THEN 9500 + (random() % 500)       -- Wireless Earbuds
        WHEN p.id = 9 THEN 2800 + (random() % 200)       -- Power Bank
        WHEN p.id = 10 THEN 15000 + (random() % 1000)    -- Smart Watch
    END as predicted_price,
    -- Confidence level between 0.6 and 0.95
    (60 + ABS(random() % 35)) / 100.0 as confidence_level
FROM products_list p
CROSS JOIN dates_list d;

-- Insert data for the next 14 days for stock forecasts
INSERT INTO stock_forecasts (product_id, date, predicted_stock, stockout_risk)
WITH
    products_list AS (
        SELECT id, current_stock FROM products
    ),
    dates_list AS (
        SELECT date('now', '+' || day || ' days') as forecast_date, day
        FROM (
            SELECT 1 as day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
            SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
            SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
        )
    )
SELECT 
    p.id as product_id,
    d.forecast_date as date,
    -- Generate predicted stock levels (decreasing over time for some products)
    CASE
        -- For positive stock products, decrease gradually
        WHEN p.current_stock > 0 THEN 
            MAX(0, p.current_stock - CAST(d.day * (0.5 + (ABS(random() % 100) / 100.0)) AS INTEGER))
        -- For negative or zero stock products, stay at 0 or increase slightly over time
        ELSE 
            CASE 
                WHEN random() % 100 < 30 THEN 0  -- 30% chance to stay at 0
                ELSE ABS(random() % 5)           -- Otherwise slight increase
            END
    END as predicted_stock,
    -- Calculate stockout risk
    CASE
        -- High risk for already low stock or negative stock
        WHEN p.current_stock < 5 THEN 0.7 + (random() % 20) / 100.0
        -- Medium risk for medium stock
        WHEN p.current_stock < 20 THEN 0.3 + (random() % 30) / 100.0
        -- Low risk for high stock
        ELSE 0.1 + (random() % 20) / 100.0
    END as stockout_risk
FROM products_list p
CROSS JOIN dates_list d;

-- Add forecast data for price history tracking
INSERT INTO price_history (product_id, old_price, new_price, change_date)
SELECT 
    p.id as product_id,
    p.price - (random() % 1000) as old_price,
    p.price as new_price,
    date('now', '-' || (random() % 30) || ' days') as change_date
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM price_history ph WHERE ph.product_id = p.id)
UNION ALL
SELECT 
    p.id as product_id,
    p.price - (random() % 2000) as old_price,
    p.price - (random() % 1000) as new_price,
    date('now', '-' || (random() % 60) || ' days') as change_date
FROM products p;

-- Add data to stock_history table
INSERT INTO stock_history (product_id, change_amount, reason, created_at)
SELECT 
    p.id as product_id,
    ABS(random() % 10) + 1 as change_amount,
    CASE WHEN random() % 3 = 0 THEN 'Restocking' 
         WHEN random() % 3 = 1 THEN 'Sale' 
         ELSE 'Inventory adjustment' END as reason,
    date('now', '-' || (random() % 30) || ' days') as created_at
FROM products p
UNION ALL
SELECT 
    p.id as product_id,
    -(ABS(random() % 10) + 1) as change_amount,
    CASE WHEN random() % 3 = 0 THEN 'Sale' 
         WHEN random() % 3 = 1 THEN 'Returned/Damaged' 
         ELSE 'Inventory adjustment' END as reason,
    date('now', '-' || (random() % 60) || ' days') as created_at
FROM products p
UNION ALL
SELECT 
    p.id as product_id,
    ABS(random() % 10) + 1 as change_amount,
    CASE WHEN random() % 3 = 0 THEN 'Restocking' 
         WHEN random() % 3 = 1 THEN 'Return from customer' 
         ELSE 'Inventory adjustment' END as reason,
    date('now', '-' || (random() % 90) || ' days') as created_at
FROM products p; 