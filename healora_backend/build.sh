#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> [Healora Backend] Starting Production Build Process..."

# If executed from the repository root, change into healora_backend
if [ -d "healora_backend" ]; then
    echo "==> Entering healora_backend directory..."
    cd healora_backend
fi

# 1. Install Python dependencies
echo "==> Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt

# 2. Collect static files for WhiteNoise
echo "==> Collecting static assets..."
python manage.py collectstatic --no-input

# 3. Apply database migrations
echo "==> Running database migrations on PostgreSQL..."
python manage.py migrate --no-input

echo "==> [Healora Backend] Build and migrations completed successfully!"

