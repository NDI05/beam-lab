# Beam Lab 2.0 — pratinjau

Pratinjau ini menambahkan adegan jembatan 2D dengan aset SVG buatan proyek. Beban truk, pilihan material, dan profil memengaruhi bentuk gelagar; grafik di bawah adegan memakai parameter dan rumus yang sama.

## Menjalankan

Buka `v2/index.html` di browser. Progres V2 disimpan terpisah dari V1 di penyimpanan lokal browser.

## Model simulasi

Truk dimodelkan sebagai beban titik di tengah bentang balok sederhana. Massa kendaraan dalam ton dikonversi menjadi gaya menggunakan gravitasi. Untuk setengah kiri bentang:

```text
δ(x) = P x (3L² − 4x²) / (48EI),  0 ≤ x ≤ L/2
δmaks = PL³ / (48EI)
```

Setengah kanan kurva merupakan pantulan terhadap titik tengah. Material dan profil di V2 memakai nilai contoh untuk menunjukkan perubahan kekakuan, bukan data produk tertentu. Baja memakai E 200 GPa sebagai preset; spesifikasi AISC menyebut 29.000 ksi (200.000 MPa) untuk baja karbon. Modulus beton bergantung pada kuat tekan, berat jenis, dan agregat, sehingga E 30 GPa di sini hanya nilai latihan. Kayu memakai E 12 GPa sebagai nilai contoh; sifat kayu berubah menurut spesies dan kadar air.

Nilai I profil, kredit anggaran, dan target lendutan juga merupakan parameter latihan. Adegan memperbesar deformasi agar terlihat; grafik dan angka tetap berasal dari perhitungan, tetapi keseluruhan prototipe bukan alat desain atau pemeriksaan keselamatan jembatan.

## Referensi properti material

- [ANSI/AISC N690-12 — modulus elastisitas baja](https://www.aisc.org/globalassets/specification-for--safety-related-steel-structures-for-nuclear-facilities-including-supplement-no.-1.pdf)
- [FHWA — hubungan modulus elastisitas dan kuat tekan beton](https://www.fhwa.dot.gov/publications/research/infrastructure/structures/06103/chapt4.cfm)
- [USDA Forest Service — Wood Handbook, mechanical properties of wood](https://research.fs.usda.gov/treesearch/62244)
