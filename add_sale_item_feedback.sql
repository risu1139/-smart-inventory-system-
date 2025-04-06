-- Add a new table to store feedback for individual sale items
CREATE TABLE IF NOT EXISTS sale_item_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_item_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_sale_item_feedback_sale_item_id ON sale_item_feedback(sale_item_id);

-- Add some sample data (if sales data exists)
INSERT INTO sale_item_feedback (sale_item_id, rating, comment)
SELECT 
    si.id, 
    (ABS(RANDOM()) % 5) + 1, -- Random rating between 1 and 5
    CASE (ABS(RANDOM()) % 5) 
        WHEN 0 THEN 'Great product, very satisfied!'
        WHEN 1 THEN 'Good quality for the price.'
        WHEN 2 THEN 'Average product, meets expectations.'
        WHEN 3 THEN 'Could be better, some issues.'
        ELSE 'Not satisfied with this product.'
    END
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
LEFT JOIN sale_item_feedback sif ON sif.sale_item_id = si.id
WHERE sif.id IS NULL -- Only add feedback for items that don't have it yet
LIMIT 25; -- Add feedback for a limited number of items as sample data

-- Output feedback count
SELECT 'Added ' || changes() || ' sample feedback entries for sale items.' AS result; 