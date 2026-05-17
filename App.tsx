import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Cariler } from './pages/Cariler';
import { Urunler } from './pages/Urunler';
import { Depo } from './pages/Depo';
import { Siparisler } from './pages/Siparisler';
import { Ayarlar } from './pages/Ayarlar';
import { Login } from './pages/Login';
import { Kasa } from './pages/Kasa';
import { Personel } from './pages/Personel';
import { Teklifler } from './pages/Teklifler';
import { Mutabakat } from './pages/Mutabakat';
import { Raporlar } from './pages/Raporlar';
import { FileText } from 'lucide-react';
import { initializeStore } from './lib/store';

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

  useEffect(() => {
    initializeStore();
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'cariler': return <Cariler />;
      case 'urunler': return <Urunler />;
      case 'depo': return <Depo />;
      case 'siparisler': return <Siparisler />;
      case 'ayarlar': return <Ayarlar />;
      case 'kasa': return <Kasa />;
      case 'personel': return <Personel />;
      case 'mutabakat': return <Mutabakat />;
      case 'raporlar': return <Raporlar />;
      case 'efatura': 
        return (
          <div className="flex flex-col items-center justify-center p-12 h-full">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center max-w-md">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">E-Fatura Portalı</h2>
              <p className="text-gray-600 mb-6">
                Güvenlik nedeniyle E-Fatura portalı bu sayfa içinde açılamıyor. Portala erişmek için lütfen yeni sekmede açın.
              </p>
              <a 
                href="https://eportal.e-esila.com.tr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Yeni Sekmede Aç
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        );
      case 'teklif': return <Teklifler />;
      default: return <ComingSoon title={activePage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Hidden on print */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out no-print`}>
        <Sidebar activePage={activePage} setActivePage={(page) => { setActivePage(page); setIsMobileMenuOpen(false); }} />
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
          onLogout={() => setIsAuthenticated(false)} 
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
    </div>
  );
};

export default App;