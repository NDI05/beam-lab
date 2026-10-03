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

## Menjalankan prototipe

Buka `index.html` langsung di browser. Progres misi disimpan di penyimpanan lokal browser; tombol **Mulai ulang progres** menghapus progres prototipe pada perangkat tersebut.
