import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowLeft, Loader2, LogIn, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Mohon isi email dan password Anda.");
      return;
    }
    
    setError(null);
    setLoading(true);

    // Simulate network request for login
    setTimeout(() => {
      setLoading(false);
      // Simulate successful login and redirect
      navigate("/admin/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-svh flex items-center justify-center p-4 bg-linear-to-br from-flood-950 via-flood-900 to-flood-800 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-flood-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Back button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-flood-300 hover:text-white transition-colors text-sm font-medium z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40 relative z-10">
        
        {/* Header & Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-tr from-flood-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Verification Portal</h1>
          <p className="text-sm text-flood-200">Flood Monitoring Lampung</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email / Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-flood-100 pl-1 block">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-flood-300 pointer-events-none" />
              <input
                type="text"
                placeholder="admin@lampung.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-flood-400/50 focus:outline-none focus:ring-2 focus:ring-flood-400/50 focus:border-flood-400/50 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-flood-100 pl-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-flood-300 pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-flood-400/50 focus:outline-none focus:ring-2 focus:ring-flood-400/50 focus:border-flood-400/50 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 bg-linear-to-r from-flood-500 to-cyan-500 hover:from-flood-400 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-flood-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-flood-300">
          <p>Hanya untuk petugas berwenang Pemerintah Kota Bandar Lampung.</p>
        </div>
      </div>
    </div>
  );
}
