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

# Fungsi untuk mematikan semua proses saat script dihentikan
cleanup() {
    echo ""
    echo "🛑 Stopping Bot and Lavalink..."
    kill $LAVALINK_PID $BOT_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Jalankan Lavalink (Log akan muncul di terminal)
echo "📥 Starting Lavalink Server..."
# Kita pakai SOCKS5 WARP sebagai jembatan ke dunia luar karena VPS ini IPv6-Only
java -DsocksProxyHost=127.0.0.1 -DsocksProxyPort=40000 -Duser.language=id -Duser.country=ID -jar Lavalink.jar &
LAVALINK_PID=$!

# Tunggu Lavalink benar-benar siap
echo "⏳ Waiting for Lavalink to warm up (20 seconds)..."
sleep 20

# Jalankan Discord Bot
echo "🤖 Starting Discord Bot..."
node index.js &
BOT_PID=$!

# Biarkan script tetap hidup selama bot berjalan
wait $BOT_PID
cleanup
