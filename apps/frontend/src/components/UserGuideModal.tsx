import { useState } from "react";
import {
  X,
  Navigation,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartManualPick?: () => void;
}

export default function UserGuideModal({
  isOpen,
  onClose,
  onStartManualPick,
}: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "gps" | "wilayah">("manual");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl md:rounded-[32px] shadow-2xl border border-white/50 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/80 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#005a9e] text-white flex items-center justify-center shadow-lg shadow-[#005a9e]/20 shrink-0">
              <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-[#003B6D] leading-tight">
                Panduan Penggunaan untuk Warga
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Cara menentukan titik banjir & pengelolaan izin lokasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all active:scale-95"
            title="Tutup Panduan"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-4 pt-2.5 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("manual")}
            className={`cursor-pointer px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "manual"
                ? "border-[#005a9e] text-[#005a9e] bg-white shadow-sm font-black"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <MousePointerClick className="w-4 h-4" />
            <span>Pilih Titik Manual</span>
          </button>
          <button
            onClick={() => setActiveTab("gps")}
            className={`cursor-pointer px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "gps"
                ? "border-[#005a9e] text-[#005a9e] bg-white shadow-sm font-black"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Izin GPS Otomatis</span>
          </button>
          <button
            onClick={() => setActiveTab("wilayah")}
            className={`cursor-pointer px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "wilayah"
                ? "border-[#005a9e] text-[#005a9e] bg-white shadow-sm font-black"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Area Pelaporan</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs md:text-sm text-gray-600">
          {activeTab === "manual" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-[#003B6D]">
                <strong className="block text-xs uppercase tracking-wider font-black mb-1">
                  💡 Tidak perlu khawatir jika GPS mati atau ditolak!
                </strong>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Warga tetap dapat melaporkan kejadian banjir secara akurat cukup dengan mengetuk lokasi di peta atau mencari nama jalan tanpa membutuhkan akses GPS perangkat.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-[#005a9e] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm shadow-[#005a9e]/20 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-[#003B6D] text-xs md:text-sm">
                      Cara 1: Ketuk Langsung di Peta
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Geser peta ke daerah kejadian, lalu <strong>klik atau sentuh titik jalan/daerah banjir</strong> langsung pada peta. Pin lokasi akan langsung terpasang dan formulir laporan akan terbuka.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-[#005a9e] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm shadow-[#005a9e]/20 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-[#003B6D] text-xs md:text-sm">
                      Cara 2: Ketik Alamat di Kolom Pencarian
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Ketik nama jalan, kelurahan, atau patokan tempat (misal: <em>Jl. ZA Pagar Alam</em> atau <em>Way Kandis</em>) di kolom pencarian, lalu pilih lokasi yang sesuai dari daftar saran.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-[#005a9e] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm shadow-[#005a9e]/20 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-[#003B6D] text-xs md:text-sm">
                      Menggeser atau Mengubah Titik
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Jika titik kurang tepat, Anda cukup mengetuk titik baru di peta kapan saja, atau klik pin manual lalu tekan tombol <strong>"Hapus Pin"</strong> untuk mengulang.
                    </p>
                  </div>
                </div>
              </div>

              {onStartManualPick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartManualPick();
                  }}
                  className="cursor-pointer w-full py-3 px-4 bg-[#005a9e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#004a82] transition-all shadow-lg shadow-[#005a9e]/20 text-xs md:text-sm active:scale-[0.98] mt-2"
                >
                  <MousePointerClick className="w-4 h-4" />
                  Coba Tandai Titik di Peta Sekarang
                </button>
              )}
            </div>
          )}

          {activeTab === "gps" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-amber-900">
                <strong className="block text-xs uppercase tracking-wider font-black mb-1">
                  📡 Cara Kerja Izin Lokasi Perangkat
                </strong>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Peta interaktif WAI menggunakan standar peramban (Browser Geolocation API) untuk mendeteksi koordinat satelit GPS perangkat Anda secara otomatis bila Anda mengizinkannya.
                </p>
              </div>

              <div className="space-y-3">
                <div className="border border-gray-100 rounded-2xl p-3.5 bg-gray-50/70">
                  <span className="font-bold text-[#003B6D] text-xs md:text-sm block mb-1">
                    1. Mengapa Muncul Notifikasi Izin (Pop-up)?
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Browser (Chrome, Safari, Edge) memiliki sistem keamanan ketat untuk melindungi privasi Anda. Pop-up bertuliskan{" "}
                    <em>"wai-flood ingin mengakses lokasi Anda"</em> adalah konfirmasi resmi. Memilih <strong>"Izinkan" (Allow)</strong> mempermudah Anda karena lokasi otomatis terdeteksi tanpa mencari di peta.
                  </p>
                </div>

                <div className="border border-gray-100 rounded-2xl p-3.5 bg-gray-50/70">
                  <span className="font-bold text-[#003B6D] text-xs md:text-sm block mb-1">
                    2. Apa yang Terjadi Jika Memilih "Blokir / Tolak"?
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Jika ditolak, sistem tidak dapat membaca GPS otomatis Anda. Namun, <strong>aplikasi tetap 100% dapat digunakan</strong> dengan menandai lokasi secara manual di peta.
                  </p>
                </div>

                <div className="border border-gray-100 rounded-2xl p-3.5 bg-gray-50/70">
                  <span className="font-bold text-[#003B6D] text-xs md:text-sm block mb-1">
                    3. Cara Mengaktifkan Kembali Izin GPS (Jika Ingin)
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Klik ikon gembok 🔒 atau ikon setelan di sebelah kiri kolom alamat web browser Anda ➔ Pilih <strong>Izin Lokasi (Location)</strong> ➔ Ubah menjadi <strong>"Izinkan" (Allow)</strong> ➔ Muat ulang halaman.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wilayah" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-emerald-900">
                <strong className="block text-xs uppercase tracking-wider font-black mb-1">
                  🛡️ Penguncian Lokus Wilayah (Geofencing)
                </strong>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Untuk menjaga validitas data dan mencegah laporan spam dari luar daerah, sistem mengunci lokus pelaporan khusus pada wilayah operasional resmi.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#003B6D] block font-bold text-xs md:text-sm">
                      Kota Bandar Lampung (Seluruh 20 Kecamatan)
                    </strong>
                    <span className="text-gray-500 text-[11px] leading-relaxed block mt-0.5">
                      Rajabasa, Tanjung Karang, Sukarame, Way Halim, Kedaton, Panjang, Teluk Betung, Kemiling, Bumi Waras, Labuhan Ratu, dsb.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#003B6D] block font-bold text-xs md:text-sm">
                      Kawasan Kampus ITERA & Sekitarnya (Lampung Selatan)
                    </strong>
                    <span className="text-gray-500 text-[11px] leading-relaxed block mt-0.5">
                      Kampus Institut Teknologi Sumatera, Way Huwi, Sabah Balau, kawasan kos Belwis, dan koridor Terusan Ryacudu.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50/70 border border-red-100 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-xs md:text-sm">
                      Wilayah di Luar Cakupan (Ditolak Otomatis)
                    </strong>
                    <span className="text-red-600/90 text-[11px] leading-relaxed block mt-0.5">
                      Koordinat di luar lokus (seperti Kotabumi, Kota Metro, Kalianda, dll.) akan otomatis ditolak oleh sistem untuk mencegah spam.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 md:p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 pl-2 font-medium">
            WAI Flood Management System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#003B6D] rounded-xl font-bold text-xs transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
