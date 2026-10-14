<div align="center">

  <img src="apps/frontend/public/WAIBlue.png" alt="WAI Logo" width="120" style="margin-bottom: 12px;"/>

  # 🌊 WAI — Water Awareness & Information
  ### *Next-Generation Flood Crowdsourcing & Edge-AI Geospatial Intelligence*

  <p align="center">
    Platform pemantauan, pelaporan, dan mitigasi bencana banjir partisipatif yang menggabungkan <b>Client-Side Edge AI (MobileNetV3 ONNX)</b>, <b>Interactive GIS Mapping</b>, serta <b>Admin Moderation Engine</b>.
  </p>

  <p align="center">
    <a href="#-fitur-utama"><img src="https://img.shields.io/badge/Status-Active_Development-0070f3?style=for-the-badge" alt="Status"/></a>
    <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-MERN_%2B_TypeScript-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="Stack"/></a>
    <a href="#-evaluasi-model-ai"><img src="https://img.shields.io/badge/AI_Accuracy-94.32%25-00b894?style=for-the-badge&logo=pytorch&logoColor=white" alt="AI Accuracy"/></a>
    <a href="#-lisensi"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"/></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19"/>
    <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
    <img src="https://img.shields.io/badge/ONNX_Runtime_Web-005CED?style=flat-square&logo=onnx&logoColor=white" alt="ONNX Runtime"/>
    <img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white" alt="Express"/>
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB"/>
  </p>

  <br/>

  <a href="#-tentang-proyek">Tentang</a> •
  <a href="#-fitur-utama">Fitur Utama</a> •
  <a href="#-arsitektur-dan-edge-ai">Edge AI & GIS</a> •
  <a href="#-struktur-proyek">Struktur Proyek</a> •
  <a href="#-panduan-instalasi">Instalasi</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-overview">API Reference</a>

</div>

<br/>

---

## 📌 Tentang Proyek

**WAI (Water Awareness & Information)** adalah solusi digital modern dalam menjawab tantangan tanggap darurat dan pemetaan banjir di perkotaan. Seringkali informasi banjir tersebar sporadis di media sosial tanpa validasi akurat, titik koordinat yang presisi, maupun data kedalaman air yang terukur.

WAI hadir sebagai ekosistem satu pintu yang memberdayakan masyarakat (*crowdsourcing*) untuk melaporkan genangan banjir dengan validasi pintar:
- ⚡ **Verifikasi AI Otomatis di Browser**: Foto bukti laporan langsung diverifikasi oleh model Machine Learning di perangkat pelapor (*Zero Server Overhead*).
- 📍 **Presisi Geospasial Berstandar GIS**: Titik pelaporan dikunci menggunakan GPS berakurasi tinggi dengan batas spasial (*geofencing*).
- 🛡️ **Pusat Komando & Analitik**: Otoritas dan pemangku kepentingan dapat memvalidasi laporan, menumpangkan layer spasial (SHP/KML), memantau tren kedalaman air, dan mengekspor data untuk mitigasi taktis.

<br/>

---

## ✨ Fitur Utama

```
┌────────────────────────────────────────────────────────────────────────┐
│                        🌊 WAI CORE CAPABILITIES                       │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│ 🤖 On-Device AI │ 🗺️ Smart GIS     │ 📊 Analytics & Moderation        │
│ • Zero latency   │ • Layer SHP/KML  │ • Audit Approval System          │
│ • 94.32% Akurasi │ • Kedalaman air  │ • Ekspor XLSX / CSV              │
│ • Privasi terjaga│ • Time Slider    │ • Visualisasi tren keparahan     │
└──────────────────┴──────────────────┴──────────────────────────────────┘
```

### 1. 🤖 In-Browser Edge AI Image Classification
* **MobileNetV3 Deep Learning Model**: Mengklasifikasikan keaslian foto (*"Banjir"* vs *"Bukan Banjir"*) secara instan sebelum laporan dikirim.
* **ONNX Runtime Web (WASM Engine)**: Inferensi dieksekusi 100% pada CPU/WebAssembly browser pengguna, meminimalisir biaya server backend dan menghemat kuota transmisi.
* **Filter Anti-Hoax**: Mencegah laporan palsu atau unggahan gambar acak secara otomatis.

### 2. 🗺️ Sistem Informasi Geospasial (GIS) Interaktif
* **Pemetaan Real-time**: Visualisasi marker interaktif berbasis Leaflet dengan indikator keparahan dinamis berdasarkan kedalaman air (*Hijau < 30 cm, Kuning 30–70 cm, Oranye 70–150 cm, Merah > 150 cm*).
* **Time-Slider Historis**: Eksplorasi kronologi persebaran banjir berdasarkan rentang waktu atau hari tertentu.
* **Spatial Layer Engine Multi-Format**:
  * Import file **Shapefile (.zip / .shp)**, **KML / KMZ**, dan **GeoJSON**.
  * Konversi dan reproyeksi koordinat otomatis (*Proj4 projection engine*) ke standard **WGS84 (EPSG:4326)**.
* **Geofence Boundary**: Memastikan pelaporan berada pada radius wilayah operasional yang didukung.

### 3. 🛡️ Panel Moderasi & Manajemen Admin
* **Sistem Audit Laporan**: Admin dapat menyetujui (*Approve*), meninjau (*Pending*), atau menolak (*Reject*) laporan masyarakat.
* **Layer Manager**: Kontrol visibilitas layer peta, styling poligon, dan manajemen data spasial instan.
* **User & Credential Security**: Dilindungi proteksi JWT, password hashing bcrypt, serta header proteksi Helmet.

### 4. 📈 Analitik Data & Ekspor Komprehensif
* **Statistik Visual**: Rangkuman total laporan terverifikasi, rata-rata kedalaman air, dan zonasi paling terdampak.
* **One-Click Export**: Unduh seluruh riwayat rekaman bencana ke dalam format **Excel (.xlsx)** atau **CSV** untuk kebutuhan laporan dinas kebencanaan.

### 5. 🎨 Desain Modern & Pengalaman Pengguna
* Antarmuka bersih, responsif, dan elegan bertema hidrologi modern.
* Panduan Pengguna Interaktif (*Interactive User Guide & Onboarding Modal*) untuk edukasi keselamatan mitigasi banjir.

<br/>

---

## 🧠 Evaluasi Model AI (MobileNetV3)

Model klasifikasi gambar dilatih dengan transfer learning arsitektur **MobileNetV3** dan dievaluasi pada dataset independen sebanyak 1.180 sampel citra:

| Metrik Evaluasi | Nilai Hasil Uji | Keterangan |
| :--- | :---: | :--- |
| **Akurasi Global (Accuracy)** | **94.32%** | Performa keseluruhan pada data uji |
| **Presisi (Kelas Banjir)** | **92.77%** | Ketepatan deteksi citra banjir riil |
| **Recall / Sensitivitas (Banjir)** | **95.29%** | Kemampuan menangkap kejadian banjir |
| **F1-Score (Banjir)** | **94.01%** | Keseimbangan harmonis Precision-Recall |
| **Presisi (Kelas Bukan Banjir)** | **95.76%** | Efektif menyaring gambar non-banjir |
| **F1-Score (Bukan Banjir)** | **94.60%** | Meminimalisir kesalahan deteksi |

```
Confusion Matrix (1,180 Samples):
┌──────────────────────────┬──────────────────────────┐
│ True Flood: 526          │ False Non-Flood: 26      │
├──────────────────────────┼──────────────────────────┤
│ False Flood: 41          │ True Non-Flood: 587      │
└──────────────────────────┴──────────────────────────┘
```

<br/>

---

## 🏗️ Tech Stack

### Frontend Application
* **Framework & Build**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Geospatial & Mapping**: [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/)
* **Edge AI Engine**: [ONNX Runtime Web](https://onnxruntime.ai/) (WASM)
* **Icons & UI**: [Lucide React](https://lucide.dev/)
* **Data Processing**: [SheetJS (xlsx)](https://sheetjs.com/), [Axios](https://axios-http.com/)

### Backend & API
* **Runtime & Framework**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
* **Database & ODM**: [MongoDB](https://www.mongodb.com/), [Mongoose 9](https://mongoosejs.com/)
* **Spatial Processing**: [Proj4](https://github.com/proj4js/proj4js), [Shapefile](https://github.com/mbostock/shapefile), [@tmcw/togeojson](https://github.com/tmcw/togeojson)
* **Security & Auth**: [JSON Web Token (JWT)](https://jwt.io/), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [Helmet](https://helmetjs.github.io/), [Express Rate Limit](https://express-rate-limit.mintlify.app/)

<br/>

---

## 📁 Struktur Monorepo

```plaintext
wai-mern/
├── apps/
│   ├── backend/                     # Layanan API Express & Database
│   │   ├── src/
│   │   │   ├── controllers/         # Logika autentikasi, laporan, & layer GIS
│   │   │   ├── middleware/          # JWT auth & sanitasi input
│   │   │   ├── models/              # Skema MongoDB (Report, SpatialLayer)
│   │   │   ├── routes/              # Routing REST API
│   │   │   └── utils/               # GIS parser (SHP, KML, GeoJSON, Proj4)
│   │   ├── index.ts                 # Entrypoint server Express
│   │   ├── seed_reports.ts          # Script seeding data historis
│   │   └── package.json
│   │
│   └── frontend/                    # Antarmuka Pengguna React 19 + Vite
│       ├── public/
│       │   ├── model_mobilenetv3/   # Model ONNX MobileNetV3 & index kelas
│       │   ├── layers/              # Data spasial & boundary default
│       │   └── ...
│       ├── src/
│       │   ├── api/                 # Konfigurasi client Axios
│       │   ├── components/          # Komponen peta, dashboard admin, time slider
│       │   ├── pages/               # Halaman Peta, Login, Dashboard, Panduan
│       │   └── utils/               # aiService (ONNX), geofencing, export XLSX
│       └── package.json
│
├── models_archive/                  # Checkpoint PyTorch (.pth) & hasil evaluasi
├── render.yaml                      # Blueprint konfigurasi deploy Render
└── package.json                     # Monorepo root configuration
```

<br/>

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
* [Node.js](https://nodejs.org/) v18+ atau [Bun](https://bun.sh/)
* [MongoDB](https://www.mongodb.com/) (Local Community Server atau MongoDB Atlas)
* [Git](https://git-scm.com/)

### 2. Clone Repositori
```bash
git clone https://github.com/HYPExREAL/wai-mern.git
cd wai-mern
```

### 3. Setup Backend
Masuk ke folder `apps/backend` dan pasang dependensi:
```bash
cd apps/backend
npm install
```

Buat file konfigurasi environment `.env` di dalam folder `apps/backend`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wai-flood
JWT_SECRET=super_secret_jwt_key_wai_2026
ADMIN_EMAIL=admin@wai.local
ADMIN_PASSWORD_HASH=$2a$10$... # Hash bcrypt password admin
FRONTEND_URL=http://localhost:5173
```

Jalankan server backend:
```bash
# Mode development dengan hot-reload
npm run dev
```
Server akan aktif di `http://localhost:5000`.

*(Opsional) Ingin melakukan seeding data historis laporan:*
```bash
npx tsx seed_reports.ts
```

### 4. Setup Frontend
Buka terminal baru, masuk ke folder `apps/frontend`:
```bash
cd apps/frontend
npm install
```

Buat file `.env` di dalam folder `apps/frontend` (opsional jika backend di port berbeda):
```env
VITE_API_URL=http://localhost:5000
```

Jalankan dev server frontend:
```bash
npm run dev
```
Buka peramban di `http://localhost:5173`.

<br/>

---

## 🌐 Deployment

Proyek ini telah dikonfigurasi untuk deployment *cloud* modern yang efisien:

* **Backend API**: Dikonfigurasi dengan [`render.yaml`](./render.yaml) untuk dideploy sebagai Web Service pada **Render** atau server container Node.js lainnya.
* **Frontend Application**: Dioptimalkan untuk **Vercel** menggunakan konfigurasi [`apps/frontend/vercel.json`](./apps/frontend/vercel.json) dengan rewrite SPA routing.
* **Edge AI WASM Delivery**: ONNX Runtime WebAssembly disajikan melalui CDN berperforma tinggi (*jsdelivr*), menjaga ukuran bundle aplikasi tetap ringan.

<br/>

---

## 📡 Ringkasan REST API

| Method | Endpoint | Deskripsi | Akses |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/health` | Status kesehatan server | Publik |
| `POST` | `/api/auth/login` | Login admin & generate token JWT | Publik |
| `GET` | `/api/reports` | Mengambil seluruh titik laporan banjir | Publik |
| `POST` | `/api/reports` | Mengirim laporan banjir baru | Publik |
| `PATCH` | `/api/reports/:id/status` | Mengubah status laporan (*approved/rejected*) | Admin |
| `DELETE` | `/api/reports/:id` | Menghapus laporan banjir | Admin |
| `GET` | `/api/layers` | Mengambil daftar spatial layer GIS | Publik |
| `POST` | `/api/layers` | Upload & convert layer spasial (SHP/KML/GeoJSON) | Admin |
| `DELETE` | `/api/layers/:id` | Menghapus spatial layer | Admin |

<br/>

---

## 🤝 Berkontribusi

Kontribusi selalu terbuka lebar untuk meningkatkan efektivitas penanggulangan banjir!
1. **Fork** repositori ini
2. Buat branch fitur baru (`git checkout -b feature/FiturKeren`)
3. Commit perubahan Anda (`git commit -m 'feat: Tambahkan fitur keren'`)
4. Push ke branch Anda (`git push origin feature/FiturKeren`)
5. Buka **Pull Request**

<br/>

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT License**. Lihat `LICENSE` untuk informasi selengkapnya.

<br/>

<div align="center">
  <b>WAI (Water Awareness & Information)</b> — <i>Mewujudkan Kesadaran Tanggap Bencana Berbasis Teknologi Komunitas.</i>
  <br/>
  Made with 💙 for Safer Communities.
</div>
