import React, { useState, useEffect, useMemo } from 'react';
import { FileBadge, Plus, Search, FileText, Printer, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Proposal, ProposalStatus, ProposalItem, Customer, Product, Order, OrderStatus } from '../types';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';

export const Teklifler: React.FC = () => {
  const store = useAppStore();
  const proposals = store.proposals;
  const setProposals = store.setProposals;
  const customers = store.customers;
  
  // also need to be able to create an order from a proposal
  const orders = store.orders;
  const setOrders = store.setOrders;

  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const [printType, setPrintType] = useState<'80mm' | 'A4'>('A4');

  // New Proposal Form
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<ProposalItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [discountToAdd, setDiscountToAdd] = useState<number>(0);
  const [taxToAdd, setTaxToAdd] = useState<number>(20);
  const [notes, setNotes] = useState<string>('');
  const [validDays, setValidDays] = useState<number>(15);

  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountTotal = cartItems.reduce((acc, item) => acc + ((item.price * item.quantity) * (item.discountRate / 100)), 0);
  
  const taxTotal = cartItems.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = itemTotal * (item.discountRate / 100);
    const itemNet = itemTotal - itemDiscount;
    return acc + (itemNet * ((item.taxRate || 20) / 100));
  }, 0);
  
  const cartTotal = subTotal - discountTotal + taxTotal;

  const filteredProposals = proposals.filter(p => 
    p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: ProposalStatus) => {
    switch(status) {
      case ProposalStatus.ACCEPTED: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case ProposalStatus.PENDING: return 'text-orange-600 bg-orange-50 border-orange-200';
      case ProposalStatus.REJECTED: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setSelectedProductToAdd('');
    setQuantityToAdd(1);
    setDiscountToAdd(0);
    setNotes('');
    setValidDays(15);
    setIsCreateModalOpen(true);
  };

  const addItemToCart = () => {
    if (!selectedProductToAdd) return;
    const product = products.find(p => p.id === selectedProductToAdd);
    if (!product) return;

    const existingIndex = cartItems.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += quantityToAdd;
      newItems[existingIndex].discountRate = discountToAdd; // update discount
      newItems[existingIndex].taxRate = taxToAdd; // update tax
      setCartItems(newItems);
    } else {
      setCartItems([
        ...cartItems, 
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: quantityToAdd,
          discountRate: discountToAdd,
          taxRate: taxToAdd
        }
      ]);
    }
    
    setSelectedProductToAdd('');
    setQuantityToAdd(1);
    setDiscountToAdd(0);
    setTaxToAdd(20);
  };

  const removeItemFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleCreateProposal = () => {
    if (!selectedCustomer || cartItems.length === 0) return;

    const now = new Date();
    const validUntilDate = new Date(now);
    validUntilDate.setDate(now.getDate() + validDays);

    const newProposal: Proposal = {
      id: `TEK-${now.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName || selectedCustomer.name,
      date: now.toISOString().split('T')[0],
      validUntil: validUntilDate.toISOString().split('T')[0],
      subTotal,
      discountTotal,
      taxTotal,
      total: cartTotal,
      status: ProposalStatus.PENDING,
      items: cartItems,
      notes
    };

    setProposals([...proposals, newProposal]);
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (status: ProposalStatus) => {
    if (!selectedProposal) return;
    const updated = proposals.map(p => p.id === selectedProposal.id ? { ...p, status } : p);
    setProposals(updated);
    setSelectedProposal({ ...selectedProposal, status });
  };

  const convertToOrder = () => {
    if (!selectedProposal) return;
    
    // Add Order
    const newOrder: Order = {
      id: `SIP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      customerId: selectedProposal.customerId,
      customerName: selectedProposal.customerName,
      date: new Date().toISOString().split('T')[0],
      subTotal: selectedProposal.subTotal,
      taxTotal: selectedProposal.taxTotal,
      total: selectedProposal.total,
      status: OrderStatus.PENDING,
      items: selectedProposal.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price - (i.price * (i.discountRate / 100)),
        quantity: i.quantity,
        taxRate: i.taxRate || 20
      }))
    };
    setOrders([...orders, newOrder]);

    // Customer balance syncing and transactions
    const customerTransactions = store.transactions;
    const newCustomerTx = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedProposal.customerId,
      date: new Date().toISOString().split('T')[0],
      type: 'Satış' as const,
      amount: selectedProposal.total,
      description: `Tekliften Siparişe: ${newOrder.id}`
    };
    store.setTransactions([...customerTransactions, newCustomerTx]);

    const updatedCustomers = customers.map(c => {
      if (c.id === selectedProposal.customerId) {
        return { ...c, balance: c.balance + selectedProposal.total };
      }
      return c;
    });
    store.setCustomers(updatedCustomers);

    handleStatusChange(ProposalStatus.ACCEPTED);
    
    // Mark proposal as converted
    const updated = proposals.map(p => 
      p.id === selectedProposal.id 
        ? { ...p, status: ProposalStatus.ACCEPTED, isConvertedToOrder: true } 
        : p
    );
    setProposals(updated);
    setSelectedProposal({ ...selectedProposal, status: ProposalStatus.ACCEPTED, isConvertedToOrder: true });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6 no-print">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Teklifler</h2>
          <button 
            onClick={handleOpenCreateModal}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Yeni Teklif
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Müşteri adı veya Teklif NO ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Proposlas Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-6 py-4 font-medium">Teklif No</th>
                <th className="px-6 py-4 font-medium">Müşteri</th>
                <th className="px-6 py-4 font-medium">Tarih</th>
                <th className="px-6 py-4 font-medium">Geçerlilik</th>
                <th className="px-6 py-4 font-medium">Tutar</th>
                <th className="px-6 py-4 font-medium">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Kayıtlı teklif bulunmamaktadır.
                  </td>
                </tr>
              ) : filteredProposals.map((proposal) => (
                <tr 
                  key={proposal.id} 
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedProposal(proposal);
                    setIsDetailsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{proposal.id}</td>
                  <td className="px-6 py-4 text-gray-600">{proposal.customerName}</td>
                  <td className="px-6 py-4 text-gray-600">{proposal.date}</td>
                  <td className="px-6 py-4 text-gray-600">{proposal.validUntil}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600">
                    {proposal.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProposal(proposal);
                        setIsDetailsModalOpen(true);
                       }}
                      className="text-gray-500 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                      title="Detay"
                    >
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileBadge className="text-emerald-600" />
                Teklif Detayı - {selectedProposal.id}
              </h3>
              <div className="flex items-center gap-2">
                 {selectedProposal.status === ProposalStatus.PENDING && (
                   <>
                     <button onClick={() => handleStatusChange(ProposalStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200" title="Reddet">
                       <XCircle size={20} />
                     </button>
                     <button onClick={() => handleStatusChange(ProposalStatus.ACCEPTED)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200" title="Onayla">
                       <CheckCircle size={20} />
                     </button>
                   </>
                 )}
                 {selectedProposal.status === ProposalStatus.ACCEPTED && !selectedProposal.isConvertedToOrder && (
                   <button onClick={convertToOrder} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                     <Plus size={16} /> Siparişe Çevir
                   </button>
                 )}
                 {selectedProposal.isConvertedToOrder && (
                   <span className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2 font-medium">
                     <CheckCircle size={16} /> Siparişe Çevrildi
                   </span>
                 )}
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors ml-2">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto flex-1">
               <div className="grid grid-cols-2 gap-6 mb-6">
                 <div>
                   <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Müşteri Bilgileri</h4>
                   <p className="font-medium text-gray-900">{selectedProposal.customerName}</p>
                 </div>
                 <div>
                   <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Teklif Tarihleri</h4>
                   <p className="text-sm text-gray-700">Tarih: <span className="font-medium">{selectedProposal.date}</span></p>
                   <p className="text-sm text-gray-700">Geçerlilik: <span className="font-medium">{selectedProposal.validUntil}</span></p>
                 </div>
               </div>

               <div className="mb-6">
                 <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ürün/Hizmet Kalemleri</h4>
                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-4 py-2 font-medium text-gray-600">Ürün</th>
                         <th className="px-4 py-2 font-medium text-gray-600 text-right">Fiyat</th>
                         <th className="px-4 py-2 font-medium text-gray-600 text-right">İndirim</th>
                         <th className="px-4 py-2 font-medium text-gray-600 text-right">KDV</th>
                         <th className="px-4 py-2 font-medium text-gray-600 text-right">Miktar</th>
                         <th className="px-4 py-2 font-medium text-gray-600 text-right">Net Tutar</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {selectedProposal.items.map((item, idx) => {
                         const netTotal = (item.price * item.quantity) * (1 - item.discountRate / 100);
                         const taxTotalForItem = netTotal * ((item.taxRate || 20) / 100);
                         return (
                           <tr key={idx}>
                             <td className="px-4 py-3">{item.productName}</td>
                             <td className="px-4 py-3 text-right">{item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                             <td className="px-4 py-3 text-right text-red-500">% {item.discountRate}</td>
                             <td className="px-4 py-3 text-right text-gray-500">% {item.taxRate || 20}</td>
                             <td className="px-4 py-3 text-right">{item.quantity}</td>
                             <td className="px-4 py-3 text-right font-medium">
                               {(netTotal + taxTotalForItem).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>

               <div className="flex justify-end mb-6">
                 <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Ara Toplam:</span>
                      <span>{selectedProposal.subTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>İndirimler:</span>
                      <span>- {selectedProposal.discountTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>KDV Durumu:</span>
                      <span>+ {selectedProposal.taxTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-emerald-700">
                      <span>GENEL TOPLAM:</span>
                      <span>{selectedProposal.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                 </div>
               </div>

               {selectedProposal.notes && (
                 <div>
                   <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notlar</h4>
                   <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-line">
                     {selectedProposal.notes}
                   </p>
                 </div>
               )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
               <button 
                 onClick={() => {
                   setPrintType('80mm');
                   setTimeout(() => {
                     window.print();
                   }, 100);
                 }}
                 className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 <Printer size={18} />
                 80mm Fiş Yazdır
               </button>
               <button 
                 onClick={() => {
                   setPrintType('A4');
                   setTimeout(() => {
                     window.print();
                   }, 100);
                 }}
                 className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 <Printer size={18} />
                 A4 Yazdır
               </button>
               <button 
                 onClick={() => setIsDetailsModalOpen(false)} 
                 className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
               >
                 Kapat
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileBadge className="text-emerald-600" />
                Yeni Teklif Oluştur
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column: Customer and Options */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cari / Müşteri Seçimi</label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedCustomer?.id || ''}
                        onChange={(e) => {
                          const c = customers.find(c => c.id === e.target.value);
                          setSelectedCustomer(c || null);
                        }}
                      >
                        <option value="">Lütfen cari seçiniz...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Süresi (Gün)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={validDays}
                        onChange={(e) => setValidDays(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notlar / Şartlar</label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Teklif şartları, teslimat süresi vb."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>

                  {/* Right Column: Add Items */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">Teklife Ürün/Hizmet Ekle</h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <input 
                          type="text"
                          placeholder="Ürün Ara (Ad veya Barkod/Kod)..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={selectedProductToAdd}
                          onChange={(e) => setSelectedProductToAdd(e.target.value)}
                          size={4}
                        >
                          {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name} - {p.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Miktar</label>
                          <input 
                            type="number" 
                            min="1"
                            value={quantityToAdd}
                            onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">İndirim (%)</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={discountToAdd}
                            onChange={(e) => setDiscountToAdd(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">KDV (%)</label>
                          <select 
                            value={taxToAdd}
                            onChange={(e) => setTaxToAdd(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="0">%0</option>
                            <option value="1">%1</option>
                            <option value="10">%10</option>
                            <option value="20">%20</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button 
                            onClick={addItemToCart}
                            disabled={!selectedProductToAdd}
                            className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[42px] px-4 font-medium flex-1 text-center"
                          >
                            Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Cart Items Table */}
               <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-4 py-2 font-medium text-gray-600 w-1/3">Ürün</th>
                       <th className="px-4 py-2 font-medium text-gray-600">B. Fiyat</th>
                       <th className="px-4 py-2 font-medium text-gray-600 text-center">İnd. %</th>
                       <th className="px-4 py-2 font-medium text-gray-600 text-center">KDV %</th>
                       <th className="px-4 py-2 font-medium text-gray-600 text-center">Mik.</th>
                       <th className="px-4 py-2 font-medium text-gray-600 text-right">Net Tutar</th>
                       <th className="px-4 py-2"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {cartItems.length === 0 ? (
                       <tr>
                         <td colSpan={7} className="px-4 py-6 text-center text-gray-500 bg-white">
                           Henüz ürün eklenmedi.
                         </td>
                       </tr>
                     ) : (
                       cartItems.map((item, idx) => {
                         const netTotal = (item.price * item.quantity) * (1 - item.discountRate / 100);
                         const taxTotalForItem = netTotal * ((item.taxRate || 20) / 100);
                         return (
                           <tr key={idx} className="bg-white">
                             <td className="px-4 py-2">{item.productName}</td>
                             <td className="px-4 py-2">{item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                             <td className="px-4 py-2 text-red-500 text-center">%{item.discountRate}</td>
                             <td className="px-4 py-2 text-gray-500 text-center">%{item.taxRate || 20}</td>
                             <td className="px-4 py-2 text-center">{item.quantity}</td>
                             <td className="px-4 py-2 text-right font-medium">
                                {(netTotal + taxTotalForItem).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                             </td>
                             <td className="px-4 py-2 text-right">
                               <button onClick={() => removeItemFromCart(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                                 <Trash2 size={16} />
                               </button>
                             </td>
                           </tr>
                         );
                       })
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Cart Summary */}
               <div className="flex justify-end">
                 <div className="w-64 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Ara Toplam:</span>
                      <span>{subTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>İndirimler:</span>
                      <span>- {discountTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 pb-2 border-b border-gray-200">
                      <span>KDV Tutarı:</span>
                      <span>+ {taxTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="pt-2 flex justify-between font-bold text-lg text-emerald-700">
                      <span>GENEL TOPLAM:</span>
                      <span>{cartTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={handleCreateProposal}
                disabled={!selectedCustomer || cartItems.length === 0}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Teklifi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View */}
      {selectedProposal && (
        <div className="print-only">
          <div className={`${printType === '80mm' ? 'max-w-[300px]' : 'max-w-4xl'} mx-auto ${printType === '80mm' ? '' : 'p-12'} bg-white text-gray-900`}>
            {printType === 'A4' ? (
              // A4 LAYOUT
              <>
                <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-6 mb-8">
                  <div>
                    {store.settings.companyLogo ? (
                      <img src={store.settings.companyLogo} alt="Logo" className="max-h-20 object-contain mb-2" />
                    ) : (
                      <h1 className="text-5xl font-logo text-emerald-900 mb-2">{store.settings.printer_header_text || 'esila'}</h1>
                    )}
                    <p className="text-gray-500 font-medium">{store.settings.companyName}</p>
                    <p className="text-gray-500 text-sm whitespace-pre-line">{store.settings.address}</p>
                    {store.settings.phone && <p className="text-gray-500 text-sm">Tel: {store.settings.phone}</p>}
                    {store.settings.taxOffice && store.settings.taxNumber && (
                      <p className="text-gray-500 text-sm">{store.settings.taxOffice} - VKN: {store.settings.taxNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase tracking-widest text-emerald-800">TEKLİF FORMU</h2>
                    <div className="inline-block bg-gray-50 p-4 border border-gray-200 rounded-lg text-left w-56">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 text-sm font-medium">Teklif No:</span>
                        <span className="font-bold text-gray-900">{selectedProposal.id}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 text-sm font-medium">Tarih:</span>
                        <span className="text-gray-900">{selectedProposal.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm font-medium">Geçerlilik:</span>
                        <span className="text-gray-900">{selectedProposal.validUntil}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-lg font-bold text-emerald-800 mb-3 border-b border-emerald-100 pb-1 inline-block uppercase tracking-wide">MÜŞTERİ BİLGİLERİ</h3>
                  <p className="text-xl font-bold text-gray-900">{selectedProposal.customerName}</p>
                </div>

                <table className="w-full mb-10 border border-gray-200">
                  <thead className="bg-emerald-800 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium uppercase text-sm tracking-wider w-1/2">Açıklama (Ürün/Hizmet)</th>
                      <th className="py-3 px-4 text-center font-medium uppercase text-sm tracking-wider">Miktar</th>
                      <th className="py-3 px-4 text-right font-medium uppercase text-sm tracking-wider">Birim Fiyat</th>
                      <th className="py-3 px-4 text-center font-medium uppercase text-sm tracking-wider">KDV</th>
                      <th className="py-3 px-4 text-right font-medium uppercase text-sm tracking-wider">İndirim</th>
                      <th className="py-3 px-4 text-right font-medium uppercase text-sm tracking-wider">Net Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {selectedProposal.items.map((item, idx) => {
                      const baseAmount = item.price * item.quantity;
                      const discountAmount = baseAmount * (item.discountRate / 100);
                      const netBeforeTax = baseAmount - discountAmount;
                      const taxAmount = netBeforeTax * ((item.taxRate || 20) / 100);
                      const netAmount = netBeforeTax + taxAmount;
                      return (
                        <tr key={idx} className="bg-white">
                          <td className="py-3 px-4">{item.productName}</td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                          <td className="py-3 px-4 text-center">%{item.taxRate || 20}</td>
                          <td className="py-3 px-4 text-right">{item.discountRate > 0 ? `%${item.discountRate}` : '-'}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            {netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex justify-between items-start mb-12">
                  <div className="w-1/2 pr-8">
                    {selectedProposal.notes && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">NOTLAR / ŞARTLAR</h3>
                        <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                          {selectedProposal.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="w-1/2">
                    <table className="w-full text-gray-800">
                      <tbody>
                        <tr>
                          <td className="py-2 px-4 text-right font-medium text-gray-600">Ara Toplam:</td>
                          <td className="py-2 px-4 text-right">{selectedProposal.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                        </tr>
                        {selectedProposal.discountTotal > 0 && (
                          <tr>
                            <td className="py-2 px-4 text-right font-medium text-red-500">Toplam İndirim:</td>
                            <td className="py-2 px-4 text-right text-red-500">- {selectedProposal.discountTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                          </tr>
                        )}
                        <tr className="border-b border-gray-200">
                          <td className="py-2 px-4 text-right font-medium text-gray-600">Ara Toplam (İndirimli):</td>
                          <td className="py-2 px-4 text-right">{(selectedProposal.subTotal - selectedProposal.discountTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-right font-medium text-gray-600">KDV Tutarı:</td>
                          <td className="py-2 px-4 text-right">{selectedProposal.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                        </tr>
                        <tr className="bg-gray-50 border border-emerald-200">
                          <td className="py-3 px-4 text-right font-bold text-lg text-emerald-800">GENEL TOPLAM:</td>
                          <td className="py-3 px-4 text-right font-bold text-lg text-emerald-800">
                            {selectedProposal.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-200 mt-8">
                   <div className="flex justify-between px-12 pb-24 text-center">
                      <div>
                        <p className="font-bold text-gray-800 uppercase">Firma Yetkilisi</p>
                        <p className="text-gray-500 mt-1">Kaşe / İmza</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 uppercase">Müşteri / Firma Kabul Onayı</p>
                        <p className="text-gray-500 mt-1">Kaşe / İmza</p>
                      </div>
                   </div>
                </div>
                <div className="text-center text-xs text-gray-400 mt-8">
                  * Bu bir teklif belgesidir, mali değeri yoktur. Süresi geçen teklifler için onaydan önce mutlaka firmamızdan fiyat düzeltmesi talep ediniz.
                </div>
              </>
            ) : (
              // 80MM LAYOUT
              <>
                <div className="text-center mb-6">
                  {store.settings.companyLogo ? (
                    <img src={store.settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                  ) : (
                    <h1 className="font-logo text-4xl mb-2 text-black">{store.settings.printer_header_text || 'esila'}</h1>
                  )}
                  <p className="text-xs">{store.settings.companyName}</p>
                  <p className="text-xs whitespace-pre-line">{store.settings.address}</p>
                  {store.settings.taxOffice && store.settings.taxNumber && (
                    <p className="text-xs mt-1">{store.settings.taxOffice} - VKN: {store.settings.taxNumber}</p>
                  )}
                  <p className="text-xs uppercase mt-2 font-bold tracking-widest border-y border-black py-1">Teklif Formu</p>
                </div>
                
                <div className="mb-4 text-sm">
                  <p><strong>Tarih:</strong> {selectedProposal.date}</p>
                  <p><strong>Geçerlilik:</strong> {selectedProposal.validUntil}</p>
                  <p><strong>Teklif No:</strong> {selectedProposal.id}</p>
                  <p><strong>Müşteri:</strong> {selectedProposal.customerName}</p>
                </div>

                <table className="w-full mb-4 text-sm mt-4">
                  <thead>
                    <tr className="border-b border-black text-left font-bold">
                      <th className="py-1">Ürün</th>
                      <th className="py-1 text-right">Mktr</th>
                      <th className="py-1 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProposal.items.map((item, idx) => {
                      const netPrice = item.price * (1 - item.discountRate / 100);
                      return (
                        <tr key={idx} className="border-b border-gray-300 border-dashed">
                          <td className="py-1 pr-2">{item.productName} {item.discountRate > 0 && <span className="text-[10px] block">(-%{item.discountRate})</span>}</td>
                          <td className="py-1 text-right whitespace-nowrap">{item.quantity}</td>
                          <td className="py-1 text-right whitespace-nowrap">
                            {(netPrice * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex justify-end mb-6 text-sm">
                  <div className="text-right w-full">
                    <div className="flex justify-between border-b border-gray-300 border-dashed pb-1">
                      <span>KDV:</span>
                      <span>{selectedProposal.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-bold">Toplam:</span>
                      <span className="font-bold text-lg">{selectedProposal.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                  </div>
                </div>

                {selectedProposal.notes && (
                  <div className="text-xs text-justify mb-4 border-t border-black pt-2">
                    <span className="font-bold underline">Notlar:</span><br/>
                    {selectedProposal.notes}
                  </div>
                )}
                
                <div className="text-center text-xs mt-6 pt-4 border-t border-black">
                  <p>Bu belge teklif mahiyetindedir.</p>
                  <p>Mali değeri yoktur.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
