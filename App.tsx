import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Cariler } from './pages/Cariler';
import { Urunler } from './pages/Urunler';
import { Depo } from './pages/Depo';
import { Siparisler } from './pages/Siparisler';
import { Ayarlar } from './pages/Ayarlar';
import { Login } from './pages/Login';
import { Bell, Search, User } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

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
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
           <p className="text-xl">Bu modül ({activePage}) henüz aktif değil.</p>
           <p className="text-sm">Geliştirme aşamasında...</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on print */}
      <div className="no-print">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64 no-print-margin transition-all duration-300 w-full">
        
        {/* Header - Hidden on print */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-8 no-print">
          <div className="flex items-center text-gray-400 gap-2">
             <Search size={20} />
             <input type="text" placeholder="Genel arama..." className="bg-transparent border-none focus:outline-none text-gray-600 placeholder-gray-400 w-64" />
          </div>
          
          <div className="flex items-center gap-4">
             <button className="p-2 relative text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="h-8 w-px bg-gray-200"></div>
             <div className="flex items-center gap-3">
               <div className="text-right hidden md:block">
                 <p className="text-sm font-semibold text-gray-700">Yönetici</p>
                 <p className="text-xs text-gray-500">admin@esila.com</p>
               </div>
               <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 border-2 border-emerald-200">
                 <User size={20} />
               </div>
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto p-8">
           {renderContent()}
        </main>
      </div>

      {/* Print Overlay - Visible only when printing */}
      <div className="print-only fixed inset-0 bg-white z-[9999]">
         {/* The logic for rendering print content is inside specific pages (e.g. Siparisler) using CSS classes */}
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