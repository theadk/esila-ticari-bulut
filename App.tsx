import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Cariler } from './pages/Cariler';
import { Urunler } from './pages/Urunler';
import { Depo } from './pages/Depo';
import { Siparisler } from './pages/Siparisler';
import { HizliSatis } from './pages/HizliSatis';
import { Ayarlar } from './pages/Ayarlar';
import { Login } from './pages/Login';
import { Kasa } from './pages/Kasa';
import { Personel } from './pages/Personel';
import { Teklifler } from './pages/Teklifler';
import { Mutabakat } from './pages/Mutabakat';
import { Raporlar } from './pages/Raporlar';
import { Ariza } from './pages/Ariza';
import { EFatura } from './pages/EFatura';
import { Ajanda } from './pages/Ajanda';
import { SuperAdminLogin } from './src/pages/SuperAdminLogin';
import { SuperAdminDashboard } from './src/pages/SuperAdminDashboard';
import { FileText } from 'lucide-react';
import { initializeStore } from './lib/store';
import { InstallPrompt } from './src/components/InstallPrompt';

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
     <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
     <p className="text-xl">Bu modül henüz aktif değil.</p>
     <p className="text-sm">Geliştirme aşamasında...</p>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  // Super Admin Check via URL params
  const searchParams = new URLSearchParams(window.location.search);
  const isSuperAdminRoute = searchParams.get('admin') === 'true';
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initializeStore();
      fetch('/api/tenant-info', {
        headers: { 'x-tenant-id': localStorage.getItem('esila_tenant_id') || '' }
      }).then(res => res.json()).then(data => setTenantInfo(data)).catch(console.error);
    }
  }, [isAuthenticated]);

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
      case 'siparisler': return <Siparisler />;
      case 'hizlisatis': return <HizliSatis />;
      case 'ayarlar': return <Ayarlar />;
      case 'ariza': return <Ariza />;
      case 'kasa': return <Kasa />;
      case 'personel': return <Personel />;
      case 'mutabakat': return <Mutabakat />;
      case 'raporlar': return <Raporlar />;
      case 'efatura': return <EFatura />;
      case 'teklif': return <Teklifler />;
      case 'ajanda': return <Ajanda />;
      default: return <ComingSoon title={activePage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />
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
          onLogout={() => { setIsAuthenticated(false); localStorage.removeItem('esila_tenant_id'); window.location.reload(); }} 
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 flex flex-col p-4 md:p-8 overflow-auto">
           {renderContent()}
        </main>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-margin { margin-left: 0 !important; }
          body { overflow: visible !important; }
        }
      `}</style>
      <InstallPrompt />
    </div>
  );
};

export default App;