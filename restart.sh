#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Stopping existing server..."
pkill -f "vite preview" 2>/dev/null || true
sleep 1

echo "Starting server..."
npm run preview -- --host > /tmp/chess-tutor.log 2>&1 &
disown

sleep 2

if curl -s -o /dev/null -w "" http://localhost:4173/; then
  echo "Server running at http://localhost:4173/"
  echo "Tailscale: http://storyvault.tail3fd0f.ts.net:4173"
else
  echo "Server failed to start. Check /tmp/chess-tutor.log"
  exit 1
fi
