# Beam Lab 3.0

Studio belajar Teknik Sipil dengan lima misi jembatan dan tiga latihan debit air. Redesign 15 Oktober 2026 memakai prinsip Taste Skill, scene Three.js, catatan A/B, serta jawaban numerik dan penjelasan yang dinilai bersama. Kode tersimpan di GitHub branch `main`.

## Menjalankan

Dari root workspace, jalankan `npm install`, `npm run build`, lalu `npm run dev`. Buka `http://localhost:8765/v3.0/index.html`. Bundle renderer sudah disertakan; tidak ada CDN saat runtime. Pengujian membuka `file://` tidak dilakukan karena kebijakan alat browser membatasinya.

## Struktur

- `model.js`: model hitungan bersama untuk UI, grafik, dan scene.
- `lessons.js`: konteks, teori, target, penilaian, dan petunjuk.
- `app.js`: workflow, rute, kontrol, grafik, dan progres lokal.
- `scene3d.js`: sumber renderer Three.js. Bangun ulang setelah mengubahnya.
- `scene3d.bundle.js`: bundle browser yang dimuat halaman.
- `assets/`: font lokal, ikon, dan lisensi. Objek scene dibuat prosedural.

## Scene dan batas model

Jembatan memakai beban titik dengan lendutan elastis. Animasi truk menuju tengah memperbarui posisi beban secara kuasistatik; deformasi visual diperbesar ×8. Saluran memakai Manning untuk aliran seragam, tinggi dinding tetap 3 m, gerak partikel ×0,6, dan kemiringan visual ×8. Potongan dinding transparan membantu melihat air.

Perspektif, samping, penampang, orbit, zoom, anotasi, jeda, dan reset tersedia. Preferensi reduced motion dihormati. Kamera dipertahankan saat menjawab. Jika scene tidak tersedia, kontrol dan hitungan tetap dapat digunakan.

Ini media belajar dengan gaya maket 3D. Tidak memodelkan kegagalan struktur, interaksi roda/inersia kendaraan, turbulensi, luapan, atau desain keselamatan.

## Pemeriksaan

`npm test` menjalankan 11 pemeriksaan model dan materi. Seluruh delapan latihan telah dimainkan di browser lokal; tampilan diperiksa pada 390/768/1440 px. Catatan lengkap ada di [`PERBAIKAN_BEAM_LAB_V3.md`](../PERBAIKAN_BEAM_LAB_V3.md). Perubahan redesign belum dideploy ulang ke Vercel; project Vercel belum tertaut ke GitHub untuk auto-deploy.
