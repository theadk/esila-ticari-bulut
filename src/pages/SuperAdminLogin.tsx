import { safeLocalStorage } from '../../lib/storage';
import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';

export const SuperAdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Rate limiting states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  useEffect(() => {
    const attempts = safeLocalStorage.getItem('esila_sa_attempts');
    const lockout = safeLocalStorage.getItem('esila_sa_lockout');
    if (attempts) setFailedAttempts(parseInt(attempts, 10));
    if (lockout) setLockoutUntil(parseInt(lockout, 10));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setError(`Çok fazla hatalı giriş yaptınız. Lütfen ${remaining} dakika bekleyin.`);
      return;
    } else if (lockoutUntil && Date.now() >= lockoutUntil) {
      // Lockout expired
      setLockoutUntil(null);
      setFailedAttempts(0);
      safeLocalStorage.removeItem('esila_sa_lockout');
      safeLocalStorage.removeItem('esila_sa_attempts');
    }

    if (username === 'superadmin' && password === 'Esila2026*') {
      setFailedAttempts(0);
      setLockoutUntil(null);
      safeLocalStorage.removeItem('esila_sa_lockout');
      safeLocalStorage.removeItem('esila_sa_attempts');
      onLogin();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      safeLocalStorage.setItem('esila_sa_attempts', newAttempts.toString());
      
      if (newAttempts >= 5) {
        const until = Date.now() + 5 * 60 * 1000;
        setLockoutUntil(until);
        safeLocalStorage.setItem('esila_sa_lockout', until.toString());
        setError('Çok fazla hatalı giriş yaptınız. Hesabınız 5 dakika kilitlendi.');
      } else {
        setError('Hatalı kullanıcı adı veya şifre.');
      }
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
