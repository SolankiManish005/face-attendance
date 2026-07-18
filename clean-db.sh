#!/bin/bash

# Database cleanup script
DB_URL='postgresql://postgres:developer@localhost:5432/attendance'

echo "⚠️  WARNING: This will delete ALL data from the database!"
read -p "Are you sure? Type 'YES' to continue: " confirm

if [ "$confirm" != "YES" ]; then
    echo "Operation cancelled"
    exit 0
fi

echo "Creating backup before cleanup..."
./backup-db.sh

echo "Cleaning database..."
psql $DB_URL << EOF
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE faces CASCADE;
TRUNCATE TABLE accounts RESTART IDENTITY CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE leaves CASCADE;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database cleaned successfully"
    echo "📁 Cleaning uploaded face images..."
    rm -rf uploads/faces/*
    echo "✅ Face images cleaned"
else
    echo "❌ Database cleanup failed"
    exit 1
fi