@echo off
title Discord Music Bot Launcher
echo Loading Environment Variables from .env...
for /f "delims=" %%x in (.env) do set %%x

echo Starting Lavalink Server...
start "Lavalink" java -jar Lavalink.jar

echo Waiting for Lavalink to warm up (20 seconds)...
timeout /t 20

echo Starting Discord Bot...
node index.js
pause
