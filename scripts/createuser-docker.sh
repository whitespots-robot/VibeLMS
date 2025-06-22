#!/bin/bash

# User creation script for Docker deployment
# Usage: docker compose exec app bash scripts/createuser-docker.sh

set -e

echo "Creating new user for Vibe LMS"
echo ""

# Prompt for username
read -p "Username: " username
if [ -z "$username" ]; then
    echo "Error: Username cannot be empty"
    exit 1
fi

# Check if user exists
existing_user=$(docker compose exec postgres psql -U vibelms -d vibelms -t -c "SELECT COUNT(*) FROM users WHERE username = '$username';" 2>/dev/null | xargs)
if [ "$existing_user" -gt 0 ]; then
    echo "Error: User with username '$username' already exists"
    exit 1
fi

# Prompt for email
read -p "Email address: " email
if [ -z "$email" ]; then
    echo "Error: Email cannot be empty"
    exit 1
fi

# Prompt for password
read -s -p "Password: " password
echo ""
if [ -z "$password" ]; then
    echo "Error: Password cannot be empty"
    exit 1
fi

# Prompt for role
read -p "Role (student/instructor) [student]: " role
role=${role:-student}
if [ "$role" != "student" ] && [ "$role" != "instructor" ]; then
    echo "Error: Role must be either 'student' or 'instructor'"
    exit 1
fi

# Generate password hash
password_hash=$(docker compose exec app node -e "
const crypto = require('crypto');
const salt = 'vibelms_salt_2024';
const hash = crypto.pbkdf2Sync('$password', salt, 10000, 64, 'sha512').toString('hex');
console.log(hash);
" 2>/dev/null | tr -d '\n\r')

# Create user in database
docker compose exec postgres psql -U vibelms -d vibelms -c "
INSERT INTO users (username, password, email, role, created_at)
VALUES ('$username', '$password_hash', '$email', '$role', NOW());
" > /dev/null

# Get created user info
user_info=$(docker compose exec postgres psql -U vibelms -d vibelms -t -c "
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = '$username'
ORDER BY created_at DESC 
LIMIT 1;
" 2>/dev/null)

echo ""
echo "✓ User created successfully!"
echo "User details: $user_info"
echo ""