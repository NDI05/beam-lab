# Beam Lab

**Versi terbaru: 2.5.0**

Beam Lab adalah prototipe pembelajaran Teknik Sipil yang membantu mahasiswa memahami lendutan balok melalui misi interaktif: membuat prediksi, mengubah parameter, membaca grafik, lalu menjelaskan hasilnya.

## Menjalankan aplikasi

Buka `index.html` di browser. Aplikasi tidak membutuhkan proses build atau dependensi eksternal. Progres misi disimpan di penyimpanan lokal browser yang digunakan.

## Isi versi 1.0

- Peta progres dengan lima misi berurutan.
- Simulasi balok sederhana dengan beban merata.
- Grafik lendutan langsung untuk parameter `q`, `L`, `E`, dan `I`.
- Perbandingan kondisi awal dengan hasil eksperimen.
- Prediksi, refleksi, XP, dan progres lokal.

Asumsi dan workflow pengembangan dicatat di [WORKFLOW.md](WORKFLOW.md). Model ini untuk pembelajaran, bukan alat desain struktur.

## Pilih versi

Ketiga versi tersedia dari menu **Versi** di aplikasi. Halaman awal tetap membuka 1.0; gunakan menu tersebut untuk berpindah.

- **1.0** — aplikasi awal: buka [`index.html`](index.html), tag GitHub `v1.0.0`.
- **2.0** — animasi jembatan 2D dan grafik lendutan: buka [`v2.0/index.html`](v2.0/index.html), tag `v2.0.0`.
- **2.5** — materi 2.0 ditambah simulasi debit air, grafik Manning, dan bank soal: buka [`v2.5/index.html`](v2.5/index.html), tag `v2.5.0`.

[`v2/index.html`](v2/index.html) juga menyediakan halaman pemilih versi. Folder versi 2.0 dan 2.5 menyimpan progres pembelajaran secara terpisah di browser.
