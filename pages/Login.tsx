import React, { useState } from 'react';
import { Lock, User, ArrowRight, Mail, ArrowLeft, CheckCircle2, Phone, Building, MapPin } from 'lucide-react';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import { getCities, getDistricts } from '../lib/turkey-data';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const store = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'login' | 'forgot_password' | 'email_sent' | 'register' | 'register_success'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [registerForm, setRegisterForm] = useState({ vkn: '', name: '', email: '', phone: '', city: '', district: '', address: '', sector: '', isEsilaCustomer: false });

  const cities = getCities();
  const districts = registerForm.city ? getDistricts(registerForm.city) : [];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerForm.vkn || !registerForm.name || !registerForm.email || !registerForm.phone) {
      setError('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    try {
      const promise = fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vkn: registerForm.vkn,
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          city: registerForm.city,
          district: registerForm.district,
          address: registerForm.address,
          sector: registerForm.sector,
          isEsilaCustomer: registerForm.isEsilaCustomer,
          package: 'Aylık',
          modules: ['dashboard', 'cariler', 'urunler', 'depo', 'siparisler', 'kasa', 'personel', 'teklifler', 'mutabakat', 'raporlar', 'ariza']
        })
      }).then(async res => {
         if (!res.ok) throw new Error();
         return res.json();
      });

      await toast.promise(promise, {
        loading: 'Başvurunuz gönderiliyor...',
        success: 'Başvurunuz başarıyla alındı.',
        error: 'Başvuru sırasında bir hata oluştu.'
      });
      
      setView('register_success');
    } catch (err) {
      setError('Bağlantı hatası veya başvuru gönderilemedi.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('esila_tenant_id', user.vkn || '1111111111');
        localStorage.setItem('esila_user_id', user.id);
        onLogin();
      } else {
        const err = await res.json();
        setError(err.error || 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (err) {
      setError('Giriş işlemi sırasında bir hata oluştu.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetEmail) {
      setError('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Şifre sıfırlama işlemi başarısız oldu.');
        return;
      }

      const resetLink = `https://${window.location.host}/reset-password?email=${resetEmail}`; // Gerçekte token olmalı
      const promise = fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: resetEmail, 
          subject: "Şifre Sıfırlama - Esila Ticari", 
          html: `<p>Sayın ${data.name},</p><p>Şifre sıfırlama talebiniz alınmıştır.</p><p><a href="${resetLink}">Şifrenizi sıfırlamak için tıklayın</a></p>` 
        })
      }).then(res => {
         if(!res.ok) throw new Error();
         return res.json();
      });

      toast.promise(promise, {
        loading: 'Şifre sıfırlama maili gönderiliyor...',
        success: 'Şifre sıfırlama maili gönderildi.',
        error: 'Şifre sıfırlama maili gönderilirken hata oluştu.'
      });
      
      setView('email_sent');
    } catch (e) {
      setError("Bağlantı hatası veya email gönderilemedi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-900 p-4">
      <div className="bg-white w-full max-w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 bg-emerald-50 border-b border-emerald-100 flex flex-col items-center">
          <h1 className="text-4xl font-sans font-bold tracking-tight text-emerald-700 drop-shadow-sm mb-2 cursor-default">Esila Ticari</h1>
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
            
            <div className="text-center flex justify-between px-1 mt-4">
              <button 
                type="button"
                onClick={() => { setView('forgot_password'); setError(''); }} 
                className="text-sm text-gray-500 hover:text-emerald-700 font-medium"
              >
                Şifremi Unuttum?
              </button>
              <button 
                type="button"
                onClick={() => { setView('register'); setError(''); }} 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Kayıt Ol (Başvuru)
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
        
        {view === 'register' && (
          <form onSubmit={handleRegister} className="p-4 md:p-8 space-y-6 animate-fade-in">
            <div className="space-y-1">
               <h2 className="text-2xl font-bold text-gray-800">Lisans Başvurusu</h2>
               <p className="text-gray-500 text-sm">Sistemi kullanmak için ön kayıt başvurusu yapın. Esila Yazılım onayından sonra hesabınız aktif edilecek ve bilgileriniz mail adresinize iletilecektir.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Firma / Kurum Adı *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Firma Adı A.Ş."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Vergi Numaranız (VKN) / TC No *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={registerForm.vkn}
                    onChange={(e) => setRegisterForm({ ...registerForm, vkn: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Vergi numaranız veya TC kimlik numaranız"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">E-Posta Adresiniz *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="isim@firma.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Telefon *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    required
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Sektörünüz</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={registerForm.sector}
                    onChange={(e) => setRegisterForm({ ...registerForm, sector: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="Örn: Bilişim, Perakende"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 ml-1">İl</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value, district: '' })}
                      className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="">İl Seçiniz</option>
                      {cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 ml-1">İlçe</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={registerForm.district}
                      onChange={(e) => setRegisterForm({ ...registerForm, district: e.target.value })}
                      disabled={!registerForm.city}
                      className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">İlçe Seçiniz</option>
                      {districts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Detaylı Adres</label>
                <textarea
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Açık adresiniz"
                  rows={2}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={registerForm.isEsilaCustomer}
                    onChange={(e) => setRegisterForm({ ...registerForm, isEsilaCustomer: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mevcut Esila Yazılım müşterisiyim</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Başvuru Yap</span>
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

        {view === 'register_success' && (
          <div className="p-4 md:p-8 space-y-6 text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Başvurunuz Alındı</h2>
            <p className="text-gray-600 text-sm">
              Lisans başvurunuz başarıyla alınmıştır. Sistem yöneticilerimiz (Süper Admin) başvurunuzu inceledikten sonra onaylayacaktır. 
            </p>
            <p className="text-gray-600 text-sm">
              Onaylandığında e-posta adresinize bilgilendirme yapılacaktır. Şifreniz VKN numaranızın sonuna <strong>123</strong> eklenerek oluşturulur (Örn: {registerForm.vkn}123).
            </p>

            <button 
              type="button"
              onClick={() => { setView('login'); setError(''); setRegisterForm({ vkn: '', name: '', email: '' }); }} 
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