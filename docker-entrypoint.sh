#!/bin/sh
# =============================================================================
# suite_webapp docker-entrypoint.sh
#
# suite_webapp is a stateful Express/EJS frontend. It has no database
# migrations of its own — it delegates all DB writes to service_suite.
# Redis connectivity is validated inside server.js before binding the port.
#
# Sequence:
#   1. API/frontend server — `exec` replaces this shell so Node receives
#                            SIGTERM cleanly on `docker stop`
# =============================================================================
set -e

echo "[entrypoint] NODE_ENV=${NODE_ENV}"
echo "[entrypoint] Starting suite_webapp on port ${PORT:-8000}..."
exec node server.js
