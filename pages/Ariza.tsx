import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Wrench, Settings, User, FileText, ChevronRight } from 'lucide-react';
import { ServiceTicket, ServiceTicketStatus, ServiceMaterial, Customer, Product, Personnel, CustomerTransaction, CashTransaction } from '../types';
import { useAppStore } from '../lib/store';

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
  
  const [formData, setFormData] = useState<Partial<ServiceTicket>>(INITIAL_FORM);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);

  // Detail / Edits
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [isPaid, setIsPaid] = useState(true);

  const filteredTickets = serviceTickets.filter(ticket => 
    ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        newProducts[pIndex] = {
           ...newProducts[pIndex],
           stock: newProducts[pIndex].stock - material.quantity
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

    const updatedTicket = {
      ...selectedTicket,
      status: ServiceTicketStatus.COMPLETED,
      dateCompleted: new Date().toISOString()
    };
    
    store.setServiceTickets(serviceTickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setIsDetailModalOpen(false);
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
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full max-w-md">
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
                <th className="p-4 font-semibold text-gray-600">Atanan Personel</th>
                <th className="p-4 font-semibold text-gray-600">Durum</th>
                <th className="p-4 font-semibold text-gray-600">Tutar</th>
                <th className="p-4 font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-emerald-600" />
                Arıza Formu Detayı
              </h3>
              <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                   {selectedTicket.status}
                 </span>
                 <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
              <div>
                {selectedTicket.status !== ServiceTicketStatus.COMPLETED && selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 bg-white p-2 px-3 border border-gray-200 rounded-lg shadow-sm">
                      <input 
                         type="checkbox" 
                         checked={isPaid}
                         onChange={e => setIsPaid(e.target.checked)}
                         className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Peşin Tahsil Edildi (Kasaya İşle)
                    </label>
                )}
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
