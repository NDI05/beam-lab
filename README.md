# Beam Lab

**Versi rilis di GitHub: 1.0.0**

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

## Versi berikutnya

Pratinjau lokal versi 2.0 ada di [`v2/index.html`](v2/index.html), dengan asumsi model di [`v2/README.md`](v2/README.md). Versi ini menambahkan ilustrasi jembatan 2D yang berubah saat beban, material, profil, atau bentang diubah, sambil mempertahankan grafik lendutan. Rilis GitHub tetap 1.0.0 sampai versi 2.0 ditinjau dan diminta untuk dipublikasikan.
