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
  ChevronRight,
  ShoppingCart,
  Receipt,
  Briefcase,
  UserCheck,
  Wallet,
  FileText,
  PlusCircle,
  Settings,
  X,
  CreditCard,
  Edit3,
  Calendar,
  Mic,
  MicOff,
  Activity
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
import { Product, OrderStatus } from '../types';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import toast from 'react-hot-toast';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';

const DEFAULT_STATS_ORDER = [
  'stat_monthlySales', 
  'stat_dailyIncome', 
  'stat_pendingOrders', 
  'stat_pendingProposals',
  'stat_activeCustomers', 
  'stat_criticalStock', 
  'stat_activePersonnel', 
  'stat_newJobApps',
  'stat_pendingLeaves'
];

const DEFAULT_CHARTS_ORDER = [
  'chart_weeklySales',
  'chart_collections',
  'chart_calendar',
  'chart_serviceStatus'
];

export const Dashboard: React.FC<{ setActivePage?: (page: string) => void }> = ({ setActivePage }) => {
  const { customers, transactions, serviceTickets, settings, setServiceTickets, cashTransactions, personnel, jobApplications, orders, eInvoices, proposals, reminderNotes, setReminderNotes } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<import('../lib/currency').ExchangeRates | null>(null);

  useEffect(() => {
    import('../lib/currency').then(module => {
      module.fetchExchangeRates().then(rates => setExchangeRates(rates));
    });
  }, []);

  const [isSendingMaintenanceReminders, setIsSendingMaintenanceReminders] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNoteDate, setSelectedNoteDate] = useState<string>('');
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    type: 'Genel' as import('../types').ReminderNoteType
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [statsOrder, setStatsOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('esila_dashboard_stats');
    return saved ? JSON.parse(saved) : DEFAULT_STATS_ORDER;
  });

  const [chartsOrder, setChartsOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('esila_dashboard_charts');
    return saved ? JSON.parse(saved) : DEFAULT_CHARTS_ORDER;
  });

  const { isListening, supported, listen, stop } = useSpeechRecognition();
  const [activeSpeechField, setActiveSpeechField] = useState<string | null>(null);

  const startListening = (field: string, updateFn: (text: string) => void) => {
    if (isListening && activeSpeechField === field) {
      stop();
      setActiveSpeechField(null);
    } else {
      if (isListening) stop();
      setActiveSpeechField(field);
      listen((text) => {
        updateFn(text);
      });
    }
  };

  const handleOpenNoteModal = (dateStr: string) => {
    setSelectedNoteDate(dateStr);
    setNoteForm({ title: '', description: '', type: 'Genel' });
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!noteForm.title) {
        toast.error('Lütfen bir başlık girin');
        return;
    }
    const newNote = {
        id: `NOTE-${Date.now()}`,
        title: noteForm.title,
        description: noteForm.description,
        type: noteForm.type,
        date: selectedNoteDate,
        isCompleted: false
    };
    setReminderNotes([...(reminderNotes || []), newNote]);
    setShowNoteModal(false);
    toast.success('Hatırlatma notu eklendi');
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Notu silmek istediğinize emin misiniz?')) {
        setReminderNotes((reminderNotes || []).filter(n => n.id !== id));
        toast.success("Not silindi");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndStats = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStatsOrder((items) => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('esila_dashboard_stats', JSON.stringify(newArray));
        return newArray;
      });
    }
  };

  const handleDragEndCharts = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setChartsOrder((items) => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('esila_dashboard_charts', JSON.stringify(newArray));
        return newArray;
      });
    }
  };

  useEffect(() => {
    api.getProducts()
      .then(fetchedProducts => setProducts(fetchedProducts))
      .catch(err => console.error("Error fetching products", err));

    fetch('/api/tenant-info', {
      headers: {
        'x-tenant-id': sessionStorage.getItem('esila_tenant_id') || ''
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

    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    
    // Daily Cash
    const dateString = now.toISOString().split('T')[0];
    const dailyIncome = cashTransactions
      .filter(c => c.type === 'Gelir' && c.date.startsWith(dateString))
      .reduce((sum, c) => sum + c.amount, 0);

    const activePersonnel = personnel.filter(p => !p.employmentStatus || p.employmentStatus === 'Aktif').length;
    const newJobApps = jobApplications.filter(j => j.status === 'Yeni').length;
    const pendingProposals = proposals.filter(p => p.status === 'Bekliyor').length;
    const pendingLeaves = personnel.reduce((sum, p) => sum + (p.leaveRecords?.filter(l => l.status === 'Bekliyor').length || 0), 0);

    return { 
      monthlySales, 
      activeCustomers, 
      totalProducts, 
      criticalStock,
      pendingOrders,
      dailyIncome,
      activePersonnel,
      newJobApps,
      pendingProposals,
      pendingLeaves
    };
  }, [transactions, customers, products, orders, cashTransactions, personnel, jobApplications, proposals]);

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

  const renderStatCard = (id: string) => {
    switch(id) {
      case 'stat_monthlySales': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aylık Satış (Fatura)</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {stats.monthlySales.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_dailyIncome': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bugünkü Kasa Geliri</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                 {stats.dailyIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_pendingOrders': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bekleyen Siparişler</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_pendingProposals': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bekleyen Teklifler</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.pendingProposals}</p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_pendingLeaves': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bekleyen İzinler</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.pendingLeaves || 0}</p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_activeCustomers': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-pink-100 text-pink-600 rounded-full">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kayıtlı Cariler</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.activeCustomers}</p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_criticalStock': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kritik Stok Uyarıları</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.criticalStock}</p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_activePersonnel': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-cyan-100 text-cyan-600 rounded-full">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif Personeller</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.activePersonnel}</p>
            </div>
          </div>
        </SortableItem>
      );
      case 'stat_newJobApps': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 flex items-center space-x-4">
            <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-full">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Yeni İş Başvuruları</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.newJobApps}</p>
            </div>
          </div>
        </SortableItem>
      );
      default: return null;
    }
  };

  const renderChartCard = (id: string) => {
    switch(id) {
      case 'chart_weeklySales': return (
        <SortableItem key={id} id={id} className="lg:col-span-2" isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Haftalık Satış Grafiği (Son 7 Gün)</h3>
            <div className="flex-1 min-h-[320px]">
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
        </SortableItem>
      );
      case 'chart_collections': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Tahsilat Grafiği (Son 7 Gün)</h3>
            <div className="flex-1 min-h-[320px]">
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
        </SortableItem>
      );
      case 'chart_calendar': return (
        <SortableItem key={id} id={id} className="lg:col-span-2" isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Ajanda & Hatırlatmalar</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="p-1 hover:bg-gray-100 rounded-full relative z-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <h4 className="font-medium text-gray-700 w-32 text-center">
                  {calendarDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                </h4>
                <button 
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="p-1 hover:bg-gray-100 rounded-full relative z-10"
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
                  days.push(<div key={`empty-${i}`} className="bg-transparent rounded-lg p-2 min-h-24"></div>);
                }
                for (let i = 1; i <= daysInMonth; i++) {
                  const currentDateObj = new Date(year, month, i);
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                  const dayTickets = serviceTickets.filter(t => t.dateCreated?.startsWith(dateStr));
                  const dayNotes = (reminderNotes || []).filter(n => n.date === dateStr);
                  
                  days.push(
                    <div 
                      key={`day-${i}`} 
                      onClick={() => handleOpenNoteModal(dateStr)}
                      className="border border-gray-100 rounded-lg p-1 sm:p-2 min-h-24 flex flex-col items-center justify-start hover:border-emerald-300 transition-colors bg-gray-50/50 cursor-pointer relative group overflow-y-auto"
                    >
                      <span className={`text-xs font-medium mb-1 ${`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` === dateStr ? 'bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-500'}`}>
                        {i}
                      </span>
                      
                      {/* Servis Formları */}
                      {dayTickets.length > 0 && (
                        <div className="flex flex-col gap-1 w-full mt-1">
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-center truncate" title={`${dayTickets.length} Servis Kaydı`}>
                            {dayTickets.length} Servis
                          </span>
                        </div>
                      )}
                      
                      {/* Hatırlatma Notları */}
                      {dayNotes.map(n => (
                         <div key={n.id} className="w-full mt-1 flex justify-between items-start bg-indigo-50 border border-indigo-100 rounded p-1" title={n.description}>
                            <div className="flex flex-col w-full overflow-hidden">
                               <span className="text-[9px] font-bold text-indigo-700 truncate">{n.type}</span>
                               <span className="text-[10px] text-gray-700 truncate">{n.title}</span>
                            </div>
                            <button onClick={(e) => deleteNote(e, n.id)} className="text-gray-400 hover:text-red-500 ml-1">
                               <X size={10} />
                            </button>
                         </div>
                      ))}

                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-emerald-500 bg-white rounded-full shadow-sm p-0.5">
                         <PlusCircle size={14} />
                      </div>
                    </div>
                  );
                }
                return days;
              })()}
            </div>
          </div>
        </SortableItem>
      );
      case 'chart_serviceStatus': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Servis Durumları</h3>
            <div className="flex-1 min-h-[320px]">
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
        </SortableItem>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
          <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Yönetim Paneli</h2>
          <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
          
          <div className="flex bg-white rounded-lg shadow-sm border border-emerald-500 overflow-hidden w-full sm:w-auto ring-1 ring-emerald-500/20">
             <button onClick={() => {
                if (setActivePage) setActivePage('efatura');
             }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-200 transition-colors group whitespace-nowrap">
                <FileText size={16} className="text-purple-600 group-hover:text-purple-700" />
                <span className="hidden sm:inline">Yeni</span> Fatura
             </button>
             <button onClick={() => {
                if (setActivePage) setActivePage('cariler');
                setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-cari')), 100);
             }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-200 transition-colors group whitespace-nowrap">
                <Users size={16} className="text-blue-600 group-hover:text-blue-700" />
                <span className="hidden sm:inline">Yeni</span> Cari
             </button>
             <button onClick={() => {
                if (setActivePage) setActivePage('hizlisatis');
             }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors group whitespace-nowrap bg-emerald-50/50">
                <ShoppingCart size={16} className="text-emerald-600 group-hover:text-emerald-700" />
                Hızlı Satış
             </button>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${isEditMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          {isEditMode ? <><X size={18} /> Düzenlemeyi Bitir</> : <><Edit3 size={18} /> Paneli Düzenle</>}
        </button>
      </div>
      
      {/* Quick Actions Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-emerald-100 p-4 sm:p-6 ring-1 ring-emerald-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <PlusCircle size={18} />
              </div>
              <h3 className="text-base font-semibold text-gray-800 tracking-tight">Hızlı İşlemler</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button type="button" onClick={() => setActivePage && setActivePage('hizlisatis')} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100 cursor-pointer">
                    <ShoppingCart size={24} className="mb-2" />
                    <span className="text-sm font-medium text-center">Hızlı Satış</span>
                </button>
                <button type="button" onClick={() => setActivePage && setActivePage('urunler')} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer">
                    <PlusCircle size={24} className="mb-2" />
                    <span className="text-sm font-medium text-center">Ürün Ekle</span>
                </button>
                <button type="button" onClick={() => { setActivePage && setActivePage('cariler'); setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-cari')), 100); }} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100 cursor-pointer">
                    <Users size={24} className="mb-2" />
                    <span className="text-sm font-medium text-center">Yeni Cari</span>
                </button>
                <button type="button" onClick={() => setActivePage && setActivePage('kasa')} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-100 cursor-pointer">
                    <CreditCard size={24} className="mb-2" />
                    <span className="text-sm font-medium text-center">Tahsilat Gir</span>
                </button>
                <button type="button" onClick={() => setActivePage && setActivePage('efatura')} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100 cursor-pointer">
                    <FileText size={24} className="mb-2" />
                    <span className="text-sm font-medium text-center">Yeni Fatura</span>
                </button>
                <button type="button" onClick={() => setActivePage && setActivePage('ariza')} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors border border-orange-100 cursor-pointer">
                    <Wrench size={24} className="mb-2" />
                    <span className="text-sm font-medium text-center">Servis Aç</span>
                </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6 ring-1 ring-blue-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Activity size={18} />
              </div>
              <h3 className="text-base font-semibold text-gray-800 tracking-tight">Güncel Kurlar</h3>
            </div>
            {exchangeRates ? (
               <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center p-2 rounded bg-gray-50 border border-gray-100">
                    <span className="font-bold text-gray-700 flex items-center gap-2"><span className="text-lg">🇺🇸</span> USD</span>
                    <span className="font-mono font-medium text-gray-900">{exchangeRates.USD.toLocaleString('tr-TR', { minimumFractionDigits: 4 })} ₺</span>
                 </div>
                 <div className="flex justify-between items-center p-2 rounded bg-gray-50 border border-gray-100">
                    <span className="font-bold text-gray-700 flex items-center gap-2"><span className="text-lg">🇪🇺</span> EUR</span>
                    <span className="font-mono font-medium text-gray-900">{exchangeRates.EUR.toLocaleString('tr-TR', { minimumFractionDigits: 4 })} ₺</span>
                 </div>
                 <div className="flex justify-between items-center p-2 rounded bg-gray-50 border border-gray-100">
                    <span className="font-bold text-gray-700 flex items-center gap-2"><span className="text-lg">🇬🇧</span> GBP</span>
                    <span className="font-mono font-medium text-gray-900">{exchangeRates.GBP.toLocaleString('tr-TR', { minimumFractionDigits: 4 })} ₺</span>
                 </div>
                 <div className="text-xs text-gray-400 text-center mt-2 border-t pt-2 border-gray-100">
                    TCMB Döviz Satış Kurları
                 </div>
               </div>
            ) : (
               <div className="flex items-center justify-center h-32 text-gray-400 text-sm italic">
                  Yükleniyor...
               </div>
            )}
          </div>
      </div>

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

      {/* Stats Cards Dashboard Context */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndStats}>
        <SortableContext items={statsOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsOrder.map(id => renderStatCard(id))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Charts Context */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCharts}>
        <SortableContext items={chartsOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {chartsOrder.map(id => renderChartCard(id))}
          </div>
        </SortableContext>
      </DndContext>

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

      {/* Hatırlatma Notaları Ekleme Modalı */}
      {showNoteModal && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowNoteModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                     Yen Hatırlatma Ekle
                  </h3>
                  <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-red-500 transition-colors bg-white p-1 rounded-md border border-gray-200">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-4 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                     <input type="date" className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" value={selectedNoteDate || ""} disabled />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                     <input 
                       type="text" 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" 
                       placeholder="Örn: 200.000 TL Kredi Ödemesi"
                       value={noteForm.title || ""}
                       onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                       autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                     <select 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                       value={noteForm.type || ""}
                       onChange={e => setNoteForm({...noteForm, type: e.target.value as any})}
                     >
                        <option value="Teklif">Verilen Teklifler</option>
                        <option value="Ödeme">Yaklaşan Ödemeler</option>
                        <option value="Personel">Personel İzin/İstek</option>
                        <option value="Sipariş">Tedarikçi / Sipariş</option>
                        <option value="Banka">Banka İşlemleri</option>
                        <option value="Genel">Genel Not</option>
                     </select>
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="block text-sm font-medium text-gray-700">Detay / Açıklama</label>
                       {supported && (
                         <button
                           type="button"
                           onClick={() => startListening('noteForm', (text) => setNoteForm(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text })))}
                           className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                             isListening && activeSpeechField === 'noteForm' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           }`}
                           title={isListening && activeSpeechField === 'noteForm' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                         >
                           {isListening && activeSpeechField === 'noteForm' ? <MicOff size={16} /> : <Mic size={16} />}
                         </button>
                       )}
                     </div>
                     <textarea 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
                       placeholder="İsteğe bağlı detay..."
                       value={noteForm.description || ""}
                       onChange={e => setNoteForm({...noteForm, description: e.target.value})}
                     ></textarea>
                  </div>
               </div>
               <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                  <button 
                     onClick={() => setShowNoteModal(false)}
                     className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                     İptal
                  </button>
                  <button 
                     onClick={handleSaveNote}
                     className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                  >
                     Kaydet
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};