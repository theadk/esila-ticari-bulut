import React, { useState, useEffect, useMemo } from 'react';
import { FileBadge, Plus, Search, FileText, Printer, CheckCircle, XCircle, Trash2, Share2, Mail, MessageCircle } from 'lucide-react';
import { Proposal, ProposalStatus, ProposalItem, Customer, Product, Order, OrderStatus } from '../types';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { api } from '../lib/api';
import { Pagination } from '../components/Pagination';

export const Teklifler: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'teklifler', 'view');
  const canCreate = hasPermission(currentUser, 'teklifler', 'create');
  const canEdit = hasPermission(currentUser, 'teklifler', 'edit');
  const canDelete = hasPermission(currentUser, 'teklifler', 'delete');

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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = itemsPerPage === -1 ? filteredProposals : filteredProposals.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    const product = products.find(p => String(p.id) === String(selectedProductToAdd));
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
          unit: product.unit || 'Adet',
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
    const nextOfferId = `${store.settings.prefix_offer || 'TEK'}-${store.settings.next_offer_id || 1001}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    const newProposal: Proposal = {
      id: nextOfferId,
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
    store.setSettings({
      ...store.settings,
      next_offer_id: (store.settings.next_offer_id || 1001) + 1
    });
    setIsCreateModalOpen(false);
  };

  const handleShareWhatsApp = () => {
    if (!selectedProposal) return;
    const tenantId = sessionStorage.getItem('esila_tenant_id');
    const url = `${window.location.origin}/teklif-onay/${selectedProposal.id}?tenantId=${tenantId}`;
    const text = `Merhaba,\n\n${selectedProposal.id} numaralı teklifiniz hazır. Aşağıdaki bağlantıya tıklayarak teklif detaylarını inceleyebilir ve onaylayabilirsiniz:\n\n${url}\n\nİyi günler dileriz.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!selectedProposal) return;
    const tenantId = sessionStorage.getItem('esila_tenant_id');
    const url = `${window.location.origin}/teklif-onay/${selectedProposal.id}?tenantId=${tenantId}`;
    const subject = `${selectedProposal.id} Numaralı Teklifiniz`;
    const body = `Merhaba,\n\n${selectedProposal.id} numaralı teklifiniz hazır. Aşağıdaki bağlantıya tıklayarak teklif detaylarını inceleyebilir ve onaylayabilirsiniz:\n\n${url}\n\nİyi günler dileriz.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
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
      date: new Date().toISOString(),
      subTotal: selectedProposal.subTotal,
      taxTotal: selectedProposal.taxTotal,
      total: selectedProposal.total,
      status: OrderStatus.PENDING,
      proposalId: selectedProposal.id,
      items: selectedProposal.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price - (i.price * (i.discountRate / 100)),
        quantity: i.quantity,
        taxRate: i.taxRate || 20
      }))
    };
    setOrders((prev: any) => [...(prev || []), newOrder]);

    // Customer balance syncing and transactions
    const newCustomerTx = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedProposal.customerId,
      date: new Date().toISOString().split('T')[0],
      type: 'Satış' as const,
      amount: selectedProposal.total,
      description: `Tekliften Siparişe: ${newOrder.id}`
    };
    store.setTransactions((prev: any) => [...(prev || []), newCustomerTx]);

    store.setCustomers((prev: any) => prev.map((c: any) => {
      if (c.id === selectedProposal.customerId) {
        return { ...c, balance: Number(c.balance || 0) + selectedProposal.total };
      }
      return c;
    }));

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
    if (printType === '80mm' && selectedProposal) {
      import('../lib/printUtils').then(({ generateThermalReceiptHtml, printHtml }) => {
        const html = generateThermalReceiptHtml({
          storeName: store.settings?.companyName || 'ESİLA TİCARİ',
          storeAddress: store.settings?.address || '',
          storePhone: store.settings?.phone || '',
          taxOffice: store.settings?.taxOffice || '',
          taxNumber: store.settings?.taxNumber || '',
          companyLogo: store.settings?.companyLogo,
          date: selectedProposal.date,
          receiptNumber: selectedProposal.id,
          customerName: selectedProposal.customerName,
          items: selectedProposal.items.map(i => ({
            name: i.productName,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity * (1 - i.discountRate / 100),
            discount: i.discountRate > 0 ? i.discountRate : undefined
          })),
          subTotal: selectedProposal.subTotal,
          taxTotal: selectedProposal.taxTotal,
          total: selectedProposal.total,
          footerText: store.settings?.printer_footer_text,
          headerText: store.settings?.printer_header_text,
          settings: store.settings
        });
        printHtml(html);
      });
    } else {
      window.print();
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FileBadge size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Teklifler modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 no-print">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Teklifler</h2>
          {canCreate && (
            <button 
              onClick={handleOpenCreateModal}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Yeni Teklif
            </button>
          )}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
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
              {paginatedProposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Kayıtlı teklif bulunmamaktadır.
                  </td>
                </tr>
              ) : paginatedProposals.map((proposal) => (
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
                    {(proposal.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredProposals.length}
        />
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
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
            <div className="p-4 sm:p-6 overflow-auto flex-1">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 mb-6">
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
                             <td className="px-4 py-3 text-right">{Number(item.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                             <td className="px-4 py-3 text-right text-red-500">% {item.discountRate}</td>
                             <td className="px-4 py-3 text-right text-gray-500">% {item.taxRate || 20}</td>
                             <td className="px-4 py-3 text-right">{item.quantity} {item.unit || 'Adet'}</td>
                             <td className="px-4 py-3 text-right font-medium">
                               {Number((netTotal + taxTotalForItem) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
                      <span>{Number(selectedProposal.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>İndirimler:</span>
                      <span>- {Number(selectedProposal.discountTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>KDV Durumu:</span>
                      <span>+ {Number(selectedProposal.taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-emerald-700">
                      <span>GENEL TOPLAM:</span>
                      <span>{(selectedProposal.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
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
            <div className="p-4 border-t bg-gray-50 flex flex-wrap justify-end gap-3 rounded-b-xl">
               <button 
                 onClick={handleShareWhatsApp}
                 className="px-4 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg transition-colors font-medium flex items-center gap-2"
                 title="WhatsApp İle Paylaş"
               >
                 <MessageCircle size={18} />
                 WhatsApp
               </button>
               <button 
                 onClick={handleShareEmail}
                 className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                 title="E-posta İle Paylaş"
               >
                 <Mail size={18} />
                 E-posta
               </button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileBadge className="text-emerald-600" />
                Yeni Teklif Oluştur
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 mb-6">
                  {/* Left Column: Customer and Options */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cari / Müşteri Seçimi</label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedCustomer?.id || ''}
                        onChange={(e) => {
                          const c = customers.find(c => String(c.id) === String(e.target.value));
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
                        <div className="w-full border border-gray-300 rounded-lg overflow-y-auto max-h-32 bg-white flex flex-col">
                          {products.filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch)).map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => setSelectedProductToAdd(String(p.id))}
                              className={`px-3 py-2 cursor-pointer text-sm border-b last:border-b-0 hover:bg-emerald-50 ${selectedProductToAdd === String(p.id) ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-700'}`}
                            >
                              {p.code} - {p.name} - {(p.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </div>
                          ))}
                          {products.filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch)).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">Sonuç bulunamadı</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Miktar</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0.01"
                              step="0.01"
                              value={quantityToAdd}
                              onChange={(e) => setQuantityToAdd(parseFloat(e.target.value) || 1)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {selectedProductToAdd && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-gray-500 text-sm">
                                  {products.find(p => String(p.id) === selectedProductToAdd)?.unit || 'Adet'}
                                </span>
                              </div>
                            )}
                          </div>
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
                             <td className="px-4 py-2">{Number(item.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                             <td className="px-4 py-2 text-red-500 text-center">%{item.discountRate}</td>
                             <td className="px-4 py-2 text-gray-500 text-center">%{item.taxRate || 20}</td>
                             <td className="px-4 py-2 text-center">{item.quantity} {item.unit || 'Adet'}</td>
                             <td className="px-4 py-2 text-right font-medium">
                                {Number((netTotal + taxTotalForItem) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
                      <span>{Number(subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>İndirimler:</span>
                      <span>- {Number(discountTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 pb-2 border-b border-gray-200">
                      <span>KDV Tutarı:</span>
                      <span>+ {Number(taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    <div className="pt-2 flex justify-between font-bold text-lg text-emerald-700">
                      <span>GENEL TOPLAM:</span>
                      <span>{Number(cartTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
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
          <div className={`${printType === '80mm' ? 'max-w-[300px]' : 'max-w-full sm:max-w-4xl'} mx-auto ${printType === '80mm' ? '' : 'p-12'} bg-white text-gray-900`}>
            {printType === 'A4' ? (
              // A4 LAYOUT
              <>
                 <style>
                    {`
                      @media print {
                        .print-only body { color: #000; font-family: 'Times New Roman', Times, serif; }
                        table { border-collapse: collapse; }
                        td, th { padding: 8px; border: 1px solid #000; text-align: left; }
                      }
                      .contract-style-header {
                        font-family: Arial, sans-serif;
                      }
                      .contract-table th, .contract-table td {
                        border: 1px solid #000;
                        padding: 10px;
                        font-size: 14px;
                      }
                    `}
                 </style>
                 <div className="contract-style-header bg-white text-black p-8 mx-auto" style={{ maxWidth: '800px' }}>
                    
                    <div className="flex flex-col items-center justify-center mb-10 border-b-2 pb-6" style={{ borderColor: store.settings?.invoiceTemplate_color || '#000' }}>
                      {store.settings?.companyLogo && (
                        <img src={store.settings.companyLogo} alt="Logo" className="max-h-24 object-contain mb-4" />
                      )}
                      <h2 className="text-center text-3xl font-bold tracking-wider" style={{ color: store.settings?.invoiceTemplate_color || '#000' }}>FİYAT TEKLİFİ</h2>
                      <p className="text-md font-semibold mt-2 text-center">{store.settings?.companyName || ''}</p>
                    </div>
                    
                    <div className="flex justify-between mb-8">
                       <div className="flex items-center gap-2">
                          <span className="font-semibold w-24">Teklif No</span>
                          <span>: {selectedProposal.id}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="font-semibold w-28">Teklif Tarihi</span>
                          <span>: {selectedProposal.date}</span>
                       </div>
                    </div>

                    <div className="mb-8">
                       <h3 className="font-bold mb-4">Teklif Sahibi Bilgileri :</h3>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Firma Adı</span>
                          <span className="border-b border-black pb-1">: {store.settings.companyName || '______________________________________'}</span>
                       </div>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Yetkili Kişi</span>
                          <span className="border-b border-black pb-1">: {store.settings.authorized_person || '______________________________________'}</span>
                       </div>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Adres</span>
                          <span className="border-b border-black pb-1">: {store.settings.address || '______________________________________'}</span>
                       </div>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Telefon</span>
                          <span className="border-b border-black pb-1">: {store.settings.phone || '______________________________________'}</span>
                       </div>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">E-posta</span>
                          <span className="border-b border-black pb-1">: {store.settings.email || '______________________________________'}</span>
                       </div>
                    </div>

                    <div className="mb-4">
                       <h3 className="font-bold mb-4">Teklif Detayları :</h3>
                       <table className="w-full contract-table border-collapse border border-black mb-6">
                         <thead>
                           <tr className="bg-gray-50">
                             <th className="font-bold border border-black w-1/2 text-left">Ürün/Hizmet</th>
                             <th className="font-bold border border-black text-center">Miktar</th>
                             <th className="font-bold border border-black text-right">Birim Fiyat (TL)</th>
                             <th className="font-bold border border-black text-right">Toplam (TL)</th>
                           </tr>
                         </thead>
                         <tbody>
                           {selectedProposal.items.map((item, idx) => {
                             const netPrice = item.price * (1 - item.discountRate / 100);
                             const netAmount = netPrice * item.quantity;
                             return (
                               <tr key={idx}>
                                 <td className="border border-black text-left">{item.productName}</td>
                                 <td className="border border-black text-center">{item.quantity} {item.unit || 'Adet'}</td>
                                 <td className="border border-black text-right">
                                   {Number(netPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                 </td>
                                 <td className="border border-black text-right">
                                   {Number(netAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>

                       <div className="flex justify-end mb-12">
                          <div className="w-64">
                             <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                <span className="font-bold">Ara Toplam :</span>
                                <span>{Number((selectedProposal.subTotal - selectedProposal.discountTotal) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                <span className="font-bold">KDV Tutarı :</span>
                                <span>{Number(selectedProposal.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mt-4 text-right">
                                <span className="font-bold">Genel Toplam :</span>
                                <span className="font-bold">{(selectedProposal.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mb-8">
                       <h3 className="font-bold mb-2">Ödeme ve Teslimat Koşulları :</h3>
                       <p className="text-sm">Ödeme vadesi: Fatura tarihinden itibaren 30 gündür. Ödemeler banka havalesi ile yapılacaktır. Teslimat sipariş onayından itibaren 15 iş günü içerisinde gerçekleştirilecektir. Teklif {selectedProposal.validUntil ? `(Geçerlilik tarihi: ${selectedProposal.validUntil}) geçerlidir.` : '15 gün süreyle geçerlidir.'}</p>
                    </div>

                    <div className="mb-16">
                       <h3 className="font-bold mb-2">Notlar :</h3>
                       <p className="text-sm">{selectedProposal.notes || 'Bu teklif kapsamında belirtilen ürün/hizmetler Türkiye Cumhuriyeti mevzuatına uygun olarak sunulmaktadır. Teklif içeriğinde değişiklik yapılabilir. Ayrıntılı bilgi için lütfen iletişime geçiniz.'}</p>
                    </div>

                    <div className="flex justify-between px-10 text-center">
                       <div>
                         <p className="font-bold mb-8">Teklif Veren Yetkili</p>
                         <div className="flex items-end gap-2">
                            <span>İmza :</span>
                            <span className="inline-block w-48 border-b border-black"></span>
                         </div>
                       </div>
                       <div>
                         <p className="font-bold mb-8">Teklif Alan</p>
                         <div className="flex items-end gap-2">
                            <span>İmza :</span>
                            <span className="inline-block w-48 border-b border-black"></span>
                         </div>
                       </div>
                    </div>
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
                          <td className="py-1 text-right whitespace-nowrap">{item.quantity} {item.unit || 'Adet'}</td>
                          <td className="py-1 text-right whitespace-nowrap">
                            {Number((netPrice * item.quantity) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
                      <span>{Number(selectedProposal.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-bold">Toplam:</span>
                      <span className="font-bold text-lg">{(selectedProposal.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
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
