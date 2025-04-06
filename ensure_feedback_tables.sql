-- Ensure the overall sale feedback table exists
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL UNIQUE,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Ensure the sale item feedback table exists
CREATE TABLE IF NOT EXISTS sale_item_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_item_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE
);

-- Ensure the product ratings table exists (for analytics)
CREATE TABLE IF NOT EXISTS product_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_feedback_sale_id ON feedback(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_item_feedback_sale_item_id ON sale_item_feedback(sale_item_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_feedback_id ON product_ratings(feedback_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_product_id ON product_ratings(product_id);

-- Output table status
SELECT 'Feedback tables verified' AS result; 