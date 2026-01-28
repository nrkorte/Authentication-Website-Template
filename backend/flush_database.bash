#!/bin/bash
# === FLUSH USERS SCRIPT ===
# Deletes all rows from the users table and resets the ID sequence

DB_NAME="template_db"

# Delete all rows and reset ID sequence
sudo -u postgres psql -d "$DB_NAME" -c "TRUNCATE TABLE users RESTART IDENTITY CASCADE;"

# Optional: show table contents to verify
sudo -u postgres psql -d "$DB_NAME" -c "SELECT * FROM users;"

echo "All users deleted and ID sequence reset."
