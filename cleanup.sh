#!/bin/bash
# Smart Inventory Cleanup Script
echo "Starting cleanup..."
echo "Removing backup files..."
rm -fv sales.html.bak
rm -fv api_server.py.bak
echo "Removing Python cache files..."
rm -rfv __pycache__/
echo "Removing test files..."
rm -fv test_api.py
rm -fv test_websocket.py
echo "Do you want to remove setup SQL files? (y/n)"
read answer
if [ "$answer" = "y" ]; then
  rm -fv add_forecast_data.sql add_more_products.sql add_sale_item_feedback.sql add_two_week_products.sql ensure_feedback_tables.sql
fi
echo "Do you want to remove setup Python files? (y/n)"
read answer
if [ "$answer" = "y" ]; then
  rm -fv add_customers_table.py create_api_server.py create_database.py fix_sales.py
fi
