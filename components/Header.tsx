import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Package, FileText, ShoppingCart, Users, Menu, LifeBuoy, X } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { toast } from 'react-hot-toast';

interface HeaderProps {
  setActivePage: (page: string) => void;
  onLogout: () => void;
  toggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setActivePage, onLogout, toggleMobileMenu }) => {
  const store = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) {
      toast.error('Lütfen konu ve mesaj alanlarını doldurunuz.');
      return;
    }
    
    setIsSubmittingSupport(true);
    try {
      const html = `
        <div style="font-family: sans-serif; p-4;">
          <h2 style="color: #059669;">Yeni Destek Talebi</h2>
          <p><strong>Firma VKN:</strong> ${localStorage.getItem('esila_tenant_id')}</p>
          <p><strong>Firma Adı:</strong> ${store.settings.companyName}</p>
          <p><strong>Kullanıcı:</strong> admin@esila.com</p>
          <hr/>
          <p><strong>Konu:</strong> ${supportSubject}</p>
          <p><strong>Mesaj:</strong><br/>${supportMessage.replace(/\n/g, '<br/>')}</p>
        </div>
      `;
      // Destek taleplerini şirkete veya destek ekibine (admin email vb.) gönder
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': localStorage.getItem('esila_tenant_id') || '' },
        body: JSON.stringify({
          to: 'ahdurko@gmail.com',
          subject: `Destek Talebi: ${supportSubject}`,
          html: html,
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Destek talebiniz başarıyla iletildi.');
        setShowSupportModal(false);
        setSupportSubject('');
        setSupportMessage('');
      } else {
        toast.error('Destek talebi iletilemedi: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (error: any) {
      toast.error('Bağlantı hatası: ' + error.message);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate notifications
  const lowStockProducts = store.products.filter(p => p.stock < 10);
  const stockNotifications = lowStockProducts.map(p => ({
    id: `stock-${p.id}`,
    title: 'Düşük Stok Uyarısı',
    message: `${p.name} ürünü stokta azaldı (${p.stock} adet kaldı).`,
    time: 'Sürekli',
    type: 'warning',
    onClick: () => setActivePage('urunler')
  }));

  const todayStr = new Date().toISOString().split('T')[0];
  const activeReminders = (store.reminderNotes || []).filter(n => !n.isCompleted && n.date <= todayStr);
  const reminderNotifications = activeReminders.map(r => ({
    id: `note-${r.id}`,
    title: `Hatırlatma: ${r.type}`,
    message: r.title + (r.description ? ` - ${r.description}` : ''),
    time: r.date === todayStr ? 'Bugün' : 'Gecikmiş',
    type: r.date === todayStr ? 'info' : 'error',
    onClick: () => setActivePage('ajanda')
  }));

  const notifications = [...reminderNotifications, ...stockNotifications];

  // Global search implementation
  const searchResults = {
    products: searchTerm ? store.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 3) : [],
    customers: searchTerm ? store.customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 3) : [],
    orders: searchTerm ? store.orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 3) : []
  };

  const hasSearchResults = searchResults.products.length > 0 || searchResults.customers.length > 0 || searchResults.orders.length > 0;

  return (
    <header className="h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-4 md:px-8 no-print relative z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search */}
        <div className="flex items-center text-gray-400 gap-2 relative" ref={searchRef}>
           <Search size={20} className="hidden sm:block" />
           <input 
             type="text" 
             value={searchTerm}
             onChange={(e) => {
               setSearchTerm(e.target.value);
               setShowResults(true);
             }}
             onFocus={() => setShowResults(true)}
             placeholder="Genel arama..." 
             className="bg-transparent border-none focus:outline-none text-gray-600 placeholder-gray-400 w-32 sm:w-64" 
           />
         
          {/* Search Dropdown */}
          {showResults && searchTerm && (
            <div className="absolute top-12 left-0 w-96 bg-white border border-gray-200 shadow-xl rounded-xl py-2 max-h-[80vh] overflow-y-auto">
              {!hasSearchResults ? (
                <div className="px-4 py-3 text-sm text-gray-500">Sonuç bulunamadı.</div>
              ) : (
                <>
                  {searchResults.products.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-1 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Package size={12} /> Ürünler
                      </div>
                      {searchResults.products.map(p => (
                        <div key={p.id} onClick={() => { setActivePage('urunler'); setShowResults(false); }} className="px-4 py-2 hover:bg-gray-50 cursor-pointer pointer flex justify-between items-center group">
                          <div>
                            <div className="text-sm font-medium text-gray-800 group-hover:text-emerald-600">{p.name}</div>
                            <div className="text-xs text-gray-500">Stok: {p.stock} adet</div>
                          </div>
                          <div className="text-sm font-medium text-gray-600">{Number(p.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div className="mb-2 border-t border-gray-100 pt-2">
                      <div className="px-4 py-1 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Users size={12} /> Cariler
                      </div>
                      {searchResults.customers.map(c => (
                        <div key={c.id} onClick={() => { setActivePage('cariler'); setShowResults(false); }} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center group">
                          <div>
                            <div className="text-sm font-medium text-gray-800 group-hover:text-emerald-600">{c.companyName || c.name}</div>
                            <div className="text-xs text-gray-500">{c.type}</div>
                          </div>
                          <div className={`text-xs font-medium px-2 py-1 rounded-full ${c.balance >= 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {Math.abs(c.balance).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} {c.balance >= 0 ? '(Borç)' : '(Alacak)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.orders.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                      <div className="px-4 py-1 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <ShoppingCart size={12} /> Siparişler
                      </div>
                      {searchResults.orders.map(o => (
                        <div key={o.id} onClick={() => { setActivePage('siparisler'); setShowResults(false); }} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center group">
                          <div>
                            <div className="text-sm font-medium text-gray-800 group-hover:text-emerald-600">{o.id}</div>
                            <div className="text-xs text-gray-500">{o.customerName}</div>
                          </div>
                          <div className="text-sm font-medium text-gray-600">{Number(o.total || (o as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
         {/* Notifications */}
         <div className="relative" ref={notifRef}>
           <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
           >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
           </button>
           
           {showNotifications && (
             <div className="absolute top-12 right-0 w-80 bg-white border border-gray-200 shadow-xl rounded-xl py-2 overflow-hidden">
               <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-semibold text-gray-800">Bildirimler</h3>
                 <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{notifications.length} Yeni</span>
               </div>
               <div className="overflow-y-auto max-h-96">
                 {notifications.length === 0 ? (
                   <div className="px-4 py-6 text-center text-sm text-gray-500">
                     Yeni bildirim bulunmuyor.
                   </div>
                 ) : (
                   notifications.map((n, idx) => (
                     <div key={n.id || idx} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { if ((n as any).onClick) (n as any).onClick(); setShowNotifications(false); }}>
                       <div className="flex justify-between items-start mb-1">
                         <span className={`text-sm font-semibold ${(n as any).type === 'error' ? 'text-red-600' : 'text-gray-800'}`}>{n.title}</span>
                         <span className={`text-xs ${(n as any).type === 'error' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{n.time}</span>
                       </div>
                       <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                     </div>
                   ))
                 )}
               </div>
             </div>
           )}
         </div>

         <div className="h-8 w-px bg-gray-200"></div>

         {/* User Menu */}
         <div className="relative" ref={userRef}>
           <div 
             className="flex items-center gap-3 cursor-pointer select-none group"
             onClick={() => setShowUserMenu(!showUserMenu)}
           >
             <div className="text-right hidden md:block">
               <p className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">{store.settings.companyName.substring(0, 20)}</p>
               <p className="text-xs text-gray-500">admin@esila.com</p>
             </div>
             <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 border-2 border-emerald-200 group-hover:border-emerald-300 transition-colors overflow-hidden">
                {store.settings.companyLogo ? (
                  <img src={store.settings.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
             </div>
           </div>

           {showUserMenu && (
             <div className="absolute top-14 right-0 w-56 bg-white border border-gray-200 shadow-xl rounded-xl py-2 overflow-hidden">
               <div className="px-4 py-3 border-b border-gray-100 mb-1">
                 <p className="text-sm font-semibold text-gray-800">Yönetici Hesabı</p>
                 <p className="text-xs text-gray-500 truncate">admin@esila.com</p>
               </div>
               
               <button 
                 onClick={() => { setActivePage('ayarlar'); setShowUserMenu(false); }}
                 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
               >
                 <SettingsIcon size={16} /> Firma Ayarları
               </button>

               <button 
                 onClick={() => { setShowSupportModal(true); setShowUserMenu(false); }}
                 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
               >
                 <LifeBuoy size={16} /> Destek Talebi
               </button>
               
               <div className="border-t border-gray-100 mt-1 pt-1">
                 <button 
                   onClick={onLogout}
                   className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                 >
                   <LogOut size={16} /> Çıkış Yap
                 </button>
               </div>
             </div>
           )}
         </div>
      </div>

      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in relative z-50">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LifeBuoy size={24} className="text-blue-600" /> Destek Talebi
              </h2>
              <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSupportSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Talebinizin konusu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
                  <textarea
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={5}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Yaşadığınız sorunu veya talebinizi detaylıca açıklayınız..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center gap-2"
                >
                  {isSubmittingSupport ? (
                    'Gönderiliyor...'
                  ) : (
                    <>Talebi Gönder</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
