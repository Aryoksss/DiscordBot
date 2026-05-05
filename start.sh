#!/bin/bash

# Robust .env loader for Linux
if [ -f .env ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "$line" ]] && continue
        export "$line"
    done < .env
fi

echo "------------------------------------------"
echo "🚀 Kafka Music Bot - VPS Startup Script"
echo "------------------------------------------"

# Jalankan Lavalink di background
echo "📥 Starting Lavalink Server..."
java -jar Lavalink.jar > lavalink.log 2>&1 &
LAVALINK_PID=$!

# Tunggu Lavalink benar-benar siap
echo "⏳ Waiting for Lavalink to warm up (20 seconds)..."
sleep 20

# Jalankan Discord Bot
echo "🤖 Starting Discord Bot..."
node index.js

# Fungsi untuk mematikan Lavalink saat script dihentikan
cleanup() {
    echo ""
    echo "🛑 Stopping Lavalink Server (PID: $LAVALINK_PID)..."
    kill $LAVALINK_PID
    exit
}

# Tangkap sinyal interrupt (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Biarkan script tetap berjalan selama Lavalink aktif
wait $LAVALINK_PID
