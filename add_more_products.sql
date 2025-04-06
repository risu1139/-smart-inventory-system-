-- Add more products to ensure all stock status categories are represented
INSERT INTO products (name, description, price, current_stock, status, created_at, updated_at)
VALUES 
    ('Camera DSLR', 'Professional DSLR camera with 24MP sensor', 45000, 3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Smartphone Pro', 'Latest flagship smartphone with 5G', 65000, 12, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Tablet 10-inch', '10-inch tablet with high-resolution display', 25000, 8, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Gaming Console', 'Next-gen gaming console with ray tracing', 40000, 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Bluetooth Speaker', 'Waterproof Bluetooth speaker with 10hr battery', 5000, 30, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add sales forecasts for the new products
INSERT INTO sales_forecasts (product_id, date, predicted_quantity, predicted_price, confidence_level)
WITH
    product_ids AS (
        SELECT id FROM products WHERE name IN ('Camera DSLR', 'Smartphone Pro', 'Tablet 10-inch', 'Gaming Console', 'Bluetooth Speaker')
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
    -- Different predicted quantities for each product type to ensure diverse stock statuses
    CASE 
        WHEN p.id = (SELECT id FROM products WHERE name = 'Camera DSLR') THEN 1 -- Low demand = One Week Stock
        WHEN p.id = (SELECT id FROM products WHERE name = 'Smartphone Pro') THEN 10 -- High demand = Two Weeks Stock
        WHEN p.id = (SELECT id FROM products WHERE name = 'Tablet 10-inch') THEN 3 -- Medium demand = Two Weeks Stock
        WHEN p.id = (SELECT id FROM products WHERE name = 'Gaming Console') THEN 5 -- Out of Stock already
        WHEN p.id = (SELECT id FROM products WHERE name = 'Bluetooth Speaker') THEN 2 -- Very low demand = More than Two Weeks
        ELSE 1 -- Default
    END as predicted_quantity,
    -- Use product price with some variation
    (SELECT price FROM products WHERE id = p.id) * (0.95 + (random() % 10) / 100.0) as predicted_price,
    -- Confidence level between 0.6 and 0.95
    (60 + ABS(random() % 35)) / 100.0 as confidence_level
FROM product_ids p
CROSS JOIN dates_list d; 