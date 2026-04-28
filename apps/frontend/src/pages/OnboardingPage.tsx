import { Link } from "react-router-dom";

export default function OnboardingPage() {
  return (
    <div
      id="onboarding-page"
      className="min-h-svh w-full flex items-center justify-center p-6 bg-linear-to-b from-[#003B6D] to-[#0072B5]"
    >
      {/* Central Card */}
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-[32px] p-8 md:p-16 flex flex-col items-center text-center shadow-2xl">
        
        {/* Logo Section */}
        <div className="mb-8">
          <img 
            src="/WAIMark.png" 
            alt="WAI Logo" 
            className="h-32 md:h-48 w-auto object-contain"
          />
          <h2 className="text-white text-xl md:text-2xl font-medium tracking-wide mt-2">
            Water Awareness & Information
          </h2>
        </div>

        {/* Description */}
        <p className="text-white/90 text-base md:text-lg max-w-2xl leading-relaxed mb-12">
          Pantau kondisi banjir secara real-time, laporkan kejadian banjir 
          di sekitar Anda, dan bantu pemerintah Kota Bandar Lampung 
          dalam penanganan bencana secara cepat dan akurat.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link
            to="/map"
            className="w-full bg-white text-[#005a9e] font-bold py-3.5 rounded-lg hover:bg-white/90 transition-all text-center text-lg shadow-lg"
          >
            Mulai Menggunakan
          </Link>
          
          <div className="flex flex-col items-center gap-2 mt-2">
            <Link
              to="/login"
              className="w-full py-3 rounded-lg border-2 border-white/30 bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-center text-lg shadow-inner"
            >
              Login
            </Link>
            <span className="text-white/60 text-xs font-medium">
              login sebagai admin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

