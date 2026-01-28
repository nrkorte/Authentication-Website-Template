#!/bin/bash
# === TEMPLATE POSTGRESQL SETUP SCRIPT ===
# Creates Postgres, user, database, users table (email + 2FA), and grants privileges
# Edit DB_USER, DB_PASS, and DB_NAME as needed

DB_USER="user"
DB_PASS="password"
DB_NAME="template_db"

# Install Postgres if not installed
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Create user if it doesn't exist
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")
if [ "$USER_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASS';"
fi

# Create database if it doesn't exist
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
fi

# Drop old table if exists
sudo -u postgres psql -d "$DB_NAME" -c "DROP TABLE IF EXISTS users CASCADE;"

# Create new users table
sudo -u postgres psql -d "$DB_NAME" -c "
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    login_count INTEGER DEFAULT 0,
    first_login BOOLEAN DEFAULT true,
    totp_secret TEXT
);
"

# Grant privileges on table
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON TABLE users TO \"$DB_USER\";"

# Grant privileges on sequence
sudo -u postgres psql -d "$DB_NAME" -c "ALTER SEQUENCE users_id_seq OWNED BY users.id;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT USAGE, SELECT, UPDATE ON SEQUENCE users_id_seq TO \"$DB_USER\";"

echo "PostgreSQL template setup complete!"
echo "User: $DB_USER, Database: $DB_NAME"
