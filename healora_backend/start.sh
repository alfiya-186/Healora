#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# If executed from the repository root, change into healora_backend
if [ -d "healora_backend" ]; then
    cd healora_backend
fi

# Run migrations once as a single pre-start process before Daphne server spawns
echo "==> [Healora Startup] Verifying database schema..."
python manage.py migrate --no-input

# Start Daphne ASGI server (handles both HTTP and WebSockets)
echo "==> [Healora Startup] Launching Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p ${PORT:-8000} healora_backend.asgi:application
