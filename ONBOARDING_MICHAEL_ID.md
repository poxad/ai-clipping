# Panduan Penggunaan Jumo

## Gambaran Umum

Jumo adalah aplikasi untuk mengubah video mentah menjadi clip pendek vertikal yang siap dipreview, diunduh, diedit subtitle-nya, dan dijadwalkan untuk diposting ke TikTok.

Secara umum, alur kerja aplikasi ini adalah:

1. Login ke aplikasi
2. Upload video
3. Pilih tipe konten
4. Atur subtitle style
5. Jalankan proses AI clipping
6. Review hasil clip
7. Download, edit subtitle, atau jadwalkan posting ke TikTok

---

## Link Demo dan Akses Login

Demo aplikasi dapat diakses di:

[https://jumoclip.vercel.app/upload](https://jumoclip.vercel.app/upload)

Credential demo:

- Email: `kacamatamoo@demo.com`
- Password: `kacamatamoo`

---

## Fitur Utama

- Upload video mentah langsung dari dashboard
- AI transcription untuk membaca percakapan dari video
- AI clipping untuk memilih potongan video terbaik
- Pembuatan clip vertikal untuk short-form content
- Subtitle otomatis dengan style yang bisa disesuaikan
- Preview hasil clip langsung di aplikasi
- Edit subtitle setelah clip selesai dibuat
- Download clip satu per satu atau sekaligus
- Riwayat pekerjaan untuk melihat hasil upload sebelumnya
- Re-clip video lama tanpa upload ulang
- Koneksi akun TikTok untuk scheduling posting
- Scheduler untuk menjadwalkan clip ke akun TikTok
- Scoring Guide untuk memahami cara AI menilai clip

---

## Catatan Penting Tentang TikTok

Integrasi TikTok saat ini masih menggunakan **sandbox API key**.

Artinya:

- aplikasi saat ini baru bisa upload ke akun TikTok private
- upload ke akun TikTok public belum didukung
- fitur ini masih cocok untuk testing internal dan simulasi alur posting

---

## Penjelasan Setiap Halaman

## 1. Login

Halaman login digunakan untuk masuk ke aplikasi menggunakan email dan password.

Fungsi halaman ini:

- mengautentikasi user
- mengarahkan user ke dashboard utama setelah berhasil login

Cara penggunaan:

1. buka halaman aplikasi
2. masukkan email dan password
3. klik **Log in**

---

## 2. Register

Halaman register digunakan untuk membuat akun baru.

Fungsi halaman ini:

- membuat akun baru untuk user
- menyimpan nama, email, dan password

Jika menggunakan akun demo, halaman ini tidak perlu dipakai.

---

## 3. Upload & Clip

Ini adalah halaman utama aplikasi dan menjadi pusat workflow pembuatan clip.

Di halaman ini user dapat:

- memilih tipe video
- upload video
- menambahkan brand hints
- mengatur subtitle style
- memproses video
- melakukan re-clip pada video lama

### Step 1: Pilih tipe video

Pilihan yang tersedia:

- **Employee Generated Content**
- **Podcast / Talk**

Fungsi pengaturan ini:

- membantu AI memahami konteks video
- memengaruhi cara AI memilih potongan clip
- memengaruhi ritme hasil clip dan caption

### Step 2: Upload video

User dapat upload video mentah langsung dari halaman ini.

Cara penggunaan:

1. klik area upload
2. pilih file video
3. tunggu sampai nama file muncul
4. lanjut ke proses berikutnya

### Step 3: Brand Name Hints

Bagian ini digunakan untuk menambahkan kata-kata yang ingin dikenali AI dengan lebih akurat.

Contoh:

```text
Kacamata Moo
lensa kontak
silinder
cek mata
```

Fungsinya:

- membantu transcription
- mengurangi typo pada istilah brand atau produk
- meningkatkan akurasi subtitle

### Step 4: Subtitle Style

Bagian ini digunakan untuk menentukan tampilan subtitle pada clip final.

Yang bisa diatur:

- template subtitle
- font
- warna teks
- bold / italic
- uppercase / lowercase
- letter spacing
- alignment
- ukuran subtitle
- posisi subtitle
- outline
- shadow
- background subtitle

### Step 5: Process Video

Setelah semua siap, klik **Process Video** untuk memulai proses.

Sistem akan menjalankan:

- upload video
- extract audio
- transcription
- AI clip selection
- rendering subtitle
- pembuatan hasil clip final

Status progress akan tampil selama proses berjalan.

---

## 4. History

Halaman History digunakan untuk melihat daftar pekerjaan yang pernah selesai diproses.

Fungsi halaman ini:

- melihat job yang sudah selesai
- membuka hasil clip lama
- download ulang hasil clip
- menjadwalkan clip dari job sebelumnya

Cara penggunaan:

1. buka menu **History**
2. pilih job yang ingin dilihat
3. buka detail hasil clip

---

## 5. History Detail

Halaman detail history menampilkan semua clip dari satu job tertentu.

Di halaman ini user bisa:

- preview clip
- melihat score clip
- melihat tipe clip
- melihat caption
- download clip
- edit subtitle
- schedule clip ke TikTok

User juga dapat:

- mengurutkan clip berdasarkan score
- download semua clip sekaligus
- membuat upload baru

---

## 6. Scheduler

Halaman Scheduler digunakan untuk mengelola akun TikTok dan jadwal posting.

Fungsi halaman ini:

- menghubungkan akun TikTok
- melihat daftar akun TikTok yang terhubung
- melihat posting terjadwal
- memantau status posting
- mengubah atau membatalkan jadwal tertentu

Status posting yang umum:

- pending
- posting
- posted
- failed
- cancelled

Cara penggunaan:

1. buka halaman **Scheduler**
2. klik **Add Account** untuk menghubungkan akun TikTok
3. setelah akun terhubung, kembali ke halaman clip
4. pilih clip yang ingin dijadwalkan
5. pilih akun, tanggal, dan jam posting

---

## 7. Scoring Guide

Halaman Scoring Guide menjelaskan cara AI menilai kualitas clip.

Fungsi halaman ini:

- membantu memahami kenapa sebuah clip dipilih
- membantu memahami arti score yang muncul
- menjelaskan tipe clip yang dikenali AI

Secara umum, AI menilai clip berdasarkan:

- potensi viral
- kejelasan cerita
- energi / engagement
- kelengkapan momen

---

## 8. Settings

Menu **Settings** sudah tersedia di navigasi sebagai tempat untuk preferensi clip, tetapi pada implementasi saat ini pengaturan utama untuk proses clip masih banyak dilakukan langsung dari halaman **Upload & Clip**.

Dengan kata lain:

- pengaturan proses yang aktif saat ini ada di halaman upload
- menu settings dapat dipakai sebagai ruang pengembangan fitur setting tambahan di versi berikutnya

---

## Pengaturan yang Memengaruhi Hasil Clip

Berikut daftar pengaturan yang saat ini paling berpengaruh terhadap hasil clip.

### A. Pengaturan AI clipping

- **Content Type**
  Menentukan konteks video yang diproses

- **Brand Name Hints / Whisper Vocabulary**
  Membantu AI mengenali istilah khusus dengan lebih akurat

### B. Pengaturan tampilan clip

- template subtitle
- font
- warna teks
- bold
- italic
- huruf besar / kecil
- letter spacing
- alignment
- ukuran subtitle
- posisi subtitle
- outline
- shadow
- background subtitle

### C. Pengaturan jump cut

Engine jump cut sudah aktif di sistem, tetapi parameter teknisnya saat ini masih dikelola secara internal dan belum dibuka sebagai setting manual di dashboard.

Sistem saat ini otomatis mengatur:

- pemotongan jeda diam
- pemisahan antar ucapan
- penggabungan atau pemecahan scene
- durasi minimum dan maksimum clip
- padding kecil di sekitar bagian ucapan

Jadi saat ini user bisa mengatur:

- konteks video
- akurasi transcription melalui brand hints
- tampilan subtitle hasil akhir

Sedangkan pengaturan teknis jump cut masih menjadi behavior internal sistem.

---

## Workflow Penggunaan yang Disarankan

Berikut workflow penggunaan yang paling umum:

1. Login ke aplikasi
2. Buka halaman **Upload & Clip**
3. Pilih tipe video
4. Upload video
5. Tambahkan brand hints bila perlu
6. Atur subtitle style
7. Klik **Process Video**
8. Tunggu proses selesai
9. Review hasil clip
10. Download clip atau edit subtitle
11. Jika diperlukan, schedule clip ke TikTok
12. Gunakan **History** untuk membuka hasil lama

---

## Re-clip Video Lama

Di halaman upload tersedia fitur **Re-clip a recent video**.

Fungsinya:

- menjalankan proses clipping ulang pada video yang pernah diproses
- menggunakan style subtitle terbaru
- tidak perlu upload ulang file yang sama

Fitur ini cocok digunakan saat ingin:

- mencoba style subtitle lain
- mendapatkan hasil clip baru dari video yang sama
- menghemat waktu karena tidak perlu memulai dari nol

---

## Tips Penggunaan

- gunakan video dengan audio yang jelas
- pilih content type yang sesuai
- isi brand hints untuk istilah unik
- gunakan subtitle style yang konsisten
- review hasil clip sebelum diposting
- gunakan akun TikTok private untuk testing integrasi saat ini

---

## Ringkasan Singkat

Jumo dipakai untuk mempercepat workflow dari video mentah menjadi short-form clip yang siap digunakan.

Halaman yang paling sering dipakai adalah:

- **Upload & Clip** untuk membuat clip
- **History** untuk melihat hasil lama
- **Scheduler** untuk mengatur posting TikTok
- **Scoring Guide** untuk memahami penilaian AI

Untuk versi saat ini, kontrol utama user ada pada:

- tipe video
- brand hints
- subtitle style

Sedangkan parameter teknis jump cut masih dikelola oleh sistem.
