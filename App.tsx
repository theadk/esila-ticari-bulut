import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Cariler } from './pages/Cariler';
import { Urunler } from './pages/Urunler';
import { Depo } from './pages/Depo';
import { StokSayim } from './pages/StokSayim';
import { Siparisler } from './pages/Siparisler';
import { Satislar } from './pages/Satislar';
import { HizliSatis } from './pages/HizliSatis';
import { Ayarlar } from './pages/Ayarlar';
import { Login } from './pages/Login';
import { Kasa } from './pages/Kasa';
import { Personel } from './pages/Personel';
import { Teklifler } from './pages/Teklifler';
import { Mutabakat } from './pages/Mutabakat';
import { SatinAlma } from './pages/SatinAlma';
import { Uretim } from './pages/Uretim';
import { Raporlar } from './pages/Raporlar';
import { Ariza } from './pages/Ariza';
import { EFatura } from './pages/EFatura';
import { Ajanda } from './pages/Ajanda';
import { Dokumanlar } from './pages/Dokumanlar';
import { SuperAdminLogin } from './src/pages/SuperAdminLogin';
import { SuperAdminDashboard } from './src/pages/SuperAdminDashboard';
import { PublicFormView } from './pages/PublicFormView';
import { MutabakatOnayView } from './pages/MutabakatOnayView';
import { PublicProposalView } from './pages/PublicProposalView';
import { FileText } from 'lucide-react';
import { initializeStore } from './lib/store';
import { InstallPrompt } from './src/components/InstallPrompt';
import { VoiceNavigator } from './components/VoiceNavigator';
import { CommandPalette } from './components/CommandPalette';
import { useKeyboardShortcuts } from './lib/useKeyboardShortcuts';
import { ToastSpeaker } from './components/ToastSpeaker';

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
     <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
     <p className="text-xl">Bu modül henüz aktif değil.</p>
     <p className="text-sm">Geliştirme aşamasında...</p>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!(sessionStorage.getItem('esila_tenant_id') && sessionStorage.getItem('esila_user_id'));
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  // Checks via URL params
  const searchParams = new URLSearchParams(window.location.search);
  const isSuperAdminRoute = searchParams.get('admin') === 'true';
  const publicFormId = searchParams.get('public_form');
  const publicFormType = searchParams.get('type');
  const publicTenantId = searchParams.get('t');
  const publicFormToken = searchParams.get('token');
  
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);

  const handleLogout = async () => {
    try {
       await fetch('/api/logout', { 
         method: 'POST', 
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({
           vkn: sessionStorage.getItem('esila_tenant_id'),
           userId: sessionStorage.getItem('esila_user_id')
         }) 
       }); 
    } catch(e) {}
    setIsAuthenticated(false); 
    sessionStorage.removeItem('esila_tenant_id'); 
    sessionStorage.removeItem('esila_user_id'); 
    window.location.reload(); 
  };

  useEffect(() => {
    let timeoutId: any;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isAuthenticated) {
          handleLogout();
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    if (isAuthenticated) {
      resetTimeout();
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keypress', resetTimeout);
      window.addEventListener('click', resetTimeout);
      window.addEventListener('scroll', resetTimeout);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeStore(true);
      fetch('/api/tenant-info', {
        headers: { 'x-tenant-id': sessionStorage.getItem('esila_tenant_id') || '' }
      }).then(res => res.json()).then(data => setTenantInfo(data)).catch(console.error);
    }
  }, [isAuthenticated]);

  useKeyboardShortcuts({
    'ctrl+k': () => setIsCommandPaletteOpen(true),
    'ctrl+b': () => setIsMobileMenuOpen(prev => !prev),
    'ctrl+h': () => setActivePage('dashboard'),
  });

  if (publicFormToken) {
    return <PublicFormView token={publicFormToken} />;
  }

  if (publicFormId && publicFormType && publicTenantId) {
    return <PublicFormView id={publicFormId} type={publicFormType} tenantId={publicTenantId} />;
  }

  if (window.location.pathname.startsWith('/mutabakat-onay/')) {
    const mutabakatId = window.location.pathname.split('/').pop() || '';
    const mutabakatVkn = searchParams.get('vkn') || '';
    return <MutabakatOnayView id={mutabakatId} vkn={mutabakatVkn} />;
  }

  if (window.location.pathname.startsWith('/teklif-onay/')) {
    const teklifId = window.location.pathname.split('/').pop() || '';
    const tenantId = searchParams.get('tenantId') || '';
    return <PublicProposalView id={teklifId} tenantId={tenantId} />;
  }

  if (isSuperAdminRoute) {
    if (!isSuperAdminAuthenticated) {
      return <SuperAdminLogin onLogin={() => setIsSuperAdminAuthenticated(true)} />;
    }
    return <SuperAdminDashboard onLogout={() => setIsSuperAdminAuthenticated(false)} />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }


  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} />;
      case 'cariler': return <Cariler />;
      case 'urunler': return <Urunler />;
      case 'depo': return <Depo />;
      case 'sayim': return <StokSayim />;
      case 'satislar': return <Satislar />;
      case 'siparisler': return <Siparisler />;
      case 'hizlisatis': return <HizliSatis />;
      case 'ayarlar': return <Ayarlar />;
      case 'ariza': return <Ariza />;
      case 'kasa': return <Kasa />;
      case 'personel': return <Personel />;
      case 'mutabakat': return <Mutabakat />;
      case 'satinalma': return <SatinAlma />;
      case 'uretim': return <Uretim />;
      case 'raporlar': return <Raporlar />;
      case 'efatura': return <EFatura />;
      case 'teklif': return <Teklifler />;
      case 'ajanda': return <Ajanda />;
      case 'dokumanlar': return <Dokumanlar />;
      default: return <ComingSoon title={activePage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />
      <ToastSpeaker />
      {/* Sidebar - Hidden on print */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out no-print`}>
        <Sidebar activePage={activePage} setActivePage={(page) => { setActivePage(page); setIsMobileMenuOpen(false); }} tenantInfo={tenantInfo} />
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 no-print-margin transition-all duration-300 w-full overflow-hidden">
        
        {/* Header - Hidden on print */}
        <Header 
          setActivePage={setActivePage} 
          onLogout={handleLogout} 
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 flex flex-col p-4 md:p-8 overflow-auto">
           {renderContent()}
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        setActivePage={setActivePage} 
      />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-margin { margin-left: 0 !important; }
          body { overflow: visible !important; }
        }
      `}</style>
      <VoiceNavigator setActivePage={setActivePage} />
      <InstallPrompt />
    </div>
  );
};

export default App;