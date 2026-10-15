# Perbaikan Beam Lab V3

Tanggal: 15 Oktober 2026. Status: kode redesign disimpan di GitHub branch `main`; belum dideploy ulang ke Vercel. Project Vercel belum tertaut ke GitHub.

## Perubahan utama

Beam Lab memakai ruang eksperimen baru dengan satu keluarga huruf Manrope, permukaan netral, aksen hijau, dan navigasi singkat. Sidebar lama diganti agar objek mempunyai ruang lebih besar. Kontrol desktop ditempatkan di sebelah scene; pada ponsel kontrol dan tombol menyimpan percobaan berada berdekatan dengan objek. Tahap prediksi/penjelasan memprioritaskan panel jawaban pada layar sempit.

Renderer WebGL lama diganti dengan scene Three.js yang dibundel lokal. Truk mempunyai kabin, roda, pelek, bak, muatan, dan pengikat. Muatan visual bertambah saat tonase naik. Animasi membawa truk ke tengah jembatan, dengan perhitungan beban titik pada posisi yang berubah. Geometri lendutan dan grafik menggunakan model fisika yang sama.

Pencahayaan lingkungan, bayangan, permukaan material, terrain, sungai, dan vegetasi memberi kedalaman scene. Mode Penampang menampilkan potongan profil I/solid/box secara terpisah; rongga box benar-benar terbentuk. Saluran mempunyai dinding tetap 3 m, penggaris, permukaan air bergerak, dan partikel aliran. Dinding dekat dibuat transparan sebagai potongan visual yang dijelaskan di UI.

## Penerapan Taste Skill

Panduan yang dibaca: [dokumentasi Taste Skill](https://www.tasteskill.dev/docs) serta `skills/taste-skill/SKILL.md` pada [repositori sumber](https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill). Salinan skill yang digunakan tersimpan di workspace developer, bukan bagian dari aplikasi.

- Arah yang diperoleh: **One motif**, seed **2315**. Motif yang dipilih adalah lengkung balok sebagai objek eksperimen nyata.
- Sheet pemasaran tidak diterapkan secara harfiah pada aplikasi belajar. Skill sumber secara eksplisit mengecualikan app screens. Ketentuan empat foto, stack folder, dan banyak animasi dekoratif tidak relevan dengan ruang eksperimen ini.
- Palet navy/pink dari draw diganti dengan warna netral dan hijau dari lingkungan model. Typeface draw diganti Manrope untuk satu sistem huruf yang terbaca. Alasan penyesuaian adalah kebutuhan aplikasi belajar dan keterbacaan, bukan klaim mengikuti sheet secara literal.
- Tidak ada stok foto, testimoni, statistik pengguna, atau tangkapan UI fiktif. Seluruh objek pada scene dibuat secara prosedural. Manrope dan Three.js mempunyai salinan lisensi pada folder aset.
- `lint.mjs` dijalankan: **0 FAIL, 0 WARN**. Pengecualian tertulis hanya untuk bayangan menu terbuka/dialog; garis grafik dan field merupakan UI fungsional.
- Inspector bawaan yang mengendalikan browser sendiri tidak dijalankan. Pemeriksaan browser dilakukan melalui alat browser sesi ini pada **1440, 768, dan 390 px**. Tidak mengklaim lulus seluruh aturan inspector pemasaran.

## Status terhadap audit awal

| Temuan | Hasil implementasi |
| --- | --- |
| A01, kunci bentang | Pilihan dan kunci menjadi 1,73 kali; soal numerik menerima 1,728/1,73. |
| A02, deformasi mentok | Clipping amplitudo dihapus. Lendutan dihitung dari model bersama dan ditampilkan dengan faktor tetap ×8. |
| A03, kelulusan salah | Bukti eksperimen, angka, dan penjelasan harus benar sebelum latihan selesai. Prediksi salah tetap boleh diuji. |
| A04, semua kunci di depan | Pilihan diacak stabil per attempt, termasuk saat kembali ke halaman. |
| A05, soal debit terpisah | Tiap soal mempunyai kondisi awal, variabel yang diuji, target, dan hasil tercatat yang menjadi dasar jawaban. n = 0,030 tersedia untuk eksperimen penggandaan. |
| A06, ulangi | Attempt baru mengosongkan jawaban dan bukti; riwayat selesai/XP tetap ada. Hadiah tidak digandakan. |
| A07, keputusan terbatas | Tantangan desain mewajibkan dua rancangan tercatat. Tutorial dasar tetap terarah; variasi kasus transfer dan solusi desain yang lebih luas masih dapat dikembangkan. |
| A08, petunjuk bocor | Tiga tingkat bantuan: arah pengamatan, hubungan rumus, lalu contoh penyelesaian. |
| A09, kurva berbeda | Geometri dan grafik memanggil fungsi lendutan yang sama, termasuk selama gerak truk kuasistatik. |
| A10, aksi visual | Kendaraan bergerak, roda berputar, muatan bertambah, dan profil berongga dapat diperiksa. Gaya visual berupa maket 3D, belum fotorealistis. |
| A11, dinding tumbuh | Tinggi dinding tetap 3 m; kedalaman air diubah sendiri, maksimal 2,5 m pada latihan. |
| A12, skala air | Lebar/kedalaman, V, A, R, dan Q ditampilkan. Gerak partikel ×0,6 serta kemiringan visual ×8 diberi keterangan. |
| A13, kamera reset | Scene tetap terpasang saat jawaban, petunjuk, feedback, dan fase berubah. Penggantian bentuk/material memperbarui geometri dengan kamera tetap. |
| A14, pembanding grafik | Grafik debit mempunyai baseline A. Sumbu memakai rentang kedua kondisi; angka/perubahan dan catatan A/B tersedia. Pemilihan titik grafik langsung belum ditambahkan. |
| A15, materi tipis | Ada bekal konsep setiap misi, jawaban numerik bersatuan, konversi massa/gaya, dan penjelasan asumsi. Bank latihan tetap 5 struktur + 3 hidraulika. |
| A16, keterbacaan | Tipografi baru, grafik khusus lebar ponsel, kontrol dekat objek, dan overflow horizontal diperbaiki. |
| A17, pemulihan | URL menyimpan jalur/misi; refresh dan Back bekerja pada rute internal. Reset progres meminta konfirmasi di dialog. Skip link mempertahankan jalur misi. |
| A18, konsistensi/renderer | Rumus dipisah ke model bersama. Scene statis dipertahankan; air memakai shader/instancing. Ada jeda, reduced motion, visibilitas scene, dan penanganan kehilangan konteks. Profil FPS/perangkat lemah belum diukur. |

## Workflow baru

1. Baca kasus dan buat prediksi.
2. Ubah variabel yang sedang diuji; variabel lain dijaga tetap.
3. Bandingkan scene, grafik, dan hasil hitung.
4. Simpan kondisi eksperimen. Catatan awal A dan hasil B/C tersedia untuk dibaca ulang.
5. Masukkan angka berdasarkan bukti dan pilih penjelasan yang sesuai.
6. Jawaban keliru mendapatkan feedback dan petunjuk; latihan belum dinyatakan selesai.
7. Setelah bukti dan penjelasan sesuai, progres/XP tersimpan. Latihan ulang membuat attempt baru.

Progres dan XP format sebelumnya dipertahankan melalui migrasi. Attempt lama dimulai lagi dalam format baru agar bukti eksperimen dan penilaian yang baru dapat digunakan. Status penyelesaian sebelumnya tetap menjadi riwayat, bukan hasil penilaian ulang otomatis.

## Status GitHub dan Vercel

Saat perubahan ini disiapkan, branch `main` di GitHub masih berada pada versi 2.5. Repo tidak mempunyai workflow di `.github/workflows/`. Project Vercel `beam-lab` juga melaporkan `link: null`, sehingga integrasi Git untuk deployment otomatis belum aktif. Karena itu, push ke GitHub sendiri tidak menjalankan pemeriksaan atau memperbarui deployment. Pengujian dan build yang dicatat di bawah dijalankan lokal.

## Pemeriksaan yang dilakukan

### Perhitungan otomatis

`npm test`: **11 pengujian lulus**, mencakup satuan SI, tumpuan, lendutan simetris, rasio P/E/I/L, posisi beban dan puncak analitis, resiprositas, Manning, n dua kali, pertambahan kedalaman, kondisi target seluruh misi, desain layak, angka desimal koma, urutan jawaban stabil, serta parameter simpan yang tidak valid.

`npm run build`: berhasil. Bundle renderer sekitar 613 KiB sebelum kompresi HTTP. Tidak memakai CDN saat menjalankan aplikasi.

### Browser

- Seluruh **5 misi jembatan dan 3 latihan debit** dimainkan sampai selesai pada origin lokal terpisah.
- Prediksi/refleksi salah dicoba: refleksi salah tetap berada pada fase penjelasan dan tidak menambah XP.
- Jawaban numerik dengan koma desimal berhasil.
- Profil I baja yang melampaui anggaran ditolak; baja + box diterima setelah dua rancangan dicatat.
- Latihan ulang jembatan dimainkan sampai selesai dan tidak menggandakan XP. Ulangi debit kembali ke prediksi tanpa jawaban lama.
- Kamera Penampang tetap aktif saat berpindah dari eksperimen ke penjelasan.
- Animasi truk mengunci penyimpanan sementara; grafik mengikuti posisi beban sebelum kembali ke kondisi tengah.
- Kondisi debit awal sesuai soal. Pada 1,2 → 1,5 m, Q berubah 7,09 → 9,59 m³/s. Pada n 0,015 → 0,030, Q berubah 5,51 → 2,76 m³/s.
- Lebar dokumen dan viewport diperiksa pada 390, 768, dan 1440 px; tidak ada overflow horizontal pada halaman yang diperiksa setelah perbaikan.
- Tangkapan desktop/tablet/ponsel ditinjau langsung. Perbaikan dari pemeriksaan mencakup headline tiga baris, panel ponsel melebar, grafik terlalu kecil, dinding menutup air, dan kamera penampang yang belum menampilkan rongga dengan jelas.
- Pembukaan `file://` untuk pengujian ditolak oleh kebijakan keamanan alat browser. Tidak mencoba jalan lain untuk melewati pembatasan itu. Validasi runtime menggunakan HTTP lokal.

### Penilaian visual internal

ROUND 1

- Fokus pertama: jembatan dan truk pada lingkungan 3D.
- Ide: lengkung balok menjadi bukti yang menghubungkan parameter dan grafik.
- Interaksi nyata: mengubah muatan dan menjalankan truk.
- Masalah yang ditemukan: kamera penampang terlalu dekat pada railing, dinding kanal menutup air, headline ponsel tiga baris.

ROUND 2

- Masalah tersebut diperbaiki dengan model penampang terpisah, potongan dinding transparan, dan pemenggalan headline.
- Masalah berikutnya: kolom ponsel melebar, angka grafik mengecil, kontrol desktop mendorong objek keluar viewport ketika difokuskan.
- Diperbaiki dengan batas grid, koordinat grafik ponsel, serta kontrol desktop yang ditempatkan sebelum instruksi eksperimen.

ROUND 3

- Penilaian internal yang disesuaikan untuk app: desain 7,5; kegunaan 7,5; kreativitas 7; isi 8; rata-rata berbobot 7,45/10. Ini penilaian subjektif pembuat, bukan skor resmi Taste Skill atau hasil uji mahasiswa.
- Keterbatasan: gaya maket 3D belum fotorealistis; formulir penjelasan dan beberapa kontrol tetap membutuhkan gulir pada layar pendek; variasi latihan transfer belum luas.
- Tidak menerapkan batas skor jumlah foto pada aplikasi. Tidak mengklaim hasil resmi inspector yang tidak dijalankan.

## Batas model

Jembatan adalah balok elastis linier ekuivalen, bukan model lengkap struktur jembatan. Animasi kendaraan memakai pendekatan kuasistatik, tanpa inersia, getaran kendaraan, atau distribusi gaya tiap roda. Bentuk profil menggunakan geometri ilustratif dengan nilai I preset.

Saluran memakai Manning untuk aliran seragam, bukan model turbulensi, gelombang dinamis, luapan, atau hujan-limpasan. Gerak air ditujukan untuk membaca hubungan konsep. Validasi kurikulum/dosen dan uji mahasiswa masih diperlukan.

## Menjalankan dan mengembangkan

Pratinjau selama pengembangan: `http://localhost:8765/v3.0/index.html`.

```sh
npm install
npm run build
npm run dev
```

Model, materi, dan aplikasi utama berupa skrip lokal. Saat mengubah renderer Three.js, bangun ulang bundle dengan `npm run build`. Bundle disertakan agar distribusi hasil tidak mengambil pustaka dari CDN.

Tangkapan layar untuk review lokal tersimpan di `artifacts/beam-lab-v3/` dan tidak disertakan dalam repo karena berasal dari sesi uji. Sumber utama: [model](v3.0/model.js), [materi](v3.0/lessons.js), [aplikasi](v3.0/app.js), dan [renderer](v3.0/scene3d.js).

Angka XP pada tangkapan berasal dari sesi uji lokal delapan latihan, bukan data kelas atau mahasiswa nyata.

Graphify yang dibuat saat audit merupakan snapshot sebelum redesign. Penanda `.needs_update` ditambahkan agar peta tersebut tidak dianggap menggambarkan struktur kode yang baru.
