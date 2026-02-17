#!/bin/bash
# Run auto-mapper in a loop every 20 minutes.
# Usage: ./scripts/run-auto-mapper.sh
# Stop with Ctrl+C

CRON_SECRET=$(grep '^CRON_SECRET=' .env | sed 's/^CRON_SECRET=//' | sed 's/[[:space:]].*//')

URL="http://localhost:3000/api/cron/auto-map"

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not found in .env"
  exit 1
fi

echo "Starting auto-mapper loop (every 20 min). Ctrl+C to stop."
echo "---"

while true; do
  echo "[$(date '+%H:%M:%S')] Running auto-mapper..."
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Authorization: Bearer $CRON_SECRET" "$URL")
  HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
  RESPONSE=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

  EVENTS=$(echo "$RESPONSE" | grep -o '"eventsCreated":[0-9]*' | cut -d: -f2)
  MAPPINGS=$(echo "$RESPONSE" | grep -o '"mappingsCreated":[0-9]*' | cut -d: -f2)
  CONTRACTS=$(echo "$RESPONSE" | grep -o '"contractsFound":[0-9]*' | cut -d: -f2)

  echo "[$(date '+%H:%M:%S')] HTTP ${HTTP_STATUS:-???} — contracts: ${CONTRACTS:-0}, events created: ${EVENTS:-0}, mappings: ${MAPPINGS:-0}"
  echo "--- Sleeping 20 min ---"
  sleep 1200
done
