import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login logic
    if (username && password) {
      onLogin();
    } else {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex flex-col items-center">
          <h1 className="text-6xl font-logo text-emerald-700 drop-shadow-sm mb-2">esila</h1>
          <p className="text-emerald-600 font-medium tracking-wide text-sm">TİCARİ YÖNETİM SİSTEMİ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
             <h2 className="text-2xl font-bold text-gray-800">Giriş Yap</h2>
             <p className="text-gray-500 text-sm">Devam etmek için hesabınıza giriş yapın.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Giriş Yap</span>
            <ArrowRight size={20} />
          </button>
          
          <div className="text-center">
            <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Şifremi Unuttum?</a>
          </div>
        </form>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
          &copy; 2024 Esila Yazılım. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
};