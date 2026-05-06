# 🎵 Kafka Music Bot

Bot musik Discord premium yang dibangun dengan **Node.js**, **Lavalink v4**, dan **Kazagumo**. Dirancang untuk stabilitas tinggi, kualitas audio jernih, dan fitur cerdas seperti YouTube Autoplay & Spotify Integration.

## 🚀 Fitur Utama
- **YouTube Anti-Block**: Menggunakan plugin YouTube terbaru dengan dukungan OAuth2.
- **Spotify Integration**: Memutar lagu/playlist Spotify secara instan tanpa butuh API Key.
- **Smart Autoplay**: Rekomendasi lagu otomatis berdasarkan algoritma YouTube.
- **Interactive UI**: Tombol kontrol (Pause, Skip, Autoplay, 24/7) pada pesan Now Playing.
- **24/7 Mode**: Bot tetap stand-by di Voice Channel meskipun tidak ada musik.
- **Clean Chat**: Pembersihan otomatis pesan Now Playing agar channel tetap rapi.
- **Dynamic Status**: Menampilkan judul lagu yang sedang diputar secara real-time.

## 🛠️ Persyaratan
- [Node.js](https://nodejs.org/) v18 atau lebih tinggi.
- [Java 17/21](https://www.oracle.com/java/technologies/downloads/) (Untuk menjalankan Lavalink).
- Lavalink Server (Sudah termasuk dalam paket ini).

## 📥 Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/username/BotDiscord.git
   cd BotDiscord
   ```

2. **Instal Dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Salin file `.env.example` menjadi `.env` dan isi semua data yang diperlukan (Token Bot, Client ID, dll).
   ```bash
   cp .env.example .env
   ```

4. **Jalankan Bot**
   Gunakan script otomatis yang sudah disediakan:
   - **Windows**: Jalankan `start.bat`
   - **Linux/VPS**: Jalankan `bash start.sh`

## 🕹️ Daftar Perintah
- `/play <judul/link>` - Memutar lagu dari YouTube atau Spotify.
- `/join` - Memanggil bot ke Voice Channel.
- `/stop` - Menghentikan musik dan mengeluarkan bot.
- `/skip` - Melewati lagu saat ini.
- `/queue` - Melihat daftar antrean lagu.
- `/autoplay` - Mengaktifkan/matikan rekomendasi otomatis.
- `/247` - Mengaktifkan/matikan mode stand-by.
- `/help` - Menampilkan menu bantuan interaktif.

## ⚠️ Catatan Penting
Saat pertama kali menjalankan bot, cek terminal Lavalink untuk mendapatkan **Kode Otorisasi YouTube** (Google Device Login). Ini hanya perlu dilakukan sekali agar bot tidak diblokir YouTube.

## 🤝 Kontribusi
Silakan buka **Issue** atau kirim **Pull Request** untuk pengembangan lebih lanjut.

---
*Powered by Kaleg Music Bot*
