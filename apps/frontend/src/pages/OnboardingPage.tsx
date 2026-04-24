import { Link } from "react-router-dom";
import { MapPin, Shield, BarChart3, ArrowRight, Droplets } from "lucide-react";
import heroImg from "../assets/flood-hero.png";

export default function OnboardingPage() {
  return (
    <div
      id="onboarding-page"
      className="relative min-h-svh flex flex-col overflow-hidden bg-linear-to-b from-flood-950 via-flood-900 to-flood-800"
    >
      {/* Animated rain effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-linear-to-b from-transparent via-flood-300/30 to-transparent animate-[rain_linear_infinite]"
            style={{
              // eslint-disable-next-line react-hooks/purity
              left: `${Math.random() * 100}%`,
              // eslint-disable-next-line react-hooks/purity
              height: `${30 + Math.random() * 60}px`,
              // eslint-disable-next-line react-hooks/purity
              animationDuration: `${0.6 + Math.random() * 0.8}s`,
              // eslint-disable-next-line react-hooks/purity
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Water wave at bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          className="w-full h-20 md:h-28"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C360,100 720,0 1080,60 C1260,90 1380,40 1440,50 L1440,120 L0,120 Z"
            className="fill-flood-600/20 animate-[wave_6s_ease-in-out_infinite]"
          />
          <path
            d="M0,60 C280,10 560,90 840,40 C1120,0 1320,70 1440,40 L1440,120 L0,120 Z"
            className="fill-flood-500/15 animate-[wave_8s_ease-in-out_infinite_reverse]"
          />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 md:py-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-flood-500/20 backdrop-blur-sm border border-flood-400/20">
            <Droplets className="w-5 h-5 text-flood-300" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            FloodWatch
          </span>
        </div>
        <Link
          to="/login"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-flood-200 rounded-lg hover:bg-white/10 transition-colors duration-200 backdrop-blur-sm border border-transparent hover:border-flood-400/20"
        >
          <Shield className="w-4 h-4" />
          Admin Login
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 md:px-12 py-12 md:py-16">
        {/* Left — Copy */}
        <div className="max-w-xl text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-flood-500/15 border border-flood-400/25 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-xs font-medium text-flood-200 tracking-wide uppercase">
              Sistem Aktif — Bandar Lampung
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
            Dashboard{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-flood-300 to-cyan-300">
              Web-GIS
            </span>{" "}
            Pelaporan Banjir
          </h1>

          <p className="text-base md:text-lg text-flood-200/80 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Pantau kondisi banjir secara real-time, laporkan kejadian banjir di
            sekitar Anda, dan bantu pemerintah Kota Bandar Lampung dalam
            penanganan bencana secara cepat dan akurat.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
            <Link
              to="/map"
              className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-linear-to-r from-flood-500 to-flood-600 text-white font-semibold text-base shadow-lg shadow-flood-600/30 hover:shadow-flood-500/40 hover:from-flood-400 hover:to-flood-500 transition-all duration-300 hover:-translate-y-0.5"
            >
              <MapPin className="w-5 h-5" />
              Mulai Lapor / Lihat Peta
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="px-5 py-3.5 text-sm font-medium text-flood-300 rounded-xl border border-flood-400/25 hover:bg-white/5 transition-colors duration-200"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>

        {/* Right — Hero illustration */}
        <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl shrink-0">
          <div className="absolute -inset-8 rounded-full bg-flood-500/10 blur-3xl animate-pulse" />
          <img
            src={heroImg}
            alt="Ilustrasi banjir kota Bandar Lampung"
            className="relative w-full h-auto drop-shadow-2xl rounded-2xl"
          />
        </div>
      </main>

      {/* Feature cards */}
      <section
        id="features"
        className="relative z-10 px-6 md:px-12 pb-16 md:pb-24"
      >
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            {
              icon: MapPin,
              title: "Peta Interaktif",
              desc: "Lihat sebaran titik banjir di seluruh wilayah Bandar Lampung secara real-time.",
            },
            {
              icon: BarChart3,
              title: "Laporan Warga",
              desc: "Kirim laporan banjir langsung dari lokasi Anda dengan foto dan koordinat GPS.",
            },
            {
              icon: Shield,
              title: "Verifikasi Admin",
              desc: "Setiap laporan diverifikasi oleh tim admin sebelum ditampilkan di peta publik.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-5 rounded-2xl bg-white/4 border border-white/8 backdrop-blur-sm hover:bg-white/8 hover:border-flood-400/25 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-flood-500/15 mb-3 group-hover:bg-flood-500/25 transition-colors">
                <Icon className="w-5 h-5 text-flood-300" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-flood-200/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Keyframes injected via style tag — Tailwind v4 doesn't need a config file */}
      <style>{`
        @keyframes rain {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100svh); opacity: 0; }
        }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
