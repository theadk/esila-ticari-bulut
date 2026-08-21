import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAppStore } from '../lib/store';
import { Calendar, Search, Filter, CheckCircle2, Circle, AlertCircle, X, Download, FileText } from 'lucide-react';

export default function Taksitler() {
  const store = useAppStore();
  const { customers, setCustomers } = store;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [postponeForm, setPostponeForm] = useState<{ customerId: string, installmentId: string, oldDate: string, newDate: string, notifyCustomer: boolean, description: string }>({ customerId: '', installmentId: '', oldDate: '', newDate: '', notifyCustomer: true, description: '' });
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [interestForm, setInterestForm] = useState({ customerId: '', installmentId: '', baseAmount: 0, daysOverdue: 0, ratePerMonth: 5, interestAmount: 0, newTotalAmount: 0, newDueDate: new Date().toISOString().split('T')[0], description: '' });

  const allInstallments = useMemo(() => {
    let list: any[] = [];
    if (!customers) return list;
    
    customers.forEach(customer => {
      if (customer.installments && Array.isArray(customer.installments)) {
        customer.installments.forEach(inst => {
          list.push({
            ...inst,
            customerId: customer.id,
            customerName: customer.name || customer.companyName,
          });
        });
      }
    });
    
    // Sort by due date (closest first)
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [customers]);

  const filteredInstallments = useMemo(() => {
    return allInstallments.filter(inst => {
      // Search filter
      const matchesSearch = 
        inst.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Status filter
      if (statusFilter === 'paid' && !inst.isPaid) return false;
      if (statusFilter === 'unpaid' && inst.isPaid) return false;
      if (statusFilter === 'overdue') {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (inst.isPaid || new Date(inst.dueDate) >= today) return false;
      }
      
      // Date Range filter
      if (startDate) {
        if (new Date(inst.dueDate) < new Date(startDate)) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(inst.dueDate) > end) return false;
      }
      
      return true;
    });
  }, [allInstallments, searchTerm, statusFilter, startDate, endDate]);

  const toggleInstallmentStatus = (customerId: string, installmentId: string) => {
    const updatedCustomers = customers.map(c => {
      if (c.id === customerId && c.installments) {
        return {
          ...c,
          installments: c.installments.map(inst => {
            if (inst.id === installmentId) {
              const newIsPaid = !inst.isPaid;
              return {
                ...inst,
                isPaid: newIsPaid,
                paidDate: newIsPaid ? new Date().toISOString() : undefined
              };
            }
            return inst;
          })
        };
      }
      return c;
    });
    
    setCustomers(updatedCustomers);
  };

  
  
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add Turkish font support
    doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    
    doc.setFontSize(18);
    doc.text('Taksit Analiz Raporu', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
    if (startDate || endDate) {
      doc.text(`Filtre: ${startDate ? new Date(startDate).toLocaleDateString('tr-TR') : 'Baslangic'} - ${endDate ? new Date(endDate).toLocaleDateString('tr-TR') : 'Bitis'}`, 14, 36);
    }
    
    // Calculate Totals for the current filter
    const totalCollected = filteredInstallments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    const totalPending = filteredInstallments.filter(i => !i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const totalOverdue = filteredInstallments.filter(i => !i.isPaid && new Date(i.dueDate) < today).reduce((sum, i) => sum + i.amount, 0);
    
    doc.setTextColor(0);
    doc.text(`Tahsil Edilen Tutar: ${totalCollected.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 14, 46);
    doc.text(`Bekleyen Tutar: ${totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 14, 52);
    doc.setTextColor(255, 0, 0);
    doc.text(`Vadesi Geciken Tutar: ${totalOverdue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 14, 58);
    doc.setTextColor(0);

    const tableColumn = ["Musteri", "Aciklama", "Vade Tarihi", "Tutar (TL)", "Durum"];
    const tableRows: any[] = [];
    
    filteredInstallments.forEach(inst => {
      const isOverdue = !inst.isPaid && new Date(inst.dueDate) < today;
      const statusStr = inst.isPaid ? 'Odendi' : (isOverdue ? 'Gecikti' : 'Bekliyor');
      const installmentData = [
        inst.customerName || '',
        inst.description || '',
        new Date(inst.dueDate).toLocaleDateString('tr-TR'),
        Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        statusStr
      ];
      tableRows.push(installmentData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      styles: { font: 'Roboto', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });
    
    doc.save('taksit-analiz-raporu.pdf');
  };

  
  const handleApplyInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const c = customers.find(x => x.id === interestForm.customerId);
    if (!c) return;

    let changedInstallment = null;
    let updatedInstallments = (c.installments || []).map(inst => {
        if (inst.id === interestForm.installmentId) {
            changedInstallment = { 
                ...inst, 
                amount: interestForm.newTotalAmount,
                dueDate: interestForm.newDueDate,
                description: `${inst.description} (+ %${interestForm.ratePerMonth} Gecikme Faizi)`
            };
            return changedInstallment;
        }
        return inst;
    });
    
    updatedInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    const updatedCustomers = customers.map(cust => {
        if (cust.id === interestForm.customerId) {
            return { ...cust, installments: updatedInstallments };
        }
        return cust;
    });
    
    setCustomers(updatedCustomers);
    
    // Add transaction for interest
    if (interestForm.interestAmount > 0 && changedInstallment) {
        const newTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            customerId: interestForm.customerId,
            date: new Date().toISOString().split('T')[0],
            type: 'Borçlandırma',
            amount: interestForm.interestAmount,
            description: `Gecikme Faizi - ${(changedInstallment as any).description}`
        };
        store.setTransactions((prev: any) => [...(prev || []), newTransaction]);
    }

    setIsInterestModalOpen(false);
  };

  const handlePostponeInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const c = customers.find(x => x.id === postponeForm.customerId);
    if (!c) return;

    let updatedInstallments = (c.installments || []).map(inst => {
        if (inst.id === postponeForm.installmentId) {
            return { ...inst, dueDate: postponeForm.newDate };
        }
        return inst;
    });
    
    updatedInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    const updatedCustomers = customers.map(cust => {
        if (cust.id === postponeForm.customerId) {
            return { ...cust, installments: updatedInstallments };
        }
        return cust;
    });
    
    setCustomers(updatedCustomers);
    setIsPostponeModalOpen(false);

    if (postponeForm.notifyCustomer && c.email) {
      let html = `
        <h2 style="color: #ea580c; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Taksit Erteleme Bilgilendirmesi</h2>
        <p style="margin-bottom: 24px;">Sayın <b>${c.name || c.companyName}</b>,<br>Aşağıdaki taksitinizin vade tarihi talebiniz/onayınız doğrultusunda ötelenmiştir.</p>
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #ffedd5; color: #9a3412; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Açıklama</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Eski Vade</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Yeni Vade</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
                <tr style="font-size: 14px;">
                    <td style="padding: 12px 16px; color: #111827; font-weight: 500;">${postponeForm.description || '-'}</td>
                    <td style="padding: 12px 16px; color: #6b7280; text-decoration: line-through;">${new Date(postponeForm.oldDate).toLocaleDateString('tr-TR')}</td>
                    <td style="padding: 12px 16px; color: #ea580c; font-weight: 700;">${new Date(postponeForm.newDate).toLocaleDateString('tr-TR')}</td>
                </tr>
            </tbody>
        </table>
        </div>
        <p style="margin-bottom: 0;">İyi çalışmalar dileriz.</p>
      `;

      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          to: c.email,
          subject: 'Taksit Erteleme Bilgilendirmesi',
          html: html
        })
      }).catch(console.error);
    }
  };

  const totalUnpaid = allInstallments.filter(i => !i.isPaid).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalOverdue = allInstallments.filter(i => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return !i.isPaid && new Date(i.dueDate) < today;
  }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Taksit Takibi</h3>
          <p className="text-gray-500 text-sm mt-1">Müşterilerinize ait taksit planlarını yönetin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <p className="text-gray-500 font-medium mb-1">Toplam Bekleyen Taksit Alacağı</p>
          <h3 className="text-3xl font-bold text-indigo-600">
            {totalUnpaid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col justify-center">
          <p className="text-red-500 font-medium mb-1">Gecikmiş Taksit Alacağı</p>
          <h3 className="text-3xl font-bold text-red-600">
            {totalOverdue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari adı veya açıklama ile ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap">Tarih:</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-auto"
              />
            </div>
            
            <button 
              onClick={exportPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={16} />
              <span>PDF Rapor Al</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={18} className="text-gray-400" />
            <select
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Tümü</option>
              <option value="unpaid">Bekleyenler</option>
              <option value="overdue">Gecikenler</option>
              <option value="paid">Ödenenler</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Müşteri</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Açıklama</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Vade Tarihi</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Tutar</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Durum</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInstallments.length > 0 ? (
                filteredInstallments.map((inst, index) => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const dueDate = new Date(inst.dueDate);
                  const isOverdue = !inst.isPaid && dueDate < today;

                  return (
                    <tr key={`${inst.customerId}-${inst.id}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{inst.customerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{inst.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className={isOverdue ? 'text-red-400' : 'text-gray-400'} />
                          <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {dueDate.toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900">
                          {Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {inst.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                            <CheckCircle2 size={14} />
                            Ödendi
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            <AlertCircle size={14} />
                            Gecikti
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                            <Circle size={14} />
                            Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                            <button
                            onClick={() => toggleInstallmentStatus(inst.customerId, inst.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                inst.isPaid 
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            >
                            {inst.isPaid ? 'Geri Al' : 'Tahsil Et'}
                            </button>
                            {!inst.isPaid && (<>
                                
                                <button
                                    onClick={() => {
                                        setPostponeForm({
                                            customerId: inst.customerId,
                                            installmentId: inst.id,
                                            oldDate: inst.dueDate,
                                            newDate: inst.dueDate,
                                            notifyCustomer: true,
                                            description: inst.description
                                        });
                                        setIsPostponeModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-orange-50 text-orange-600 hover:bg-orange-100"
                                >
                                    Ertele
                                </button>
                                {isOverdue && (
                                    <button
                                        onClick={() => {
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const due = new Date(inst.dueDate);
                                            due.setHours(0,0,0,0);
                                            const days = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24)));
                                            
                                            const rate = 5; 
                                            const interest = Number(((inst.amount * (rate / 30) * days) / 100).toFixed(2));
                                            const nextMonth = new Date();
                                            nextMonth.setMonth(nextMonth.getMonth() + 1);

                                            setInterestForm({
                                                customerId: inst.customerId,
                                                installmentId: inst.id,
                                                baseAmount: inst.amount,
                                                daysOverdue: days,
                                                ratePerMonth: rate,
                                                interestAmount: interest,
                                                newTotalAmount: inst.amount + interest,
                                                newDueDate: nextMonth.toISOString().split('T')[0],
                                                description: inst.description
                                            });
                                            setIsInterestModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                                    >
                                        Yapılandır
                                    </button>
                                )}</>

                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Kriterlere uygun taksit bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    
      
      {/* Taksit Gecikme Faizi / Yapılandırma Modal */}
      {isInterestModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Gecikme Faizi & Yapılandırma
              </h3>
              <button type="button" onClick={() => setIsInterestModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleApplyInterest} className="p-4 sm:p-6 space-y-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                <p className="text-sm text-red-800">
                  Bu taksit <strong>{interestForm.daysOverdue} gün</strong> gecikmiş durumda. 
                  Otomatik faiz hesaplaması yaparak yeni bir ödeme tarihi belirleyebilirsiniz.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ana Para</label>
                  <input 
                    type="text"
                    value={interestForm.baseAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Faiz Oranı (%)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={interestForm.ratePerMonth}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      const interest = Number(((interestForm.baseAmount * (rate / 30) * interestForm.daysOverdue) / 100).toFixed(2));
                      setInterestForm({
                        ...interestForm, 
                        ratePerMonth: rate,
                        interestAmount: interest,
                        newTotalAmount: interestForm.baseAmount + interest
                      });
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hesaplanan Faiz</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestForm.interestAmount}
                      onChange={(e) => {
                        const interest = Number(e.target.value);
                        setInterestForm({
                          ...interestForm,
                          interestAmount: interest,
                          newTotalAmount: interestForm.baseAmount + interest
                        });
                      }}
                      className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50/30 text-red-700 focus:ring-red-500 focus:border-red-500"
                    />
                    <span className="absolute right-3 top-2.5 text-red-600 font-medium">₺</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Toplam Tutar</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      value={interestForm.newTotalAmount}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold text-gray-900"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-600 font-bold">₺</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Vade Tarihi</label>
                <input 
                  type="date"
                  value={interestForm.newDueDate}
                  onChange={(e) => setInterestForm({...interestForm, newDueDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button 
                  type="button"
                  onClick={() => setIsInterestModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Faizle Yapılandır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Taksit Ertele Modal */}
      {isPostponeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Calendar className="text-orange-600" size={20} />
                Taksit Ertele (Ötele)
              </h3>
              <button type="button" onClick={() => setIsPostponeModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePostponeInstallment} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Vade Tarihi</label>
                <input 
                  type="date"
                  value={postponeForm.oldDate.split('T')[0]}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Vade Tarihi</label>
                <input 
                  type="date"
                  value={postponeForm.newDate.split('T')[0]}
                  onChange={(e) => setPostponeForm({...postponeForm, newDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-orange-50/10"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postponeForm.notifyCustomer}
                    onChange={(e) => setPostponeForm({...postponeForm, notifyCustomer: e.target.checked})}
                    className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm text-gray-700">Ertelemeyi müşteriye e-posta ile bildir</span>
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button 
                  type="button"
                  onClick={() => setIsPostponeModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Ertele
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
}
