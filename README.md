# Beam Lab

**Versi terbaru dalam pengembangan: 3.0.0**

Beam Lab adalah prototipe pembelajaran Teknik Sipil berbasis misi. Mahasiswa membuat prediksi, mengubah parameter, mengamati model dan grafik, lalu menjelaskan hasilnya.

## Menjalankan aplikasi

Buka `index.html` di browser untuk versi 1.0 atau [`v2/index.html`](v2/index.html) untuk memilih versi. Untuk V3 terbaru, jalankan `npm install`, `npm run build`, lalu `npm run dev` dari root workspace dan buka `http://localhost:8765/v3.0/index.html`. Renderer Three.js dibundel lokal, tanpa CDN saat runtime. Progres setiap versi disimpan terpisah di penyimpanan lokal browser.

## Versi yang tersedia

- **1.0** — balok dasar dan grafik lendutan: [`index.html`](index.html), tag `v1.0.0`.
- **2.0** — jembatan 2D, eksperimen beban, dan grafik: [`v2.0/index.html`](v2.0/index.html), tag `v2.0.0`.
- **2.5** — jembatan dan simulasi debit Manning dengan bank soal: [`v2.5/index.html`](v2.5/index.html), tag `v2.5.0`.
- **3.0** — scene 3D interaktif untuk jembatan dan saluran air, dipadukan dengan grafik dan materi V2.5: [`v3.0/index.html`](v3.0/index.html), [deployment Vercel](https://beam-lab-one.vercel.app/v3.0/). Kode V3 tersedia di branch `main`; tag rilis `v3.0.0` belum dibuat.

V3 menyediakan kendaraan bergerak, muatan, bayangan, penampang berongga, orbit/zoom, serta aliran air. Scene dan grafik memakai model perhitungan bersama. Latihan memakai catatan A/B, jawaban numerik, dan penjelasan sebelum progres diberikan. Prototipe ini bukan alat desain struktur, drainase, atau keselamatan.

Redesign 15 Oktober 2026 sudah terbit ke production di [Beam Lab](https://beam-lab-one.vercel.app/v3.0/). Repo GitHub `NDI05/beam-lab` terhubung ke project Vercel `beam-lab`: push ke `main` menerbitkan production, sedangkan pull request mendapat deployment preview. Build Vercel memeriksa dan menerbitkan situs statis; pemeriksaan model/materi tersedia melalui `npm test`. Rincian implementasi dan pemeriksaan ada di [catatan perbaikan](PERBAIKAN_BEAM_LAB_V3.md).

Asumsi materi dan alur pengembangan dicatat di [WORKFLOW.md](WORKFLOW.md). Catatan implementasi V3 ada di [v3.0/README.md](v3.0/README.md).
