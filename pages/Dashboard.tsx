import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  Clock,
  Wrench,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import { Product } from '../types';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { customers, transactions, serviceTickets, settings, setServiceTickets } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [isSendingMaintenanceReminders, setIsSendingMaintenanceReminders] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    api.getProducts()
      .then(fetchedProducts => setProducts(fetchedProducts))
      .catch(err => console.error("Error fetching products", err));

    fetch('/api/tenant-info', {
      headers: {
        'x-tenant-id': localStorage.getItem('esila_tenant_id') || ''
      }
    }).then(res => res.json()).then(data => setTenantInfo(data)).catch();
  }, []);

  const serviceStatsData = useMemo(() => {
    let devamEden = 0;
    let tamamlanan = 0;
    let iptalEdilen = 0;

    serviceTickets.forEach(ticket => {
      if (ticket.status === 'Bekliyor' || ticket.status === 'İşlemde') {
        devamEden++;
      } else if (ticket.status === 'Tamamlandı') {
        tamamlanan++;
      } else if (ticket.status === 'İptal') {
        iptalEdilen++;
      }
    });

    return [
      { name: 'Devam Eden', value: devamEden, color: '#3b82f6' },
      { name: 'Tamamlanan', value: tamamlanan, color: '#10b981' },
      { name: 'İptal Edilen', value: iptalEdilen, color: '#ef4444' }
    ];
  }, [serviceTickets]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySales = transactions
      .filter(t => t.type === 'Satış')
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const activeCustomers = customers.length;
    const totalProducts = products.length;
    const criticalStock = products.filter(p => p.stock < 10).length;

    return { monthlySales, activeCustomers, totalProducts, criticalStock };
  }, [transactions, customers, products]);

  const dueMaintenance = useMemo(() => {
    return serviceTickets.filter(ticket => {
      if (ticket.status === 'Tamamlandı' && ticket.nextMaintenanceDate && !ticket.maintenanceReminderSent) {
        const nextDate = new Date(ticket.nextMaintenanceDate).getTime();
        const now = Date.now();
        return nextDate <= now;
      }
      return false;
    });
  }, [serviceTickets]);

  const handleSendMaintenanceReminders = async () => {
    if (dueMaintenance.length === 0) return;
    setIsSendingMaintenanceReminders(true);
    let successCount = 0;
    
    // Copy service tickets to update in store later
    let updatedTickets = [...serviceTickets];
    
    // We can also have an email_template_maintenance in settings if we want to allow users to edit it. Let's just use default for now.
    const templateRaw = (settings as any).email_template_maintenance || defaultTemplates.maintenance_reminder;
    
    for (const ticket of dueMaintenance) {
      const customer = customers.find(c => String(c.id) === String(ticket.customerId));
      if (!customer?.email) continue;
      
      const body = parseEmailTemplate(templateRaw, {
        MUSTERI_ADI: customer.companyName || customer.name || '',
        CIHAZ: ticket.deviceType,
        FIRMA_ADI: settings.companyName || '',
        TARIH: new Date(ticket.dateCompleted!).toLocaleDateString('tr-TR')
      });
      
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             to: customer.email, 
             subject: `Periyodik Bakım Hatırlatması - ${ticket.deviceType}`, 
             html: body 
          })
        });
        
        if (res.ok) {
           successCount++;
           // Update this ticket
           const uIdx = updatedTickets.findIndex(t => t.id === ticket.id);
           if (uIdx > -1) {
             updatedTickets[uIdx] = { ...updatedTickets[uIdx], maintenanceReminderSent: true };
           }
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setServiceTickets(updatedTickets);
    setIsSendingMaintenanceReminders(false);
    toast.success(`${successCount} bakım hatırlatma e-postası başarıyla gönderildi.`);
  };

  const chartData = useMemo(() => {
    const data = [];
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      // Daily sales
      const dailySales = transactions.filter(t => 
        t.type === 'Satış' && t.date === dateString
      );
      const satis = dailySales.reduce((sum, t) => sum + t.amount, 0);

      // Daily collections
      const dailyCollections = transactions.filter(t => 
        t.type === 'Tahsilat' && t.date === dateString
      );
      const tahsilat = dailyCollections.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      data.push({
        name: dayName,
        satis,
        tahsilat
      });
    }
    return data;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Yönetim Paneli</h2>
      
      {dueMaintenance.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
             <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
               <Wrench size={24} />
             </div>
             <div>
                <h3 className="font-semibold text-orange-800">Bakım Zamanı Gelen Cihazlar</h3>
                <p className="text-sm text-orange-700">Tamamlanan servislerden <strong>{dueMaintenance.length}</strong> tanesinin periyodik bakım süresi gelmiştir.</p>
             </div>
          </div>
          <button 
             onClick={handleSendMaintenanceReminders}
             disabled={isSendingMaintenanceReminders}
             className="whitespace-nowrap px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
             <Send size={18} />
             {isSendingMaintenanceReminders ? 'Gönderiliyor...' : 'Hatırlatmaları Gönder'}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:p-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam Satış (Aylık)</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.monthlySales.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Kayıtlı Cariler</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeCustomers}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam Ürün</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Kritik Stok</p>
            <p className="text-2xl font-bold text-gray-800">{stats.criticalStock}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:p-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Haftalık Satış Grafiği (Son 7 Gün)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                />
                <Bar dataKey="satis" name="Satış" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Tahsilat Grafiği (Son 7 Gün)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   formatter={(value: number) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                />
                <Line type="monotone" name="Tahsilat" dataKey="tahsilat" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Arıza / Servis Formları Takvimi</h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <h4 className="font-medium text-gray-700 w-32 text-center">
                {calendarDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
              </h4>
              <button 
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
            
            {(() => {
              const year = calendarDate.getFullYear();
              const month = calendarDate.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDay = new Date(year, month, 1).getDay();
              const startingEmptySlots = firstDay === 0 ? 6 : firstDay - 1;
              
              const days = [];
              for (let i = 0; i < startingEmptySlots; i++) {
                days.push(<div key={`empty-${i}`} className="bg-transparent rounded-lg p-2 h-20"></div>);
              }
              for (let i = 1; i <= daysInMonth; i++) {
                const currentDateObj = new Date(year, month, i);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const dayTickets = serviceTickets.filter(t => t.dateCreated?.startsWith(dateStr));
                
                days.push(
                  <div key={`day-${i}`} className="border border-gray-100 rounded-lg p-1 sm:p-2 h-20 md:h-24 flex flex-col items-center justify-start hover:border-emerald-300 transition-colors bg-gray-50/50">
                    <span className={`text-xs font-medium mb-1 ${`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` === dateStr ? 'bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-500'}`}>
                      {i}
                    </span>
                    {dayTickets.length > 0 && (
                      <div className="flex flex-col gap-1 w-full mt-1">
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-center truncate" title={`${dayTickets.length} Servis Kaydı`}>
                          {dayTickets.length} Servis
                        </span>
                        {dayTickets.some(t => t.status === 'Bekliyor') && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-center truncate">
                            {dayTickets.filter(t => t.status === 'Bekliyor').length} Bekleyen
                          </span>
                        )}
                        {dayTickets.some(t => t.status === 'Tamamlandı') && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-center truncate">
                            {dayTickets.filter(t => t.status === 'Tamamlandı').length} Biten
                          </span>
                        )}
                        {dayTickets.some(t => t.status === 'İşlemde') && (
                          <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-center truncate">
                            {dayTickets.filter(t => t.status === 'İşlemde').length} İşlemde
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              return days;
            })()}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Servis Durumları</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceStatsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceStatsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* License Info Footer */}
      {tenantInfo && (
        <div className="mt-8 flex justify-center">
          <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} className="text-emerald-500" />
            <span>Lisans Bitiş Tarihi: <strong>{tenantInfo.expirationDate ? new Date(tenantInfo.expirationDate).toLocaleDateString('tr-TR') : 'Sınırsız (Ömür Boyu)'}</strong></span>
            {tenantInfo.expirationDate && new Date(tenantInfo.expirationDate).getTime() < Date.now() + 15 * 24 * 60 * 60 * 1000 && (
               <span className="text-red-500 font-semibold ml-2">Lisans süreniz yakında dolacak!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};