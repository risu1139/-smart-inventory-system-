-- Add more products for the "Two Weeks Stock" category
INSERT INTO products (name, description, price, current_stock, status, created_at, updated_at)
VALUES 
    ('Premium Headphones', 'Noise-cancelling headphones with 20hr battery', 18000, 10, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Coffee Maker', 'Automatic coffee maker with built-in grinder', 12000, 7, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Smart TV 55-inch', '4K Smart TV with HDR', 55000, 5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add sales forecasts for these products that will put them in the "Two Weeks Stock" category
-- We need the predicted quantity to be high enough so that:
-- current_stock > one_week_sales BUT current_stock < two_week_sales
INSERT INTO sales_forecasts (product_id, date, predicted_quantity, predicted_price, confidence_level)
WITH
    product_ids AS (
        SELECT id FROM products WHERE name IN ('Premium Headphones', 'Coffee Maker', 'Smart TV 55-inch')
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
    -- Set predicted quantities to ensure they fall into "Two Weeks Stock" category
    -- For days 1-7: Make the sum less than current_stock
    -- For days 1-14: Make the sum more than current_stock
    CASE
        -- For Premium Headphones (current_stock = 10)
        WHEN p.id = (SELECT id FROM products WHERE name = 'Premium Headphones') THEN
            CASE
                WHEN d.forecast_date <= date('now', '+7 days') THEN 1  -- 7 days total = 7 (< 10)
                ELSE 2  -- 7 more days at 2 each = 14 more (total 21 > 10)
            END
        -- For Coffee Maker (current_stock = 7)
        WHEN p.id = (SELECT id FROM products WHERE name = 'Coffee Maker') THEN
            CASE
                WHEN d.forecast_date <= date('now', '+7 days') THEN 1  -- 7 days total = 7 (= 7)
                ELSE 1  -- 7 more days at 1 each = 7 more (total 14 > 7)
            END
        -- For Smart TV (current_stock = 5)
        WHEN p.id = (SELECT id FROM products WHERE name = 'Smart TV 55-inch') THEN
            CASE
                WHEN d.forecast_date <= date('now', '+2 days') THEN 1  -- 2 days total = 2 (< 5)
                WHEN d.forecast_date <= date('now', '+7 days') THEN 0  -- Next 5 days = 0 more (total still 2 < 5)
                ELSE 1  -- 7 more days at 1 each = 7 more (total 9 > 5)
            END
        ELSE 1
    END as predicted_quantity,
    -- Use product price with slight variation
    (SELECT price FROM products WHERE id = p.id) * (0.98 + (random() % 5) / 100.0) as predicted_price,
    0.85 as confidence_level
FROM product_ids p
CROSS JOIN dates_list d; 