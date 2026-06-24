import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  ShoppingBag,
  Factory,
  Warehouse, 
  Wallet, 
  Truck, 
  UserCheck, 
  FileText, 
  Settings as SettingsIcon,
  Globe,
  FileBadge,
  Handshake,
  Zap,
  Wrench,
  CalendarDays,
  ScanLine,
  CreditCard,
  Folder
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  tenantInfo?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, tenantInfo }) => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const { settings } = store;
  
  const allMenuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'hizlisatis', label: 'Hızlı Satış', icon: Zap },
    { id: 'terminal', label: 'El Terminali', icon: ScanLine },
    { id: 'cariler', label: 'Cariler', icon: Users },
    { id: 'crm', label: 'CRM & Kampanya', icon: Users },
    { id: 'urunler', label: 'Ürünler', icon: Package },
    { id: 'siparisler', label: 'Siparişler', icon: ShoppingCart },
    { id: 'satinalma', label: 'Satın Alma', icon: ShoppingBag },
    { id: 'uretim', label: 'Üretim', icon: Factory },
    { id: 'efatura', label: 'E-Fatura', icon: FileText },
    { id: 'depo', label: 'Depo', icon: Warehouse },
    { id: 'sayim', label: 'Stok Sayım', icon: ScanLine },
    { id: 'kasa', label: 'Kasa', icon: Wallet },
    { id: 'personel', label: 'Personel', icon: UserCheck },
    { id: 'mutabakat', label: 'Mutabakat', icon: Handshake },
    { id: 'ariza', label: 'Arıza Formları', icon: Wrench },
    { id: 'ajanda', label: 'Ajanda & Notlar', icon: CalendarDays },
    { id: 'dokumanlar', label: 'Dökümanlar', icon: Folder },
    { id: 'raporlar', label: 'Raporlar', icon: FileText },
    { id: 'teklif', label: 'Teklifler', icon: FileBadge },
    { id: 'ayarlar', label: 'Ayarlar', icon: SettingsIcon },
  ];

  const allowedModules = tenantInfo?.modules 
    ? (typeof tenantInfo.modules === 'string' ? JSON.parse(tenantInfo.modules) : tenantInfo.modules)
    : ['all'];

  // Map menu IDs to their corresponding permission module names
  const permissionMap: Record<string, string> = {
    'hizlisatis': 'hizlisatis',
    'terminal': 'terminal',
    'cariler': 'cariler',
    'crm': 'crm',
    'urunler': 'urunler',
    'siparisler': 'siparisler',
    'satinalma': 'satinalma',
    'uretim': 'uretim',
    'ceksenet': 'ceksenet',
    'efatura': 'efatura',
    'depo': 'depo',
    'sayim': 'stoksayim', // mapped to match types !
    'kasa': 'kasa',
    'personel': 'personel',
    'mutabakat': 'mutabakat',
    'ariza': 'ariza', // assuming it maps or just pass through if not exist
    'ajanda': 'ajanda',
    'raporlar': 'raporlar',
    'teklif': 'teklifler', // mapped
    'ayarlar': 'ayarlar',
  };

  const menuItems = allMenuItems.filter(item => {
    // Check tenant modules
    if (!allowedModules.includes('all') && item.id !== 'ayarlar') {
      if (!allowedModules.includes(item.id)) return false;
    }

    // Check user permissions
    if (item.id === 'dashboard') return true;
    
    // Admin always sees everything
    if (currentUser?.role === 'admin') return true;

    const moduleName = permissionMap[item.id];
    if (moduleName && currentUser?.permissions) {
       // if permission is explicitly missing, consider it true for modules newly added/not configured, 
       // but since we initialize them, it should exist. 
       // The hasPermission func handles un-defined gracefully.
       return hasPermission(currentUser, moduleName as any, 'view');
    }
    
    return true; // allow by default if not mapped
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
                  onClick={() => setActivePage(item.id)}
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