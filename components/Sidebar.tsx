import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Warehouse, 
  Wallet, 
  Truck, 
  UserCheck, 
  FileText, 
  Settings as SettingsIcon,
  Globe,
  FileBadge,
  Handshake,
  Zap
} from 'lucide-react';
import { useAppStore } from '../lib/store';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  tenantInfo?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, tenantInfo }) => {
  const { settings } = useAppStore();
  const allMenuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'hizlisatis', label: 'Hızlı Satış', icon: Zap },
    { id: 'cariler', label: 'Cariler', icon: Users },
    { id: 'urunler', label: 'Ürünler', icon: Package },
    { id: 'siparisler', label: 'Siparişler', icon: ShoppingCart },
    { id: 'depo', label: 'Depo', icon: Warehouse },
    { id: 'kasa', label: 'Kasa', icon: Wallet },
    { id: 'personel', label: 'Personel', icon: UserCheck },
    { id: 'mutabakat', label: 'Mutabakat', icon: Handshake },
    { id: 'raporlar', label: 'Raporlar', icon: FileText },
    { id: 'efatura', label: 'E-Fatura', icon: FileText },
    { id: 'teklif', label: 'Teklifler', icon: FileBadge },
    { id: 'ayarlar', label: 'Ayarlar', icon: SettingsIcon },
  ];

  const allowedModules = tenantInfo?.modules 
    ? (typeof tenantInfo.modules === 'string' ? JSON.parse(tenantInfo.modules) : tenantInfo.modules)
    : ['all'];

  const menuItems = allMenuItems.filter(item => {
    if (allowedModules.includes('all')) return true;
    if (item.id === 'dashboard' || item.id === 'ayarlar' || item.id === 'efatura') return true;
    // Map some module names
    const mappedId = item.id === 'teklif' ? 'teklifler' : item.id === 'hizlisatis' ? 'siparisler' : item.id;
    return allowedModules.includes(mappedId);
  });

  return (
    <div className="h-screen w-64 bg-emerald-900 text-white flex flex-col shadow-xl z-50">
      <div className="p-6 flex flex-col items-center justify-center border-b border-emerald-800">
        <h1 className="text-3xl font-sans font-bold tracking-tight text-emerald-100 drop-shadow-md cursor-default">Esila Ticari</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'efatura') {
                      window.open('https://eportal.e-esila.com.tr', '_blank');
                    } else {
                      setActivePage(item.id);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-700 text-white shadow-lg translate-x-1' 
                      : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-emerald-800">
        <a href="https://www.esilaticari.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center space-x-3 px-4 py-2 text-emerald-200 hover:text-white transition-colors">
          <Globe size={20} />
          <span>www.esilaticari.com</span>
        </a>
      </div>
    </div>
  );
};