#!/bin/bash

# Pastikan Java 21 sudah terinstall
echo "Starting Lavalink Server..."
# Jalankan Lavalink di background
java -jar Lavalink.jar &
LAVALINK_PID=$!

echo "Waiting for Lavalink to warm up (10s)..."
sleep 10

echo "Starting Discord Bot..."
# Jalankan bot
node index.js

# Saat bot dimatikan (Ctrl+C), matikan juga Lavalink
kill $LAVALINK_PID
