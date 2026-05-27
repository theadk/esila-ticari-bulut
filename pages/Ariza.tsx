import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Wrench, Settings, User, FileText, ChevronRight, Printer } from 'lucide-react';
import { ServiceTicket, ServiceTicketStatus, ServiceMaterial, Customer, Product, Personnel, CustomerTransaction, CashTransaction } from '../types';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';

const INITIAL_FORM: Partial<ServiceTicket> = {
  customerId: '',
  deviceType: '',
  serialNumber: '',
  issueDescription: '',
  personnelId: '',
  materialsUsed: [],
  laborFee: 0,
  taxRate: 20
};

export const Ariza: React.FC = () => {
  const store = useAppStore();
  const serviceTickets = store.serviceTickets;
  const customers = store.customers;
  const products = store.products;
  const personnel = store.personnel;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'maintenance'>('all');
  
  const [formData, setFormData] = useState<Partial<ServiceTicket>>(INITIAL_FORM);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);

  // Detail / Edits
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [isPaid, setIsPaid] = useState(true);
  const [maintenancePeriod, setMaintenancePeriod] = useState<number | ''>('');

  useEffect(() => {
    // Automatically schedule and send follow-up maintenance notifications
    const dueMaintenance = serviceTickets.filter(ticket => {
      if (ticket.status === 'Tamamlandı' && ticket.nextMaintenanceDate && !ticket.maintenanceReminderSent) {
        const nextDate = new Date(ticket.nextMaintenanceDate).getTime();
        const now = Date.now();
        return nextDate <= now; // if due or past due
      }
      return false;
    });

    if (dueMaintenance.length > 0) {
      let updatedTickets = [...serviceTickets];
      let hasUpdates = false;

      const templateRaw = store.settings.email_template_maintenance || defaultTemplates.maintenance_reminder;

      Promise.all(dueMaintenance.map(async (ticket) => {
        const customer = customers.find(c => String(c.id) === String(ticket.customerId));
        if (!customer || !customer.email) return;

        const body = parseEmailTemplate(templateRaw, {
          MUSTERI_ADI: customer.companyName || customer.name || '',
          CIHAZ: ticket.deviceType,
          FIRMA_ADI: store.settings.companyName || '',
          FIRMA_TELEFON: store.settings.phone || '',
          FIRMA_MAIL: store.settings.email || '',
          FIRMA_ADRES: store.settings.address || '',
          FIRMA_VERGI_DAIRESI: store.settings.taxOffice || '',
          FIRMA_VKN: store.settings.taxNumber || '',
          TARIH: new Date(ticket.dateCompleted || ticket.dateCreated).toLocaleDateString('tr-TR')
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
            const idx = updatedTickets.findIndex(t => t.id === ticket.id);
            if (idx > -1) {
              updatedTickets[idx] = { ...updatedTickets[idx], maintenanceReminderSent: true };
              hasUpdates = true;
            }
          }
        } catch (err) {
          console.error(err);
        }
      })).then(() => {
        if (hasUpdates) {
          store.setServiceTickets(updatedTickets);
          toast.success(`${dueMaintenance.length} adet otomatik bakım hatırlatma e-postası gönderildi`);
        }
      });
    }
  }, [serviceTickets, customers, store]);

  const filteredTickets = serviceTickets.filter(ticket => {
    const searchMatch = ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    if (activeTab === 'maintenance') {
      return !!ticket.maintenancePeriodMonths;
    }
    
    return true;
  });

  const handleSaveTicket = () => {
    if (!formData.customerId || !formData.deviceType || !formData.issueDescription) return;

    const customer = customers.find(c => String(c.id) === String(formData.customerId));
    const assignedPersonnel = personnel.find(p => String(p.id) === String(formData.personnelId));

    const newTicket: ServiceTicket = {
      id: crypto.randomUUID(),
      customerId: customer!.id,
      customerName: customer!.name,
      personnelId: formData.personnelId,
      personnelName: assignedPersonnel ? `${assignedPersonnel.firstName} ${assignedPersonnel.lastName}` : '',
      deviceType: formData.deviceType,
      serialNumber: formData.serialNumber,
      issueDescription: formData.issueDescription,
      status: ServiceTicketStatus.PENDING,
      dateCreated: new Date().toISOString(),
      materialsUsed: [],
      laborFee: 0,
      taxRate: 20,
      totalCost: 0
    };

    store.setServiceTickets([...serviceTickets, newTicket]);
    setIsModalOpen(false);
  };

  const getStatusColor = (status: ServiceTicketStatus) => {
    switch (status) {
      case ServiceTicketStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ServiceTicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ServiceTicketStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case ServiceTicketStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 py-1 px-3 border border-gray-200';
    }
  };

  const openDetail = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
    setMaintenancePeriod(ticket.maintenancePeriodMonths || '');
  };

  const addMaterialToTicket = () => {
    if (!selectedTicket || !selectedProductToAdd || quantityToAdd <= 0) return;
    const product = products.find(p => String(p.id) === String(selectedProductToAdd));
    if (!product) return;

    const material: ServiceMaterial = {
      productId: product.id,
      productName: product.name,
      quantity: quantityToAdd,
      unitPrice: product.price
    };

    const updatedTicket = {
      ...selectedTicket,
      materialsUsed: [...selectedTicket.materialsUsed, material]
    };
    
    // Recalculate total
    const materialsTotal = updatedTicket.materialsUsed.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
    const subtotal = materialsTotal + (updatedTicket.laborFee || 0);
    updatedTicket.totalCost = subtotal + (subtotal * (updatedTicket.taxRate / 100));

    store.setServiceTickets(serviceTickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setSelectedProductToAdd('');
    setQuantityToAdd(1);
  };

  const removeMaterial = (index: number) => {
    if (!selectedTicket) return;
    const newMaterials = [...selectedTicket.materialsUsed];
    newMaterials.splice(index, 1);
    
    const updatedTicket = {
      ...selectedTicket,
      materialsUsed: newMaterials
    };
    
    const materialsTotal = updatedTicket.materialsUsed.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
    const subtotal = materialsTotal + (updatedTicket.laborFee || 0);
    updatedTicket.totalCost = subtotal + (subtotal * (updatedTicket.taxRate / 100));

    store.setServiceTickets(serviceTickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  };

  const completeTicket = () => {
    if (!selectedTicket) return;
    
    // Check stock for materials and reduce them
    const newProducts = [...products];
    for (const material of selectedTicket.materialsUsed) {
      const pIndex = newProducts.findIndex(p => p.id === material.productId);
      if (pIndex > -1) {
        let p = newProducts[pIndex];
        let remainingQuantity = material.quantity;
        let newWarehouseStocks = [...(p.warehouseStocks || [])];
        
        for (let i = 0; i < newWarehouseStocks.length; i++) {
            if (remainingQuantity <= 0) break;
            if (newWarehouseStocks[i].stock > 0) {
                const deduct = Math.min(newWarehouseStocks[i].stock, remainingQuantity);
                newWarehouseStocks[i] = { ...newWarehouseStocks[i], stock: newWarehouseStocks[i].stock - deduct };
                remainingQuantity -= deduct;
            }
        }

        newProducts[pIndex] = {
           ...p,
           stock: Math.max(0, p.stock - material.quantity),
           warehouseStocks: newWarehouseStocks
        };
      }
    }
    store.setProducts(newProducts);

    // Apply financial changes
    if (selectedTicket.totalCost > 0) {
      if (isPaid) {
        const cashTrx: CashTransaction = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: 'Gelir',
          category: 'Satış',
          amount: selectedTicket.totalCost,
          description: `Servis Formu: ${selectedTicket.deviceType} onarımı peşin tahsilat`,
          customerId: selectedTicket.customerId
        };
        store.setCashTransactions([...store.cashTransactions, cashTrx]);
      } else {
        const customerTrx: CustomerTransaction = {
          id: crypto.randomUUID(),
          customerId: selectedTicket.customerId,
          date: new Date().toISOString(),
          type: 'Satış',
          amount: selectedTicket.totalCost,
          description: `Servis Formu: ${selectedTicket.deviceType} onarımı`
        };
        store.setTransactions([...store.transactions, customerTrx]);
        
        // Update customer balance (Buyer goes positive balance normally or we subtract)
        const cIndex = customers.findIndex(c => String(c.id) === String(selectedTicket.customerId));
        if (cIndex > -1) {
           const newCustomers = [...customers];
           newCustomers[cIndex] = {
              ...newCustomers[cIndex],
              balance: newCustomers[cIndex].balance + selectedTicket.totalCost
           };
           store.setCustomers(newCustomers);
        }
      }
    }

    let nextMaintenanceDate: string | undefined = undefined;
    if (maintenancePeriod && maintenancePeriod > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + maintenancePeriod);
      nextMaintenanceDate = d.toISOString();
    }

    const updatedTicket = {
      ...selectedTicket,
      status: ServiceTicketStatus.COMPLETED,
      dateCompleted: new Date().toISOString(),
      maintenancePeriodMonths: maintenancePeriod || undefined,
      nextMaintenanceDate
    };
    
    store.setServiceTickets(serviceTickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setIsDetailModalOpen(false);
  };

  const handlePrint = (format: 'a4' | 'thermal') => {
    if (!selectedTicket) return;
    const isA4 = format === 'a4';
    
    const materialsHtml = selectedTicket.materialsUsed.map(m => `
      <tr>
        <td style="padding: 4px 0">${m.productName}</td>
        <td style="padding: 4px 0; text-align: center;">${m.quantity}</td>
        <td style="padding: 4px 0; text-align: right;">${m.unitPrice.toLocaleString('tr-TR')} ₺</td>
        <td style="padding: 4px 0; text-align: right;">${(m.quantity * m.unitPrice).toLocaleString('tr-TR')} ₺</td>
      </tr>
    `).join('');

    const laborHtml = selectedTicket.laborFee > 0 ? `
      <tr>
        <td colspan="3" style="padding: 4px 0; border-top: 1px dashed #ccc; font-weight: bold;">İşçilik Ücreti</td>
        <td style="padding: 4px 0; text-align: right; border-top: 1px dashed #ccc; font-weight: bold;">${selectedTicket.laborFee.toLocaleString('tr-TR')} ₺</td>
      </tr>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Servis Formu - ${selectedTicket.id}</title>
          <style>
            @page { size: ${isA4 ? 'A4' : '80mm auto'}; margin: ${isA4 ? '20mm' : '0'}; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: ${isA4 ? '0' : '15px'}; 
              width: ${isA4 ? 'auto' : '100%'};
              box-sizing: border-box;
              color: #000;
              font-size: ${isA4 ? '14px' : '12px'};
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .title { font-weight: bold; font-size: ${isA4 ? '24px' : '18px'}; margin: 0 0 5px 0; text-transform: uppercase; }
            .info { margin-bottom: 20px; line-height: 1.6; }
            .info div { display: flex; justify-content: space-between; }
            .info strong { display: inline-block; text-align: left; }
            .info span { text-align: right; }
            .desc { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; }
            .desc-title { font-weight: bold; margin-bottom: 5px; }
            .desc-text { white-space: pre-wrap; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
            th { text-align: left; border-bottom: 2px solid #000; padding-bottom: 5px; font-weight: bold; }
            .total-section { text-align: right; font-weight: bold; font-size: ${isA4 ? '18px' : '16px'}; border-top: 2px solid #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #555; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ARIZA / SERVİS FORMU</h1>
            <div style="font-size: ${isA4 ? '12px' : '10px'}">Kayıt No: ${selectedTicket.id.split('-')[0]}</div>
            <div>Tarih: ${new Date(selectedTicket.dateCreated).toLocaleDateString('tr-TR')}</div>
          </div>
          <div class="info">
            <div><strong>Müşteri:</strong> <span>${selectedTicket.customerName}</span></div>
            <div><strong>Cihaz:</strong> <span>${selectedTicket.deviceType}</span></div>
            <div><strong>Seri No:</strong> <span>${selectedTicket.serialNumber || '-'}</span></div>
            <div><strong>Personel:</strong> <span>${selectedTicket.personnelName || '-'}</span></div>
            <div><strong>Durum:</strong> <span>${selectedTicket.status}</span></div>
          </div>
          <div class="desc">
            <div class="desc-title">Şikayet / Arıza Detayı:</div>
            <div class="desc-text">${selectedTicket.issueDescription}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>İşlem/Parça</th>
                <th style="text-align: center;">Ad.</th>
                <th style="text-align: right;">Br.</th>
                <th style="text-align: right;">Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${materialsHtml}
              ${laborHtml}
            </tbody>
          </table>
          <div class="total-section">
            Genel Toplam: ${selectedTicket.totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </div>
          <div class="footer">
            Bu belge bilgilendirme amaçlıdır. Mali değeri yoktur. <br/>
            Bizi tercih ettiğiniz için teşekkür ederiz.
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arıza / Servis Formları</h1>
          <p className="text-gray-500 text-sm mt-1">Teknik servis ve onarım süreçlerini yönetin</p>
        </div>
        
        <button
          onClick={() => {
            setFormData(INITIAL_FORM);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Yeni Arıza Kaydı
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
           <nav className="flex space-x-8 px-4" aria-label="Tabs">
              <button
                 onClick={() => setActiveTab('all')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Tüm Arızalar
              </button>
              <button
                 onClick={() => setActiveTab('maintenance')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'maintenance' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Periyodik Bakımlar
              </button>
           </nav>
        </div>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Müşteri, cihaz veya seri no ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Tarih</th>
                <th className="p-4 font-semibold text-gray-600">Müşteri</th>
                <th className="p-4 font-semibold text-gray-600">Cihaz / Seri No</th>
                {activeTab === 'maintenance' && (
                  <th className="p-4 font-semibold text-gray-600">Sonraki Bakım</th>
                )}
                <th className="p-4 font-semibold text-gray-600">Atanan Personel</th>
                <th className="p-4 font-semibold text-gray-600">Durum</th>
                <th className="p-4 font-semibold text-gray-600">Tutar</th>
                <th className="p-4 font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'maintenance' ? 8 : 7} className="p-8 text-center text-gray-500">
                    Henüz kayıtlı arıza formu bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-600">
                      {new Date(ticket.dateCreated).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {ticket.customerName}
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>{ticket.deviceType}</div>
                      {ticket.serialNumber && <div className="text-xs text-gray-400 uppercase tracking-wider">{ticket.serialNumber}</div>}
                    </td>
                    {activeTab === 'maintenance' && (
                      <td className="p-4 text-gray-600 font-medium">
                        {ticket.nextMaintenanceDate ? new Date(ticket.nextMaintenanceDate).toLocaleDateString('tr-TR') : '-'}
                      </td>
                    )}
                    <td className="p-4 text-gray-600">
                      {ticket.personnelName || <span className="text-gray-400 italic">Atanmamış</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {ticket.totalCost > 0 ? ticket.totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '-'}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => openDetail(ticket)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                      >
                        Yönet <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="text-emerald-600" size={24} />
                Yeni Arıza Kaydı
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Seçin *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">Arama / Seçim Yapın</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atanacak Personel</label>
                <select
                  value={formData.personnelId}
                  onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Personel Seçin (Opsiyonel)</option>
                  {personnel.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cihaz / Makine Türü *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                      value={formData.deviceType}
                      onChange={e => setFormData({ ...formData, deviceType: e.target.value })}
                      placeholder="Örn: CNC Torna, Lazer Yazıcı"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seri Numarası</label>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                      value={formData.serialNumber}
                      onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Seri veya Model No"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arıza / Şikayet Açıklaması *</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none min-h-[100px]"
                  value={formData.issueDescription}
                  onChange={e => setFormData({ ...formData, issueDescription: e.target.value })}
                  placeholder="Müşterinin belirttiği arıza durumu..."
                />
              </div>

            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleSaveTicket}
                disabled={!formData.customerId || !formData.deviceType || !formData.issueDescription}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              >
                Kaydı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-wrap gap-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-emerald-600" />
                Arıza Formu Detayı
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                 <button 
                   onClick={() => handlePrint('thermal')}
                   className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                 >
                   <Printer size={16} />
                   Fiş (80mm)
                 </button>
                 <button 
                   onClick={() => handlePrint('a4')}
                   className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                 >
                   <Printer size={16} />
                   A4 Yazdır
                 </button>
                 <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                   {selectedTicket.status}
                 </span>
                 <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 ml-2">
                    <XCircle size={28} />
                 </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto grid md:grid-cols-3 gap-6">
               <div className="md:col-span-1 border-r border-gray-100 pr-6 space-y-6">
                 <div>
                    <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">Genel Bilgiler</h4>
                    <div className="space-y-3 text-sm">
                       <div>
                         <p className="text-gray-500">Müşteri</p>
                         <p className="font-medium text-gray-800">{selectedTicket.customerName}</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Cihaz</p>
                         <p className="font-medium text-gray-800">{selectedTicket.deviceType}</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Seri No</p>
                         <p className="font-medium text-gray-800">{selectedTicket.serialNumber || '-'}</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Personel</p>
                         <p className="font-medium text-gray-800">{selectedTicket.personnelName || '-'}</p>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">Şikayet Açıklaması</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.issueDescription}</p>
                 </div>
               </div>

               <div className="md:col-span-2 flex flex-col h-full space-y-6">
                 {/* Material Usage */}
                 <div>
                    <h4 className="font-semibold text-gray-700 border-b pb-2 mb-4">Kullanılan Malzemeler</h4>
                    
                    {selectedTicket.status !== ServiceTicketStatus.COMPLETED && selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                        <div className="flex gap-2 mb-4">
                           <select 
                              className="flex-1 p-2 rounded-lg border border-gray-200 outline-none"
                              value={selectedProductToAdd}
                              onChange={e => setSelectedProductToAdd(e.target.value)}
                           >
                              <option value="">Ürün Seçin</option>
                              {products.map(p => (
                                 <option key={p.id} value={p.id}>{p.name} ({p.price} ₺) - Stok: {p.stock}</option>
                              ))}
                           </select>
                           <input 
                              type="number"
                              className="w-20 p-2 rounded-lg border border-gray-200 outline-none text-center"
                              min="1"
                              value={quantityToAdd}
                              onChange={e => setQuantityToAdd(Number(e.target.value))}
                           />
                           <button 
                             onClick={addMaterialToTicket}
                             className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg font-medium transition-colors"
                           >
                              Ekle
                           </button>
                        </div>
                    )}

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50">
                             <tr>
                               <th className="p-2 border-b text-gray-600">Ürün</th>
                               <th className="p-2 border-b text-gray-600">Miktar</th>
                               <th className="p-2 border-b text-gray-600">Fiyat</th>
                               <th className="p-2 border-b text-gray-600 text-right">Toplam</th>
                               {selectedTicket.status !== ServiceTicketStatus.COMPLETED && <th className="p-2 border-b w-10"></th>}
                             </tr>
                          </thead>
                          <tbody>
                             {selectedTicket.materialsUsed.map((m, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                   <td className="p-2">{m.productName}</td>
                                   <td className="p-2">{m.quantity}</td>
                                   <td className="p-2">{m.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits:2 })} ₺</td>
                                   <td className="p-2 text-right font-medium">{(m.quantity * m.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits:2 })} ₺</td>
                                   {selectedTicket.status !== ServiceTicketStatus.COMPLETED && (
                                     <td className="p-2 text-center">
                                       <button onClick={() => removeMaterial(i)} className="text-red-500 hover:text-red-700">
                                         <Trash2 size={16} />
                                       </button>
                                     </td>
                                   )}
                                </tr>
                             ))}
                             {selectedTicket.materialsUsed.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-gray-500">Henüz malzeme eklenmedi.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Labor and Totals */}
                 <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 mt-auto">
                    <div>
                      {selectedTicket.status !== ServiceTicketStatus.COMPLETED && selectedTicket.status !== ServiceTicketStatus.CANCELLED ? (
                        <>
                           <label className="block text-sm font-medium text-gray-700 mb-1">İşçilik Ücreti</label>
                           <input 
                             type="number"
                             className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500"
                             value={selectedTicket.laborFee === 0 ? '' : selectedTicket.laborFee}
                             onChange={(e) => {
                               const fee = Number(e.target.value);
                               const materialsTotal = selectedTicket.materialsUsed.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0);
                               const subtotal = materialsTotal + fee;
                               const newTotal = subtotal + (subtotal * (selectedTicket.taxRate / 100));
                               const updated = { ...selectedTicket, laborFee: fee, totalCost: newTotal };
                               store.setServiceTickets(serviceTickets.map(t => t.id === selectedTicket.id ? updated : t));
                               setSelectedTicket(updated);
                             }}
                             placeholder="0.00"
                           />
                        </>
                      ) : (
                         <div>
                            <p className="text-gray-500 text-sm">İşçilik Ücreti</p>
                            <p className="font-medium text-gray-800">{selectedTicket.laborFee.toLocaleString('tr-TR')} ₺</p>
                         </div>
                      )}
                    </div>
                    
                    <div className="bg-emerald-50 rounded-lg p-4 text-right">
                       <p className="text-sm text-emerald-800 font-medium mb-1">TOPLAM MALİYET</p>
                       <p className="text-2xl font-bold text-emerald-900">
                         {selectedTicket.totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                       </p>
                    </div>
                 </div>

               </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {selectedTicket.status !== ServiceTicketStatus.COMPLETED && selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 bg-white p-2 px-3 border border-gray-200 rounded-lg shadow-sm">
                      <input 
                         type="checkbox" 
                         checked={isPaid}
                         onChange={e => setIsPaid(e.target.checked)}
                         className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Peşin Tahsil Edildi
                    </label>
                )}
                {selectedTicket.status !== ServiceTicketStatus.COMPLETED && selectedTicket.status !== ServiceTicketStatus.CANCELLED ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Periyodik Bakım (Ay):</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-20 p-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-emerald-500" 
                      placeholder="Örn: 6"
                      value={maintenancePeriod}
                      onChange={e => setMaintenancePeriod(Number(e.target.value) || '')}
                    />
                  </div>
                ) : selectedTicket.maintenancePeriodMonths ? (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Sonraki Bakım: </span>
                    {new Date(selectedTicket.nextMaintenanceDate!).toLocaleDateString('tr-TR')} ({selectedTicket.maintenancePeriodMonths} Ay Sonra)
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3">
                 <button
                   onClick={() => setIsDetailModalOpen(false)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                 >
                   Kapat
                 </button>
                 {selectedTicket.status !== ServiceTicketStatus.COMPLETED && selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                   <>
                     <button
                       onClick={() => {
                          const updated = { ...selectedTicket, status: ServiceTicketStatus.IN_PROGRESS };
                          store.setServiceTickets(serviceTickets.map(t => t.id === updated.id ? updated : t));
                          setSelectedTicket(updated);
                       }}
                       className={`px-4 py-2 rounded-lg transition-colors font-medium ${selectedTicket.status === ServiceTicketStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                     >
                        İşleme Al
                     </button>
                     <button
                       onClick={completeTicket}
                       className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                     >
                       <CheckCircle size={20} />
                       Formu Tamamla
                     </button>
                   </>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
