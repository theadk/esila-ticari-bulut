import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';

export const SuperAdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'superadmin' && password === 'esila2026') {
      onLogin();
    } else {
      setError('Hatalı kullanıcı adı veya şifre.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 bg-gray-800 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-white mb-2">Süper Admin</h1>
          <p className="text-gray-400 text-sm">Tenant & Lisans Yönetimi</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="text-sm font-medium text-gray-700">Kullanıcı Adı</label>
            <div className="relative mt-1">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Şifre</label>
            <div className="relative mt-1">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl" />
            </div>
          </div>

          <button type="submit" className="w-full bg-gray-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            <span>Giriş Yap</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
