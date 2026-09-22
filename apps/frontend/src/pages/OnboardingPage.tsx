import { Link } from "react-router-dom";
import FloodHero from "../assets/flood-hero.png";
import { useState, useEffect, useRef } from "react";

const ArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry!.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function OnboardingPage() {
  const { ref: panduanRef, visible: panduanVisible } = useReveal();
  const { ref: aboutRef, visible: aboutVisible } = useReveal();

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="homepage" className="min-h-svh w-full bg-white overflow-x-hidden">

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-fade-in-down ${
        scrolled || mobileMenuOpen
          ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/5"
          : "bg-transparent"
      }`}>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#homepage" className="flex items-center gap-3 group">
              <img
                src="/RIF Logo Blue.png"
                alt="RIF Logo"
                className={`h-8 md:h-10 w-auto object-contain transition-all duration-300 ${
                  scrolled || mobileMenuOpen ? "opacity-100" : "brightness-0 invert opacity-90 group-hover:opacity-100"
                }`}
              />
            </a>

            <div className="hidden sm:flex items-center gap-6 md:gap-8">
              <a href="#panduan" className={`text-sm font-medium transition-colors ${
                scrolled ? "text-slate-600 hover:text-[#005a9e]" : "text-white/80 hover:text-white"
              }`}>
                Panduan
              </a>
              <a href="#tentang" className={`text-sm font-medium transition-colors ${
                scrolled ? "text-slate-600 hover:text-[#005a9e]" : "text-white/80 hover:text-white"
              }`}>
                Tentang Kami
              </a>
              <Link
                to="/login"
                className={`text-xs md:text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                  scrolled
                    ? "text-white bg-[#005a9e] hover:bg-[#004a8a] shadow-lg shadow-[#005a9e]/20"
                    : "text-[#005a9e] bg-white hover:bg-white/90 shadow-lg shadow-black/10"
                }`}
              >
                Login Admin
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`sm:hidden p-2 rounded-xl transition-all ${
                scrolled || mobileMenuOpen ? "text-[#005a9e] hover:bg-gray-100" : "text-white hover:bg-white/10"
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>

        <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="px-5 pb-5 pt-2 flex flex-col gap-2 border-t border-gray-100">
            <a 
              href="#panduan" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-[#005a9e] py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-all"
            >
              Panduan
            </a>
            <a 
              href="#tentang" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-[#005a9e] py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-all"
            >
              Tentang Kami
            </a>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-white bg-[#005a9e] hover:bg-[#004a8a] py-2.5 px-4 rounded-xl transition-all text-center shadow-md shadow-[#005a9e]/20"
            >
              Login Admin
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-svh flex items-center justify-center bg-linear-to-b from-[#001d3d] via-[#003566] to-[#005a9e]">
        <div className="absolute bottom-0 left-0 right-0 translate-y-px">
          <svg viewBox="0 0 1440 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0,160 C480,0 960,0 1440,160 L1440,160 L0,160 Z" fill="white"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 text-center pt-24 pb-32 md:pb-40">
          <div className="animate-fade-in-up">
            <img
              src="/WAIMark.png"
              alt="WAI Logo"
              className="h-28 md:h-44 lg:h-52 w-auto object-contain mx-auto mb-4"
            />
            <p className="text-white/60 text-sm md:text-base font-medium tracking-[0.25em] uppercase mb-8">
              Water Awareness & Information
            </p>
          </div>

          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.15s" }}
          >
            Pantau.{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-sky-300 to-cyan-200">
            Laporkan.
            </span>{" "}
          </h1>

          <p
            className="text-white/80 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            Pantau kondisi banjir, laporkan kejadian banjir di sekitar Anda, dan bantu dalam pendataan bencana banjir secara cepat dan akurat.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
            style={{ animationDelay: "0.45s" }}
          >
            <Link
              to="/map"
              className="group flex items-center gap-2 bg-white text-[#005a9e] font-bold px-8 py-4 rounded-full text-base md:text-lg shadow-xl shadow-black/15 hover:shadow-2xl hover:scale-[1.03] transition-all"
            >
              Mulai Menggunakan
              <span className="inline-block group-hover:translate-x-1 transition-transform">
                <ArrowRight />
              </span>
            </Link>
          </div>

        </div>
      </section>

      <section id="panduan" className="py-20 md:py-32 bg-white">
        <div
          ref={panduanRef}
          className={`max-w-5xl mx-auto px-5 md:px-8 transition-all duration-700 ${
            panduanVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center mb-16">
            <span className="inline-block text-[#005a9e] font-semibold text-sm tracking-wider uppercase bg-[#005a9e]/10 px-4 py-1.5 rounded-full mb-4">
              Panduan Penggunaan
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Pantau & Laporkan
            </h2>
          </div>

          <div className="mb-16 mx-auto max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shadow-[#005a9e]/20 border border-slate-200 group relative">
            <video 
              src="/WAI%20Vid.mp4" 
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              preload="auto"
              className="w-full h-auto aspect-video object-cover pointer-events-none"
              poster={FloodHero}
            >
              Maaf, browser Anda tidak mendukung pemutaran video.
            </video>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {[
              {
                number: "01",
                title: "Buka Peta Banjir",
                description: "Akses peta interaktif langsung dari browser tanpa perlu menginstal aplikasi."
              },
              {
                number: "02",
                title: "Laporkan Kejadian",
                description: "Isi form singkat, lampirkan foto, dan sistem otomatis membaca lokasi GPS Anda."
              },
              {
                number: "03",
                title: "Verifikasi Admin",
                description: "Tim admin memvalidasi laporan. Hanya laporan terverifikasi yang ditampilkan di peta."
              }
            ].map((step, i, arr) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-linear-to-r from-[#005a9e]/30 to-[#005a9e]/10" />
                )}

                <div className="relative z-10 w-20 h-20 rounded-2xl bg-linear-to-br from-[#005a9e] to-[#003B6D] text-white flex items-center justify-center text-2xl font-extrabold mb-6 shadow-lg shadow-[#005a9e]/25 group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <section id="tentang" className="py-20 md:py-32 bg-white">
        <div
          ref={aboutRef}
          className={`max-w-5xl mx-auto px-5 md:px-8 transition-all duration-700 ${
            aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="bg-linear-to-br from-[#001d3d] via-[#003566] to-[#005a9e] rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-[#005a9e]/20">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <img
                src="/RIF Logo.png"
                alt="Research In Flood"
                className="h-16 md:h-24 w-auto object-contain mx-auto mb-6 opacity-90"
              />

              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Tentang Kami
              </h2>
              <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-3">
                <strong className="text-white">WAI (Water Awareness & Information)</strong> adalah platform WebGIS pelaporan dan monitoring banjir
                yang dikembangkan oleh Tim <strong className="text-white">Research in Flood (RIF) ITERA</strong>.
              </p>
              <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Pantau kondisi banjir, laporkan kejadian banjir di sekitar Anda, dan bantu dalam pendataan bencana secara cepat dan akurat.
              </p>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-white/90 text-sm md:text-base">
                <a href="mailto:rif@itera.ac.id" className="flex items-center gap-2.5 group hover:text-white transition-colors">
                  <div className="p-2 rounded-full bg-white/10 group-hover:bg-sky-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-300"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <span className="font-medium tracking-wide">rif@itera.ac.id</span>
                </a>
                <a href="tel:+6281234567890" className="flex items-center gap-2.5 group hover:text-white transition-colors">
                  <div className="p-2 rounded-full bg-white/10 group-hover:bg-sky-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-300"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <span className="font-medium tracking-wide">+62 812-3456-7890</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white/60 py-8">
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/RIF Logo.png"
              alt="RIF"
              className="h-7 w-auto object-contain opacity-60"
            />
            <span className="text-sm">© {new Date().getFullYear()} Tim RIF ITERA. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#panduan" className="hover:text-white transition-colors">Panduan</a>
            <a href="#tentang" className="hover:text-white transition-colors">Tentang Kami</a>
            <Link to="/login" className="hover:text-white transition-colors">Login Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
