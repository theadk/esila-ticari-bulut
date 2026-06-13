import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { ReminderNoteType } from '../types';
import { Calendar, Search, Filter, CheckCircle, Circle, Trash2, CalendarDays, TrendingUp, DollarSign, PlusCircle, X, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import { hasPermission } from '../lib/permissions';

export const Ajanda: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'ajanda', 'view');
  const canCreate = hasPermission(currentUser, 'ajanda', 'create');
  const canEdit = hasPermission(currentUser, 'ajanda', 'edit');
  const canDelete = hasPermission(currentUser, 'ajanda', 'delete');

  const { 
    reminderNotes, setReminderNotes, 
    transactions, setTransactions,
    cashTransactions, setCashTransactions,
    customers, setCustomers 
  } = store;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ReminderNoteType | 'Tümü'>('Tümü');
  
  // Default to today's date if empty for the summary panel calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Tümü' | 'Bekleyenler' | 'Tamamlananlar'>('Tümü');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState<{title: string, description: string, date: string, notificationTime: string, type: ReminderNoteType, amount: number | ''}>({
    title: '',
    description: '',
    date: todayStr,
    notificationTime: '',
    type: 'Genel',
    amount: ''
  });

  const { isListening, supported, listen, stop } = useSpeechRecognition();

  // Desktop Notification Permission & Checker
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    const checkNotifications = () => {
      if (!reminderNotes || !("Notification" in window) || Notification.permission !== "granted") return;
      
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
      
      let updatedNotes = false;
      const newNotes = reminderNotes.map(note => {
        if (!note.isCompleted && !note.notificationSent && note.date === currentDate && note.notificationTime === currentTime) {
          new Notification("Hatırlatma: " + note.title, {
            body: note.description || "Göz atmak için ajanda uygulamasına dönebilirsiniz.",
            icon: "/favicon.ico"
          });
          updatedNotes = true;
          return { ...note, notificationSent: true };
        }
        return note;
      });

      if (updatedNotes) {
        setReminderNotes(newNotes);
      }
    };

    const intervalId = setInterval(checkNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [reminderNotes, setReminderNotes]);

  const handleSpeechRecognition = () => {
    if (isListening) {
      stop();
    } else {
      listen((text) => {
        setNoteForm(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text }));
      });
    }
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
        date: noteForm.date,
        notificationTime: noteForm.notificationTime || undefined,
        amount: noteForm.amount ? Number(noteForm.amount) : undefined,
        isCompleted: false
    };
    setReminderNotes([...(reminderNotes || []), newNote]);
    setShowNoteModal(false);
    toast.success('Hatırlatma notu eklendi');
  };

  const filteredNotes = useMemo(() => {
    let result = reminderNotes || [];

    if (searchTerm) {
      result = result.filter(n => 
        (n.title && n.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (n.description && n.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== 'Tümü') {
      result = result.filter(n => n.type === selectedType);
    }

    if (selectedDate) {
      result = result.filter(n => n.date === selectedDate);
    }

    if (statusFilter === 'Bekleyenler') {
      result = result.filter(n => !n.isCompleted);
    } else if (statusFilter === 'Tamamlananlar') {
      result = result.filter(n => n.isCompleted);
    }

    // Sort by date (desc) and completed status
    return result.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
         return a.isCompleted ? 1 : -1;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [reminderNotes, searchTerm, selectedType, selectedDate, statusFilter]);

  const toggleComplete = (id: string, currentStatus: boolean) => {
    const noteToUpdate = reminderNotes?.find(n => n.id === id);
    if (!noteToUpdate) return;
    
    // If we are marking as COMPLETE, and it's a financial transaction with an amount
    if (!currentStatus && (noteToUpdate.type === 'Ödeme' || noteToUpdate.type === 'Tahsilat' || noteToUpdate.type === 'Banka') && noteToUpdate.amount) {
       const confirmPayment = window.confirm(`${noteToUpdate.title} notunu tamamlıyorsunuz. Kasa ve cariye işlensin mi?`);
       if (confirmPayment) {
           const isIncome = noteToUpdate.type === 'Tahsilat';
           const categoryName = isIncome ? 'Cari Tahsilat' : 'Cari Ödeme';
           
           let customerIdStr = '';
           // Extract customer from related ID (like invoice customer or directly if we had a customer field)
           if (noteToUpdate.relatedId && String(noteToUpdate.relatedId).startsWith('CUS-')) {
               customerIdStr = String(noteToUpdate.relatedId);
           } else {
               // Try to find if relatedId matches an eInvoice to get its customer
               // We don't have eInvoices in store here natively exported, but we can search transactions that have this relatedId
               const matchingTx = (transactions || []).find((t: any) => t.description?.includes(String(noteToUpdate.relatedId)));
               if (matchingTx) customerIdStr = matchingTx.customerId;
           }

           // Cash Transaction Update
           if (setCashTransactions) {
               const newTx = {
                   id: `CASH-${Date.now()}`,
                   date: new Date().toISOString().split('T')[0],
                   type: (isIncome ? 'Gelir' : 'Gider') as any,
                   category: categoryName,
                   amount: noteToUpdate.amount,
                   description: noteToUpdate.title + ' (Ajanda Ödemesi)',
                   customerId: customerIdStr || undefined
               };
               setCashTransactions([...(cashTransactions || []), newTx]);
           }

           // Customer Balance & Transaction Update
           if (customerIdStr && customers && setCustomers && transactions && setTransactions) {
               const txType = isIncome ? 'Tahsilat' : 'Ödeme';
               const txAmount = isIncome ? -noteToUpdate.amount : noteToUpdate.amount;
               
               const newCariTx = {
                   id: `TR-${Date.now()}`,
                   customerId: customerIdStr,
                   date: new Date().toISOString().split('T')[0],
                   type: txType as any,
                   amount: txAmount,
                   description: noteToUpdate.title + ' (Ajanda Kasa İşlemi)'
               };
               setTransactions([...transactions, newCariTx]);
               
               setCustomers(customers.map(c => 
                   c.id === customerIdStr ? { ...c, balance: c.balance + txAmount } : c
               ));
           }
           
           toast.success('Kasa ve Cari işlemleri başarıyla tamamlandı!');
       }
    }

    const updated = (reminderNotes || []).map(n => 
      n.id === id ? { ...n, isCompleted: !currentStatus } : n
    );
    setReminderNotes(updated);
    if (currentStatus) {
       toast.success('Durum: Bekliyor (Kasa işlemi geri ALINMADI, manuel düzeltin)');
    } else {
       toast.success('Durum: Tamamlandı');
    }
  };

  const deleteNote = (id: string) => {
    if(confirm('Bu notu silmek istediğinize emin misiniz?')) {
        setReminderNotes((reminderNotes || []).filter(n => n.id !== id));
        toast.success("Not silindi");
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
        case 'Teklif': return 'bg-blue-100 text-blue-800';
        case 'Ödeme': return 'bg-red-100 text-red-800';
        case 'Tahsilat': return 'bg-emerald-100 text-emerald-800';
        case 'Personel': return 'bg-purple-100 text-purple-800';
        case 'Sipariş': return 'bg-amber-100 text-amber-800';
        case 'Banka': return 'bg-emerald-100 text-emerald-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
        <CalendarDays size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Ajanda modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <CalendarDays className="text-emerald-600" />
           Ajanda & Hatırlatmalar
        </h2>
        {canCreate && (
          <button 
             onClick={() => {
               setNoteForm({ title: '', description: '', date: todayStr, notificationTime: '', type: 'Genel', amount: '' });
               setShowNoteModal(true);
             }}
             className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
             <PlusCircle size={20} />
             <span className="hidden sm:inline">Yeni Hatırlatma</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="w-full md:w-48 relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
           <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
           >
              <option value="Tümü">Tüm Kategoriler</option>
              <option value="Teklif">Verilen Teklifler</option>
              <option value="Tahsilat">Beklenen Tahsilatlar</option>
              <option value="Ödeme">Yaklaşan Ödemeler</option>
              <option value="Personel">Personel İzin/İstek</option>
              <option value="Sipariş">Tedarikçi / Sipariş</option>
              <option value="Banka">Banka İşlemleri</option>
              <option value="Genel">Genel Not</option>
           </select>
        </div>

        <div className="w-full md:w-48">
           <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
           />
        </div>

        <div className="w-full md:w-48 relative">
           <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
           >
              <option value="Tümü">Tüm Durumlar</option>
              <option value="Bekleyenler">Bekleyenler</option>
              <option value="Tamamlananlar">Tamamlananlar</option>
           </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredNotes.length === 0 ? (
             <div className="p-12 pl-12 flex flex-col items-center justify-center text-gray-400">
               <Calendar size={48} className="mb-4 opacity-50 text-gray-300" />
               <p className="text-lg">Kayıtlı hatırlatma notu bulunamadı.</p>
             </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                     Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Kategori
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Başlık / Açıklama
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Sil
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotes.map(note => (
                  <tr key={note.id} className={`${note.isCompleted ? 'bg-gray-50 opacity-70' : 'hover:bg-slate-50 transition-colors'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <button onClick={() => toggleComplete(note.id, note.isCompleted)} className="text-gray-400 hover:text-emerald-500 transition-colors focus:outline-none">
                         {note.isCompleted ? <CheckCircle className="text-emerald-500" size={24} /> : <Circle size={24} />}
                       </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeStyle(note.type)}`}>
                          {note.type}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className={`font-medium ${note.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {note.title}
                          {note.amount && (
                             <span className="ml-2 font-bold text-sm bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200">
                                {(note.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                             </span>
                          )}
                       </div>
                       {note.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">{note.description}</div>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                           {new Date(note.date).toLocaleDateString('tr-TR')}
                           {note.notificationTime && <span className="ml-2 text-gray-500">[{note.notificationTime}]</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       {canDelete && (
                         <button onClick={() => deleteNote(note.id)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <Trash2 size={20} />
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Hatırlatma Notaları Ekleme Modalı */}
      {showNoteModal && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowNoteModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                     Yeni Hatırlatma Ekle
                  </h3>
                  <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-red-500 transition-colors bg-white p-1 rounded-md border border-gray-200">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-4 space-y-4">
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input type="date" className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500" value={noteForm.date} onChange={e => setNoteForm({...noteForm, date: e.target.value})} />
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bildirim Saati (Opsiyonel)</label>
                        <input type="time" className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500" value={noteForm.notificationTime} onChange={e => setNoteForm({...noteForm, notificationTime: e.target.value})} />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                     <input 
                       type="text" 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" 
                       placeholder="Örn: 200.000 TL Kredi Ödemesi"
                       value={noteForm.title}
                       onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                       autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                     <select 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                       value={noteForm.type}
                       onChange={e => {
                           const newType = e.target.value as any;
                           setNoteForm((prev) => {
                               let newDate = prev.date;
                               if ((newType === 'Tahsilat' || newType === 'Ödeme') && prev.date === todayStr) {
                                   const d = new Date();
                                   d.setDate(d.getDate() + 7);
                                   newDate = d.toISOString().split('T')[0];
                               }
                               return { ...prev, type: newType, date: newDate };
                           });
                       }}
                     >
                        <option value="Teklif">Verilen Teklifler</option>
                        <option value="Tahsilat">Beklenen Tahsilatlar</option>
                        <option value="Ödeme">Yaklaşan Ödemeler</option>
                        <option value="Personel">Personel İzin/İstek</option>
                        <option value="Sipariş">Tedarikçi / Sipariş</option>
                        <option value="Banka">Banka İşlemleri</option>
                        <option value="Genel">Genel Not</option>
                     </select>
                  </div>
                  {(noteForm.type === 'Tahsilat' || noteForm.type === 'Ödeme') && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL)</label>
                        <input 
                           type="number" 
                           className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" 
                           placeholder="Örn: 5000"
                           value={noteForm.amount || ''}
                           onChange={e => setNoteForm({...noteForm, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                        />
                     </div>
                  )}
                  <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="block text-sm font-medium text-gray-700">Detay / Açıklama</label>
                       {supported && (
                         <button
                           type="button"
                           onClick={handleSpeechRecognition}
                           className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                             isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           }`}
                           title={isListening ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                         >
                           {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                         </button>
                       )}
                     </div>
                     <textarea 
                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[80px]" 
                       placeholder="İsteğe bağlı detay..."
                       value={noteForm.description}
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
