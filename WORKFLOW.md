# Beam Lab — workflow pengerjaan

## Arah produk

Beam Lab adalah modul belajar interaktif untuk membantu mahasiswa memahami hubungan antara beban, bentang, material, penampang, dan lendutan balok. Pengalaman utamanya mengikuti loop **baca misi → prediksi → eksperimen → jelaskan → dapatkan progres**.

Versi awal memakai kasus balok sederhana dengan beban merata dan persamaan lendutan elastis. Prototipe ini adalah media belajar, bukan alat desain struktur.

## Tahapan kerja dari awal sampai selesai

| Tahap | Pekerjaan | Hasil yang diharapkan | Status |
| --- | --- | --- | --- |
| 1. Tetapkan MVP | Pilih satu kasus teknik sipil, mahasiswa sasaran, konsep yang dipelajari, dan batas versi pertama. | Kasus balok sederhana; mahasiswa mengeksplorasi efek `q`, `L`, `E`, dan `I`. | Selesai |
| 2. Rancang pengalaman | Susun urutan misi, alur prediksi–uji–jelaskan, sistem progres, dan struktur layar. | Peta misi dan pola interaksi yang konsisten. | Selesai |
| 3. Bangun fondasi aplikasi | Buat shell aplikasi, navigasi, sistem visual gambar teknik, dan layout responsif. | Aplikasi dapat dibuka dan digunakan pada desktop maupun layar kecil. | Selesai |
| 4. Implementasikan simulasi | Hitung kurva `δ(x)` dari parameter, gambar grafik SVG, tampilkan satuan, dan bandingkan kondisi awal dengan eksperimen. | Grafik dan nilai lendutan berubah saat parameter diubah. | Selesai |
| 5. Implementasikan pembelajaran | Tambahkan briefing, prediksi, eksperimen terarah, refleksi, petunjuk, dan penyelesaian misi. | Mahasiswa menyelesaikan satu loop belajar, bukan hanya mengubah slider. | Selesai |
| 6. Tambahkan gamifikasi | Tambahkan progres misi, XP, gelar, lencana konsep, dan penyimpanan progres lokal. | Eksperimen dan pemahaman memberi progres yang terlihat. | Selesai |
| 7. Rapikan dan serahkan | Pastikan batasan simulasi, satuan, akses keyboard, dan cara menjalankan aplikasi terdokumentasi. | Prototipe siap dicoba dan dikembangkan lebih lanjut. | Selesai |

## Workflow mahasiswa di dalam aplikasi

1. Mahasiswa membuka **Peta misi** dan memilih misi yang tersedia.
2. Briefing menjelaskan konteks dan parameter yang sedang dipelajari.
3. Mahasiswa memilih prediksi sebelum melihat hasil eksperimen.
4. Mahasiswa mengubah parameter utama; grafik dan `δmaks` diperbarui langsung.
5. Mahasiswa menjaga parameter lain tetap, lalu membandingkan hasil dengan prediksi.
6. Mahasiswa menjawab pertanyaan refleksi tentang hubungan sebab-akibat.
7. Aplikasi memberi umpan balik, XP, lencana, dan membuka misi berikutnya.

## Isi misi versi pertama

1. **Beban dua kali lipat** — `δmaks` berbanding lurus dengan beban merata `q`.
2. **Bentang 20% lebih panjang** — `δmaks` berbanding dengan `L⁴`.
3. **Material lebih lentur** — membagi modulus elastisitas `E` menjadi dua menggandakan lendutan.
4. **Penampang lebih kaku** — menggandakan momen inersia `I` membagi lendutan menjadi dua.
5. **Jaga lendutan** — sesuaikan `I` agar lendutan maksimum memenuhi target misi.

## Batas versi ini dan arah setelah prototipe

- Perhitungan mengasumsikan balok sederhana, beban merata, material elastis linier, dan lendutan kecil.
- Nilai awal dan target merupakan contoh pembelajaran. Validasi dosen diperlukan sebelum dipakai sebagai materi resmi.
- Berikutnya: uji kegunaan bersama mahasiswa/dosen, evaluasi apakah mereka memahami hubungan tiap parameter, lalu tambahkan dashboard kelas atau modul rumus lain berdasarkan hasil uji.
- Prototipe ini tidak menyertakan backend, akun, sinkronisasi kelas, ataupun penyimpanan data di luar perangkat.

## Pengembangan versi 2.0

Versi 2.0 disimpan di folder `v2.0/` agar versi 1.0 tetap tersedia untuk dibandingkan.

1. Ubah skenario dari beban merata menjadi truk dengan beban titik di tengah bentang.
2. Buat aset SVG untuk lanskap jembatan, kendaraan, pilihan material, dan profil balok.
3. Animasikan perubahan bentuk gelagar saat mahasiswa mengubah beban, material, profil, atau bentang.
4. Pertahankan grafik sebagai pembacaan kuantitatif dari model yang sama dengan adegan 2D.
5. Tambahkan misi pilihan desain dengan kredit simulasi dan target lendutan latihan; jelaskan bahwa keduanya bukan standar desain nyata.
6. Beri menu pemilih versi agar mahasiswa dapat berpindah antarversi.

Status: pratinjau jembatan 2D beserta aset SVG, perhitungan beban titik, grafik, lima misi, dan progres lokal dipush sebagai commit `a93bfa2` dan tag `v2.0.0`. Asumsi, preset, dan referensi teknis dicatat di `v2.0/README.md`.

## Pengembangan versi 2.5

1. Pertahankan simulasi jembatan, grafik, dan misi dari 2.0.
2. Tambahkan saluran terbuka persegi dengan persamaan Manning `Q = (1/n) A R^(2/3) S^(1/2)`.
3. Hubungkan kontrol `b`, `y`, `S`, dan `n` ke debit, penampang 2D, gerak aliran, dan grafik `Q` terhadap `y`.
4. Tambahkan soal bertahap tentang luas basah, perubahan kedalaman, dan kekasaran; beri umpan balik dan XP.
5. Simpan versi 1.0, 2.0, dan 2.5 dalam folder terpisah, tambahkan menu perpindahan versi, serta buat tag GitHub.
6. Validasi asumsi dan preset hidraulika bersama dosen sebelum dipakai sebagai materi resmi.

Status: jalur Hidraulika dan tiga soal awal tersedia di `v2.5/`; pilihannya muncul dalam menu **Versi**.

## Pengembangan versi 3.0

1. Salin baseline 2.5 ke `v3.0/` agar seluruh misi, rumus, grafik, soal, dan pola gamifikasi tetap tersedia.
2. Ganti scene jembatan dan saluran SVG dengan geometri Three.js yang dibundel lokal, tanpa CDN saat runtime.
3. Hubungkan beban, bentang, material, dan profil ke deformasi gelagar 3D; pertahankan grafik lendutan sebagai pembacaan kuantitatif.
4. Hubungkan lebar, kedalaman, kemiringan, dan kekasaran ke dimensi kanal, muka air animasi, debit Manning, dan grafik `Q` terhadap `y`.
5. Tambahkan orbit drag/touch, zoom, reset kamera, fallback WebGL, dan dukungan reduced motion serta keyboard.
6. Pisahkan progres V3 dari versi sebelumnya dan tambahkan V3 pada hub serta menu pemilih versi.

Status baseline sebelum redesign 15 Oktober 2026: V3 saat itu dideploy ke `https://beam-lab-one.vercel.app/v3.0/` dari workspace lokal. Scene 3D bersifat edukatif; deformasi divisualkan lebih besar dari nilai fisik agar mudah dilihat.

## Menjalankan prototipe

Buka `index.html` langsung di browser. Progres misi disimpan di penyimpanan lokal browser; tombol **Mulai ulang progres** menghapus progres prototipe pada perangkat tersebut.

## Redesign V3 setelah audit 15 Oktober 2026

1. Terapkan prinsip Taste Skill untuk ruang eksperimen dengan tipografi terbaca dan scene sebagai fokus.
2. Pisahkan perhitungan ke `v3.0/model.js` agar scene dan grafik konsisten.
3. Ganti renderer dengan Three.js yang dibundel lokal; tambahkan kendaraan bergerak, muatan, bayangan, penampang, dan partikel air.
4. Hubungkan materi dan kondisi eksperimen; tambahkan catatan A/B, angka bersatuan, penjelasan, dan petunjuk bertahap.
5. Benahi kunci bentang, kelulusan, latihan ulang, rute, reset progres, dan penyimpanan.
6. Periksa seluruh delapan latihan, hitungan otomatis, serta komposisi desktop/tablet/ponsel.

Status redesign 15 Oktober 2026: kode tersedia di branch `main`; delapan latihan dimainkan di browser, 11 pengujian model lulus, build berhasil, dan lint Taste Skill 0 FAIL/0 WARN. Project Vercel `beam-lab` kini terhubung ke repo `NDI05/beam-lab`; push ke `main` memicu deployment production dan pull request mendapat preview. Catatan rinci ada di [PERBAIKAN_BEAM_LAB_V3.md](PERBAIKAN_BEAM_LAB_V3.md). Untuk V3 jalankan `npm run dev`; setelah mengubah renderer, jalankan `npm run build`.
