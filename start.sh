#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# If executed from the repository root, change into healora_backend
if [ -d "healora_backend" ]; then
    cd healora_backend
fi

# Run migrations once as a single pre-start process before Gunicorn workers spawn
echo "==> [Healora Startup] Verifying database schema..."
python manage.py migrate --no-input

# Start Gunicorn WSGI server
echo "==> [Healora Startup] Launching Gunicorn WSGI server..."
exec gunicorn healora_backend.wsgi:application

