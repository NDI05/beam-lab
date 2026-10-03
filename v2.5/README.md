# Beam Lab 2.5

Versi ini mempertahankan lab jembatan 2D, lalu menambahkan jalur debit air, animasi aliran, grafik Manning, dan tiga soal bertahap. Gunakan menu **Versi** untuk membuka versi 1.0 atau 2.0.

## Menjalankan

Buka `v2.5/index.html` di browser. Gunakan menu **Versi** untuk beralih ke 1.0 atau 2.0. Progres V2.5 tersimpan terpisah di browser.

## Model simulasi

Truk dimodelkan sebagai beban titik di tengah bentang balok sederhana. Massa kendaraan dalam ton dikonversi menjadi gaya menggunakan gravitasi. Untuk setengah kiri bentang:

```text
δ(x) = P x (3L² − 4x²) / (48EI),  0 ≤ x ≤ L/2
δmaks = PL³ / (48EI)
```

Setengah kanan kurva merupakan pantulan terhadap titik tengah. Material dan profil di V2 memakai nilai contoh untuk menunjukkan perubahan kekakuan, bukan data produk tertentu. Baja memakai E 200 GPa sebagai preset; spesifikasi AISC menyebut 29.000 ksi (200.000 MPa) untuk baja karbon. Modulus beton bergantung pada kuat tekan, berat jenis, dan agregat, sehingga E 30 GPa di sini hanya nilai latihan. Kayu memakai E 12 GPa sebagai nilai contoh; sifat kayu berubah menurut spesies dan kadar air.

Nilai I profil, kredit anggaran, dan target lendutan juga merupakan parameter latihan. Adegan memperbesar deformasi agar terlihat; grafik dan angka tetap berasal dari perhitungan, tetapi keseluruhan prototipe bukan alat desain atau pemeriksaan keselamatan jembatan.

## Jalur Hidraulika

Jalur kedua memperkenalkan debit aliran seragam pada saluran terbuka berbentuk persegi panjang. Mahasiswa dapat mengubah lebar dasar `b`, kedalaman `y`, kemiringan `S`, dan koefisien kekasaran Manning `n`. Adegan penampang air dan grafik `Q` terhadap `y` ikut berubah. Tiga soal latihan membahas luas basah, dampak kedalaman, dan dampak kekasaran; jawaban benar memberi XP dan tersimpan di browser.

Model SI yang dipakai:

```text
Q = (1/n) A R^(2/3) S^(1/2)
A = b y
P = b + 2y
R = A/P
```

Asumsinya aliran seragam, penampang konstan, dan kemiringan garis energi sama dengan kemiringan dasar. Koefisien kekasaran yang disediakan adalah preset latihan, bukan nilai desain untuk lokasi tertentu. Penggunaan Manning untuk aliran seragam serta definisi `R = A/P` dijelaskan dalam [FHWA, Hydraulics of Bridge Waterways](https://www.fhwa.dot.gov/engineering/hydraulics/pubs/hds4.pdf). Prototipe ini tidak menghitung profil muka air berubah, aliran tak seragam, banjir, atau kapasitas desain drainase.

## Referensi properti material

- [ANSI/AISC N690-12 — modulus elastisitas baja](https://www.aisc.org/globalassets/specification-for--safety-related-steel-structures-for-nuclear-facilities-including-supplement-no.-1.pdf)
- [FHWA — hubungan modulus elastisitas dan kuat tekan beton](https://www.fhwa.dot.gov/publications/research/infrastructure/structures/06103/chapt4.cfm)
- [USDA Forest Service — Wood Handbook, mechanical properties of wood](https://research.fs.usda.gov/treesearch/62244)
