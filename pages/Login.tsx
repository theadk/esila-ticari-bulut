import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Building,
  MapPin,
  Landmark,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import { getCities, getDistricts } from '../lib/turkey-data';

interface LoginProps {
  onLogin: () => void;
}

interface IbanAccount {
  id: string;
  bankName: string;
  accountName: string;
  iban: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const store = useAppStore();
  const [username, setUsername] = useState(localStorage.getItem('esila_saved_username') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<
    'login' | 'forgot_password' | 'email_sent' | 'register' | 'register_success' | 'payment' | 'payment_success'
  >('login');
  const [resetEmail, setResetEmail] = useState('');
  const [registerForm, setRegisterForm] = useState({
    vkn: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    sector: '',
    isEsilaCustomer: false
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // IBAN / EFT Payment State
  const [ibanAccounts, setIbanAccounts] = useState<IbanAccount[]>([
    {
      id: 'default-1',
      bankName: 'Ziraat Bankası',
      accountName: 'Esila Yazılım ve Bilişim Sistemleri',
      iban: 'TR32 0001 0017 4567 8901 2350 01'
    },
    {
      id: 'default-2',
      bankName: 'Garanti BBVA',
      accountName: 'Esila Yazılım ve Bilişim Sistemleri',
      iban: 'TR64 0006 2000 4120 0006 2987 41'
    }
  ]);
  const [paymentForm, setPaymentForm] = useState({
    name: '',
    vkn: '',
    email: '',
    phone: '',
    senderName: '',
    selectedBank: 'Ziraat Bankası',
    amount: '1250',
    receiptNote: ''
  });
  const [copiedIbanId, setCopiedIbanId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedRefNo, setCompletedRefNo] = useState<string>('');
  const [notifiedAdmins, setNotifiedAdmins] = useState<string[]>(['ahdurko@gmail.com']);

  const cities = getCities();
  const districts = registerForm.city ? getDistricts(registerForm.city) : [];

  useEffect(() => {
    if (view !== 'payment') return;
    fetch('/api/payment-info')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.ibanAccounts?.length) {
          setIbanAccounts(data.ibanAccounts);
          setPaymentForm(prev => ({ ...prev, selectedBank: data.ibanAccounts[0].bankName }));
        }
      })
      .catch(() => {});
  }, [view]);

  const handleCopyIban = (id: string, iban: string) => {
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedIbanId(id);
    toast.success('IBAN panoya kopyalandı');
    setTimeout(() => setCopiedIbanId(null), 2000);
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!paymentForm.name || !paymentForm.email || !paymentForm.phone) {
      setError('Lütfen Ad/Unvan, E-Posta ve Telefon bilgilerinizi eksiksiz giriniz.');
      return;
    }

    if (!paymentForm.senderName) {
      setError('Lütfen Havale/EFT gönderen ad soyad veya firma unvanını yazınız.');
      return;
    }

    const numericAmount = Number(paymentForm.amount || 0);
    if (!numericAmount || numericAmount <= 0) {
      setError('Lütfen gönderilen tutarı giriniz.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/payment/iban-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: paymentForm.name,
          vkn: paymentForm.vkn,
          email: paymentForm.email,
          phone: paymentForm.phone,
          amount: numericAmount,
          packageName: 'Banka Havale / EFT Ödemesi',
          senderName: paymentForm.senderName,
          selectedBank: paymentForm.selectedBank,
          receiptNote: paymentForm.receiptNote
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedRefNo(data.referenceNo);
        if (Array.isArray(data.notifiedAdmins) && data.notifiedAdmins.length > 0) {
          setNotifiedAdmins(data.notifiedAdmins);
        }
        toast.success('Havale / EFT ödeme bildiriminiz yöneticiye e-posta olarak iletildi.');
        setView('payment_success');
      } else {
        setError(data.error || 'Ödeme bildirimi gönderilirken bir hata oluştu.');
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerForm.vkn || !registerForm.name || !registerForm.email || !registerForm.phone) {
      setError('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    setIsRegistering(true);
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
    } finally {
      setIsRegistering(false);
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
        localStorage.setItem('esila_saved_username', username);
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

      const resetLink = `https://${window.location.host}/reset-password?email=${resetEmail}`;
      const promise = fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: resetEmail,
          subject: 'Şifre Sıfırlama - Esila Ticari',
          wrapped: true,
          html: `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Sayın ${data.name},</h2>
<p style="margin-bottom: 24px;">Esila Ticari Ön Muhasebe Sistemi kullanıcı hesabınız için şifre sıfırlama talebiniz başarıyla alınmıştır. Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanabilirsiniz.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
  <p style="margin-bottom: 16px; color: #475569; font-size: 14px;">Bu bağlantı güvenliğiniz için yalnızca belirli bir süre geçerli olacaktır.</p>
  <a href="${resetLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">Şifremi Sıfırla</a>
</div>
<p style="margin-bottom: 0; color: #64748b; font-size: 14px;">Eğer bu yetkilendirme isteği size ait değilse lütfen bu mesajı dikkate almayınız.</p>`
        })
      }).then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      });

      toast.promise(promise, {
        loading: 'Şifre sıfırlama maili gönderiliyor...',
        success: 'Şifre sıfırlama maili gönderildi.',
        error: 'Şifre sıfırlama maili gönderilirken hata oluştu.'
      });

      setView('email_sent');
    } catch (e) {
      setError('Bağlantı hatası veya email gönderilemedi.');
    }
  };

  const isWideView = view === 'payment';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url("/login-bg.png"), linear-gradient(to bottom right, #065f46, #064e3b)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div
        className={`bg-white w-full ${
          isWideView ? 'max-w-2xl' : 'max-w-full sm:max-w-md'
        } rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200`}
      >
        <div className="p-4 md:p-6 bg-emerald-50 border-b border-emerald-100 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-emerald-700 drop-shadow-sm mb-1 cursor-default">
            Esila Ticari
          </h1>
          <p className="text-emerald-600 font-medium tracking-wide text-sm">"Ticaretin Bulut Hali"</p>
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
                    placeholder="Kullanıcı adınız"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <span>Giriş Yap</span>
              <ArrowRight size={20} />
            </button>

            <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setError('');
                  }}
                  className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold transition-colors text-center"
                >
                  Kayıt Ol (Başvuru)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('payment');
                    setError('');
                  }}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Landmark size={16} />
                  <span>Ödeme Yap (EFT / IBAN)</span>
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot_password');
                    setError('');
                  }}
                  className="text-xs text-gray-500 hover:text-emerald-700 font-medium"
                >
                  Şifremi Unuttum?
                </button>
              </div>
            </div>
          </form>
        )}

        {view === 'payment' && (
          <form onSubmit={handleStartPayment} className="p-4 md:p-6 space-y-5 animate-fade-in max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Banka Havale / EFT ile Ödeme Bildirimi</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Aşağıdaki banka hesaplarımıza (IBAN) Havale/EFT yaptıktan sonra ödeme bildirim formunu doldurunuz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                }}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <ArrowLeft size={14} /> Giriş'e Dön
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* IBAN Accounts List */}
            <div className="space-y-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Landmark size={16} className="text-emerald-600" />
                  Banka Hesap Numaralarımız (IBAN)
                </h3>
                <span className="text-xs text-gray-500">Havale / FAST / EFT</span>
              </div>

              <div className="space-y-2.5">
                {ibanAccounts.map(acc => (
                  <div
                    key={acc.id}
                    className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-700">{acc.bankName}</div>
                      <div className="text-xs text-gray-600">{acc.accountName}</div>
                      <div className="font-mono text-sm font-semibold text-gray-900 mt-0.5 select-all">
                        {acc.iban}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyIban(acc.id, acc.iban)}
                      className="shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-center"
                    >
                      {copiedIbanId === acc.id ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedIbanId === acc.id ? 'Kopyalandı' : 'IBAN Kopyala'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* EFT / Havale Notification Form */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-600" />
                Havale / EFT Ödeme Bildirim Bilgileri
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Firma Adı veya Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.name}
                    onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })}
                    placeholder="Firma Unvanı / Ad Soyad"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vergi No (VKN) / TCKN</label>
                  <input
                    type="text"
                    value={paymentForm.vkn}
                    onChange={e => setPaymentForm({ ...paymentForm, vkn: e.target.value })}
                    placeholder="VKN veya T.C. Kimlik No"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-Posta Adresi *</label>
                  <input
                    type="email"
                    required
                    value={paymentForm.email}
                    onChange={e => setPaymentForm({ ...paymentForm, email: e.target.value })}
                    placeholder="ornek@firma.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefon Numarası *</label>
                  <input
                    type="tel"
                    required
                    value={paymentForm.phone}
                    onChange={e => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gönderen Ad Soyad / Unvan *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.senderName}
                    onChange={e => setPaymentForm({ ...paymentForm, senderName: e.target.value })}
                    placeholder="Dekonttaki gönderici adı"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gönderim Yapılan Banka</label>
                  <select
                    value={paymentForm.selectedBank}
                    onChange={e => setPaymentForm({ ...paymentForm, selectedBank: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {ibanAccounts.map(acc => (
                      <option key={acc.id} value={acc.bankName}>
                        {acc.bankName} ({acc.iban.slice(0, 12)}...)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gönderilen Tutar (₺) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="Örn: 1250"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Açıklama / Dekont Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.receiptNote}
                    onChange={e => setPaymentForm({ ...paymentForm, receiptNote: e.target.value })}
                    placeholder="Örn: Aylık lisans ödemesi, dekont no vb."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessingPayment}
              className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              <span>
                {isProcessingPayment
                  ? 'Ödeme Bildirimi Gönderiliyor...'
                  : 'Banka Havale / EFT Ödeme Bildirimini Gönder'}
              </span>
            </button>
          </form>
        )}

        {view === 'payment_success' && (
          <div className="p-6 md:p-8 space-y-5 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Ödeme Bildiriminiz Alındı</h2>
            <p className="text-gray-600 text-sm">
              Havale / EFT ödeme bildiriminiz sistem yöneticisine (<strong>{notifiedAdmins.join(', ')}</strong>) e-posta olarak gönderilmiş ve kayıt altına alınmıştır. Banka kontrolü sonrasında tarafınıza e-posta ile bilgi verilecektir.
            </p>
            {completedRefNo && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700">
                Bildirim Referans Numaranız: <strong className="font-mono text-gray-900">{completedRefNo}</strong>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setView('login');
                setError('');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Giriş Ekranına Dön
            </button>
          </div>
        )}

        {view === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="p-4 md:p-8 space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-800">Şifre Sıfırlama</h2>
              <p className="text-gray-500 text-sm">
                Kayıtlı e-posta adresinizi giriniz. Size bir sıfırlama bağlantısı göndereceğiz.
              </p>
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
                onClick={() => {
                  setView('login');
                  setError('');
                }}
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
              <strong className="text-gray-800">{resetEmail}</strong> adresine şifre sıfırlama talimatlarını içeren bir
              e-posta gönderdik. Lütfen gelen kutunuzu (ve spam/gereksiz klasörünü) kontrol edin.
            </p>

            <button
              type="button"
              onClick={() => {
                setView('login');
                setError('');
                setResetEmail('');
              }}
              className="w-full mt-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all"
            >
              Giriş Ekranına Dön
            </button>
          </div>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="p-4 md:p-8 space-y-6 animate-fade-in max-h-[82vh] overflow-y-auto">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-800">Lisans Başvurusu</h2>
              <p className="text-gray-500 text-sm">
                Sistemi kullanmak için ön kayıt başvurusu yapın. Esila Yazılım onayından sonra hesabınız aktif edilecek
                ve bilgileriniz mail adresinize iletilecektir.
              </p>
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
                  <select
                    value={registerForm.sector}
                    onChange={(e) => setRegisterForm({ ...registerForm, sector: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-white"
                  >
                    <option value="">Sektör Seçiniz</option>
                    <option value="Bilişim & Teknoloji">Bilişim & Teknoloji</option>
                    <option value="Perakende & Mağazacılık">Perakende & Mağazacılık</option>
                    <option value="Toptan Ticaret">Toptan Ticaret</option>
                    <option value="Üretim & İmalat">Üretim & İmalat</option>
                    <option value="Gıda & Tarım">Gıda & Tarım</option>
                    <option value="İnşaat & Yapı">İnşaat & Yapı</option>
                    <option value="Eğitim & Danışmanlık">Eğitim & Danışmanlık</option>
                    <option value="Sağlık & Medikal">Sağlık & Medikal</option>
                    <option value="Otomotiv & Lojistik">Otomotiv & Lojistik</option>
                    <option value="Hizmet & Diğer">Hizmet & Diğer</option>
                  </select>
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
                        <option key={c} value={c}>
                          {c}
                        </option>
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
                        <option key={d} value={d}>
                          {d}
                        </option>
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
              disabled={isRegistering}
              className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all ${
                isRegistering ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
              }`}
            >
              <span>{isRegistering ? 'Başvuru Yapılıyor...' : 'Başvuru Yap'}</span>
              {!isRegistering && <ArrowRight size={20} />}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Giriş Ekranına Dön</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentForm(prev => ({
                    ...prev,
                    name: registerForm.name || prev.name,
                    vkn: registerForm.vkn || prev.vkn,
                    email: registerForm.email || prev.email,
                    phone: registerForm.phone || prev.phone,
                    senderName: registerForm.name || prev.senderName
                  }));
                  setView('payment');
                  setError('');
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5"
              >
                <Landmark size={16} />
                <span>EFT / Havale Bildirimi Yap</span>
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
              Lisans başvurunuz başarıyla alınmıştır. Sistem yöneticilerimiz başvurunuzu inceledikten sonra
              onaylayacaktır.
            </p>
            <p className="text-gray-600 text-sm">
              Dilerseniz ödemenizi şimdi Banka Havale / EFT ile yaparak ödeme bildirimi gönderebilirsiniz.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentForm(prev => ({
                    ...prev,
                    name: registerForm.name || prev.name,
                    vkn: registerForm.vkn || prev.vkn,
                    email: registerForm.email || prev.email,
                    phone: registerForm.phone || prev.phone,
                    senderName: registerForm.name || prev.senderName
                  }));
                  setView('payment');
                  setError('');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Landmark size={18} />
                <span>Banka Havale / EFT Bildirimi Yap</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setRegisterForm({
                    vkn: '',
                    name: '',
                    email: '',
                    phone: '',
                    city: '',
                    district: '',
                    address: '',
                    sector: '',
                    isEsilaCustomer: false
                  });
                }}
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all"
              >
                Giriş Ekranına Dön
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
          &copy; 2022-2026 Esila Yazılım. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
};