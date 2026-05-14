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
  LogOut,
  FileBadge
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'cariler', label: 'Cariler', icon: Users },
    { id: 'urunler', label: 'Ürünler', icon: Package },
    { id: 'siparisler', label: 'Siparişler', icon: ShoppingCart },
    { id: 'depo', label: 'Depo', icon: Warehouse },
    { id: 'kasa', label: 'Kasa', icon: Wallet },
    { id: 'personel', label: 'Personel', icon: UserCheck },
    { id: 'efatura', label: 'E-Fatura', icon: FileText },
    { id: 'teklif', label: 'Teklifler', icon: FileBadge },
    { id: 'ayarlar', label: 'Ayarlar', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen w-64 bg-emerald-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 flex items-center justify-center border-b border-emerald-800">
        <h1 className="text-5xl font-logo text-emerald-100 drop-shadow-md">esila</h1>
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
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-emerald-200 hover:text-white transition-colors">
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};