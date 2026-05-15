# SAINTIFIKS: Arsitektur & Konstitusi Sistem

## 1. Identitas & Filosofi Editorial
* **Tagline:** Mereka punya narasi, kami punya angka.
* **Fokus Konten:** Jurnalisme berbasis data, realisme struktural, dan analisis makroekonomi. Model penyajian berorientasi pada ketegasan analitis yang mengandalkan objektivitas kuantitatif.
* **Prinsip Epistemik:** Menghindari simplifikasi yang menyesatkan. Terdapat pemisahan visual dan struktural yang absolut antara metrik faktual dan interpretasi spekulatif.

## 2. Sistem Desain & Antarmuka
Sistem visual bersifat statis dan tertemplate untuk memastikan konsistensi lintas halaman.

**Sistem Warna:**
* **Base:** Hitam pekat (Teks primer, Elemen struktural) dan Putih hangat (Background).
* **Indikator Positif/Naik:** Biru (`#002EC7`)
* **Indikator Negatif/Turun:** Merah (`#C90203`)
* **Indikator Spekulatif/Klaim Belum Teruji:** Kuning (`#DFAB00`) - Digunakan sebagai highlight halus (bukan elemen dekoratif) untuk menandai interpretasi editorial.

**Hierarki Tipografi:**
* **Primary (Konten Artikel/Analisis):** Libre Baskerville. (Serif elegan untuk keterbacaan panjang).
* **Secondary (Data/Angka/Statistik):** IBM Plex Mono. (Monospace presisi untuk notasi ilmiah, tabel metrik, dan grafik).
* **Tertiary (UI/Navigasi/Kicker):** Helvetica. (Sans-serif bersih untuk antarmuka).

## 3. Infrastruktur Teknis
Berjalan sepenuhnya pada ekosistem *serverless* gratis.
* **Frontend:** GitHub Pages (`https://saintifiks.github.io`). Host file statis (HTML, CSS, JS).
* **Backend:** Google Apps Script (GAS) Web App. Bertindak sebagai API untuk validasi logika sisi server (contoh: *one person one like*).
* **Database:** Google Sheets (6 tab relasional).
* **Otentikasi:** Google Identity Services (One Tap Login) diverifikasi melalui ID Token di GAS.

## 4. Skema Basis Data (Google Sheets)
Terdapat 6 tab utama yang saling merujuk:
1. `users`: `email`, `name`, `created_at`, `last_login`
2. `articles`: `article_id`, `title`, `category`, `published_at`, `like_count`
3. `likes`: `email`, `article_id`, `liked_at`
4. `comments`: `comment_id`, `email`, `name`, `article_id`, `content`, `parent_comment_id`, `created_at`, `is_published`
5. `sessions`: `session_id`, `identifier`, `article_id`, `duration_seconds`, `recorded_at`
6. `subscriptions`: `email`, `subscribed_at`, `is_active`

## 5. Struktur Direktori Repositori (Target)
```text
/
├── index.html              (Beranda Utama)
├── tentang.html            (Manifes & Prinsip Editorial)
├── css/
│   └── saintifiks.css      (Konstitusi Visual Global)
├── js/
│   ├── auth.js             (Logika Google One Tap & Token)
│   ├── api.js              (Komunikasi Fetch POST/GET ke GAS)
│   └── saintifiks-charts.js(Konfigurasi Tema Chart.js)
└── artikel/                (Direktori Konten)
    └── template.html       (Struktur Baku Artikel Saintifiks)
