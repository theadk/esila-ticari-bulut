import React, { useState } from 'react';
import { Lock, User, ArrowRight, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../lib/store';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const store = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'login' | 'forgot_password' | 'email_sent'>('login');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    const { users } = store;
    // For simplicity, doing a loose check on username & password
    const user = users.find(u => 
      (u.username === username || u.email === username) && 
      u.passwordHash === password
    );

    if (user) {
      if (user.status === 'Pasif') {
        setError('Hesabınız pasif durumdadır. Yöneticinize başvurun.');
      } else {
        onLogin();
      }
    } else {
      setError('Kullanıcı adı veya şifre hatalı.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetEmail) {
      setError('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    const user = store.users.find(u => u.email === resetEmail);
    if (!user) {
      setError('Bu e-posta adresi sistemde kayıtlı değil.');
      return;
    }

    if (user.status === 'Pasif') {
      setError('Hesabınız pasif durumdadır. Yöneticinize başvurun.');
      return;
    }

    // Mock sending email
    setView('email_sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-900 p-4">
      <div className="bg-white w-full max-w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 bg-emerald-50 border-b border-emerald-100 flex flex-col items-center">
          <h1 className="text-6xl font-logo text-emerald-700 drop-shadow-sm mb-2">esila</h1>
          <p className="text-emerald-600 font-medium tracking-wide text-sm">TİCARİ YÖNETİM SİSTEMİ</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="p-4 md:p-8 space-y-6 animate-fade-in">
            <div className="space-y-1">
               <h2 className="text-2xl font-bold text-gray-800">Giriş Yap</h2>
               <p className="text-gray-500 text-sm">Devam etmek için hesabınıza giriş yapın.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Kullanıcı Adı veya E-Posta</label>
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
              <button 
                type="button"
                onClick={() => { setView('forgot_password'); setError(''); }} 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Şifremi Unuttum?
              </button>
            </div>
          </form>
        )}

        {view === 'forgot_password' && (
           <form onSubmit={handleForgotPassword} className="p-4 md:p-8 space-y-6 animate-fade-in">
             <div className="space-y-1">
               <h2 className="text-2xl font-bold text-gray-800">Şifre Sıfırlama</h2>
               <p className="text-gray-500 text-sm">Kayıtlı e-posta adresinizi giriniz. Size bir sıfırlama bağlantısı göndereceğiz.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="isim@firma.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Sıfırlama Bağlantısı Gönder</span>
              <ArrowRight size={20} />
            </button>
            
            <div className="text-center">
              <button 
                type="button"
                onClick={() => { setView('login'); setError(''); }} 
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 w-full"
              >
                <ArrowLeft size={16} />
                <span>Giriş Ekranına Dön</span>
              </button>
            </div>
           </form>
        )}

        {view === 'email_sent' && (
          <div className="p-4 md:p-8 space-y-6 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">E-Posta Gönderildi</h2>
            <p className="text-gray-600 text-sm">
              <strong className="text-gray-800">{resetEmail}</strong> adresine şifre sıfırlama talimatlarını içeren bir e-posta gönderdik. Lütfen gelen kutunuzu (ve spam/gereksiz klasörünü) kontrol edin.
            </p>

            <button 
              type="button"
              onClick={() => { setView('login'); setError(''); setResetEmail(''); }} 
              className="w-full mt-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all"
            >
              Giriş Ekranına Dön
            </button>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
          &copy; 2024 Esila Yazılım. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
};