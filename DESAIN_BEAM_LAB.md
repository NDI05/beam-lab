# Beam Lab: rancangan perbaikan

## Brief

Beam Lab menjadi studio eksperimen Teknik Sipil: mahasiswa membuat dugaan, mengubah kondisi nyata pada model, membandingkan bukti, lalu menjelaskan hasil.

Audiensnya mahasiswa yang sedang belajar mekanika struktur dan hidraulika. Objek jembatan dan saluran menjadi pusat pembelajaran. Keputusan mahasiswa harus terlihat pada objek, grafik, serta hasil hitung.

## Penerapan Taste Skill

Sumber: https://www.tasteskill.dev/docs dan https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill. Salinan panduan tersimpan sebagai alat bantu lokal dan tidak menjadi bagian dari aplikasi.

Skill yang tersedia dari sumber saat dibaca adalah v2. Panduan utamanya ditujukan untuk halaman publik dan secara eksplisit mengecualikan dashboard/app screens. Prinsip komposisi, keterbacaan, substansi, serta pemeriksaan visual diterapkan pada Beam Lab. Aturan jumlah foto, animasi pemasaran, dan galeri tidak dipaksakan pada ruang belajar ini. Grafik ilmiah, angka/satuan, kontrol formulir, serta penanda progres mempunyai fungsi nyata.

Browser diperiksa melalui alat browser yang tersedia di sesi ini; skrip inspector dengan kontrol browser sendiri tidak dijalankan. Hasil pemeriksaan dan keterbatasan dicatat setelah implementasi.

## Inventaris subjek

- Jembatan bertumpuan sederhana.
- Truk dengan massa yang dapat diganti.
- Beban titik dan posisi kendaraan.
- Modulus elastisitas baja, beton, dan kayu.
- Bentuk penampang I, box, dan persegi solid.
- Lengkung lendutan serta pembanding kondisi awal.
- Bentang 8 m dan percobaan pertambahan 20%.
- Batas 110 kredit dan 20 mm pada tantangan desain.
- Saluran persegi panjang, luas basah, dan keliling basah.
- Debit Manning dan jejak gerak air.
- Catatan eksperimen sebagai bukti jawaban.
- Progres misi lokal yang sudah dimiliki pengguna.

## Argumen halaman

1. Perubahan beban mempunyai akibat yang dapat dilihat. Bukti: scene interaktif dan hasil lendutan.
2. Belajar dilakukan melalui eksperimen. Bukti: misi struktur yang dapat dimainkan, bukan daftar fitur.
3. Prinsip yang sama berlaku pada saluran air. Bukti: kontrol geometri, debit, dan soal yang memakai kondisi scene.

## Ide visual dan interaksi

Pada halaman ini, lengkung lendutan jembatan menjadi pusat eksperimen yang menghubungkan tindakan, objek, dan grafik.

Interaksi utamanya adalah mengubah beban pada model yang benar-benar bekerja. Tidak ada metrik, testimoni, atau klaim pengguna yang dibuat-buat. Detail konteks adalah preset pembelajaran yang ditandai sebagai demikian.

## Sistem visual

- Satu keluarga huruf yang terbaca, angka tabular untuk hasil.
- Latar putih keabu-abuan, tinta gelap, dan satu aksen hijau.
- Permukaan dibedakan dengan warna bidang, tanpa dekorasi gradien atau panel kaca.
- Navigasi singkat dan konsisten: Peta misi, Simulasi 3D, Debit air.
- Scene 3D luas, kontrol dekat dengan objek, grafik dilengkapi pembanding dan keterangan satuan.
- Animasi berfungsi menunjukkan respons. Preferensi reduced motion dan tombol jeda menghentikan gerak berulang.

Draw Taste Skill memilih **One motif**, seed **2315**. Palet dan typeface draw untuk situs pemasaran disesuaikan ke kebutuhan studio belajar: Manrope, bidang netral, dan hijau dari lingkungan model. Bentuk tabbed folder dan galeri foto tidak diterapkan karena halaman ini adalah aplikasi eksperimen. Hasil pemeriksaan dan batas penerapan tercatat di `PERBAIKAN_BEAM_LAB_V3.md`.

## Sasaran fungsi

Perbaiki kunci bentang; gunakan model perhitungan bersama; hilangkan clipping deformasi tersembunyi; cegah klaim penguasaan saat jawaban salah; buat percobaan ulang baru; variasikan urutan pilihan; hubungkan soal debit dengan eksperimen; simpan kamera; jelaskan skala visual; sediakan petunjuk bertahap dan catatan A/B.
