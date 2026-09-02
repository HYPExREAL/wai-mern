import axios from "axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import FloodHero from "../assets/flood-hero.png";
import apiClient from "../api/apiClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Mohon isi email dan password Anda.");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", { email, password });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isAdmin", "true");
      
      navigate("/admin/dashboard");
    } catch (err) {
      let message = "Gagal masuk. Periksa kembali email dan password Anda.";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-linear-to-b from-[#003B6D] to-[#0072B5]">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="w-full max-w-5xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] animate-scale-in">
        
        <div className="hidden md:block w-1/2 relative bg-[#E6F3FF]">
          <img 
            src={FloodHero} 
            alt="Flood Illustration" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center">
          <div className="text-center mb-10 w-full flex flex-col items-center">
            <img 
              src="/WAIBlue.png" 
              alt="WAI Logo" 
              className="h-28 w-auto object-contain"
            />
            <h2 className="text-[#005a9e] text-lg font-medium tracking-wide">
              Water Awareness & Information
            </h2>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[#005a9e] text-sm font-bold pl-1 block uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-[#005a9e]/20 rounded-xl text-[#003B6D] placeholder:text-[#003B6D]/30 focus:outline-none focus:ring-2 focus:ring-[#005a9e]/20 focus:border-[#005a9e] transition-all text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#005a9e] text-sm font-bold pl-1 block uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-[#005a9e]/20 rounded-xl text-[#003B6D] placeholder:text-[#003B6D]/30 focus:outline-none focus:ring-2 focus:ring-[#005a9e]/20 focus:border-[#005a9e] transition-all text-sm shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full mt-4 flex items-center justify-center gap-3 py-4 bg-linear-to-r from-[#002b4e] to-[#0074c1] hover:from-[#001f38] hover:to-[#005a9e] text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-xl group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Masuk Ke Dashboard</span>
                  <div className="bg-white rounded-md p-1">
                    <ArrowRight className="w-5 h-5 text-[#005a9e] transition-transform group-hover:translate-x-1" />
                  </div>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] text-[#005a9e]/60 font-medium">
            <p>Hanya untuk petugas berwenang Pemerintah Kota Bandar Lampung.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

