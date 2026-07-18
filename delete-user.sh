#!/bin/bash

# Delete user by email script
DB_URL='postgresql://postgres:developer@localhost:5432/attendance'

if [ -z "$1" ]; then
    echo "Usage: ./delete-user.sh user@example.com"
    exit 1
fi

EMAIL="$1"

echo "🔍 Searching for user with email: $EMAIL"

# Get user details
USER_DATA=$(psql $DB_URL -t -c "SELECT public_id, first_name FROM accounts WHERE email = '$EMAIL';")

if [ -z "$USER_DATA" ]; then
    echo "❌ User with email $EMAIL not found"
    exit 1
fi

PUBLIC_ID=$(echo $USER_DATA | awk '{print $1}')
FIRST_NAME=$(echo $USER_DATA | awk '{print $2}')

echo "🔍 Found user: $FIRST_NAME ($EMAIL)"

# Get face images before deletion
FACE_IMAGES=$(psql $DB_URL -t -c "SELECT face_image FROM faces WHERE account_public_id = '$PUBLIC_ID';")

echo "🗑️  Deleting user data..."

# Delete all related data
psql $DB_URL << EOF
BEGIN;
DELETE FROM attendance WHERE account_public_id = '$PUBLIC_ID';
DELETE FROM leaves WHERE account_public_id = '$PUBLIC_ID';
DELETE FROM sessions WHERE account_public_id = '$PUBLIC_ID';
DELETE FROM faces WHERE account_public_id = '$PUBLIC_ID';
DELETE FROM accounts WHERE email = '$EMAIL';
COMMIT;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database records deleted successfully"
    
    # Delete face image files
    if [ ! -z "$FACE_IMAGES" ]; then
        echo "🗑️  Deleting face images..."
        echo "$FACE_IMAGES" | while read -r image; do
            if [ ! -z "$image" ] && [ -f "uploads/faces/$image" ]; then
                rm "uploads/faces/$image"
                echo "✅ Deleted: $image"
            fi
        done
    fi
    
    echo "🎉 User $EMAIL deleted successfully"
else
    echo "❌ Failed to delete user data"
    exit 1
fi