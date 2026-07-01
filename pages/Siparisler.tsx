import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Printer, FileText, CheckCircle, XCircle, Trash2, Search, Save, X, ShoppingCart, User, Send, FileDigit, Cloud, MessageCircle, Link, RefreshCw, Mic, MicOff, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, OrderStatus, Customer, Product, OrderItem, CustomerTransaction, CashTransaction, Warehouse } from '../types';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { api } from '../lib/api';
import { copyToClipboard } from '../lib/utils';
import { Pagination } from '../components/Pagination';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';

export const Siparisler: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find((u: any) => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'siparisler', 'view');
  const canCreate = hasPermission(currentUser, 'siparisler', 'create');
  const canEdit = hasPermission(currentUser, 'siparisler', 'edit');
  const canDelete = hasPermission(currentUser, 'siparisler', 'delete');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  useEffect(() => {
    api.getWarehouses().then(setWarehouses).catch(console.error);
  }, []);

  const orders = store.orders;
  const setOrders = store.setOrders;
  const customers = store.customers || [];
  const setCustomers = store.setCustomers;
  const transactions = store.transactions || [];
  const setTransactions = store.setTransactions;
  const cashTransactions = store.cashTransactions || [];
  const setCashTransactions = store.setCashTransactions;

  const rawProducts = store.products;
  const assigned = warehouses.find(w => w.id === currentUser?.assignedWarehouse)?.name || currentUser?.assignedWarehouse;
  const products = currentUser?.assignedWarehouse 
    ? rawProducts.filter(p => p.warehouseStocks?.some(ws => ws.warehouseId === assigned) || p.warehouse === assigned)
    : rawProducts;
  const setProducts = store.setProducts;
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'80mm' | 'A4'>('80mm');
  
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({ provider: 'Yurtiçi Kargo', trackingNumber: '' });
  const [eFaturaModalOpen, setEFaturaModalOpen] = useState(false);
  const [eFaturaOrder, setEFaturaOrder] = useState<Order | null>(null);
  const [eFaturaType, setEFaturaType] = useState('E-Fatura');
  const [eFaturaInvoiceType, setEFaturaInvoiceType] = useState('SATIS');
  const [eFaturaScenario, setEFaturaScenario] = useState('TICARIFATURA');
  const [eFaturaExceptionCode, setEFaturaExceptionCode] = useState('');
  const [eFaturaLoading, setEFaturaLoading] = useState(false);

  useEffect(() => {
    if (eFaturaModalOpen && eFaturaOrder) {
      const customer = customers.find(c => c.name === eFaturaOrder.customerName || c.id === eFaturaOrder.customerId);
      if (customer) {
        setEFaturaType(customer.efaturaType || 'E-Fatura');
        setEFaturaInvoiceType(customer.efaturaInvoiceType || 'SATIS');
        setEFaturaScenario(customer.efaturaScenario || 'TICARIFATURA');
      } else {
        setEFaturaType('E-Fatura');
        setEFaturaInvoiceType('SATIS');
        setEFaturaScenario('TICARIFATURA');
      }
      setEFaturaExceptionCode('');
    }
  }, [eFaturaModalOpen, eFaturaOrder, customers]);

  // Derived state for eFatura total based on Invoice Type
  const calculateEFaturaTotals = () => {
    if (!eFaturaOrder) return { subTotal: 0, taxTotal: 0, total: 0 };
    let sub = eFaturaOrder.subTotal || 0;
    let tax = eFaturaOrder.taxTotal || 0;
    
    // If order missing subTotal/taxTotal try to calculate from items
    if (!sub && eFaturaOrder.items) {
      sub = eFaturaOrder.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      tax = eFaturaOrder.items.reduce((acc, it) => acc + (it.price * it.quantity * ((it.taxRate || 20) / 100)), 0);
    }
    
    // Fallback if still 0
    if (!sub) {
       sub = ((eFaturaOrder.total || (eFaturaOrder as any).totalAmount || 0) / 1.2);
       tax = (eFaturaOrder.total || (eFaturaOrder as any).totalAmount || 0) - sub;
    }

    if (eFaturaInvoiceType === 'ISTISNA' || eFaturaInvoiceType === 'IHRACAT') {
       tax = 0; // İstisna ise KDV %0
    }
    
    return { subTotal: sub, taxTotal: tax, total: sub + tax };
  };

  const currentEFaturaTotals = calculateEFaturaTotals();

  // New Order Form State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [taxToAdd, setTaxToAdd] = useState<number>(20);
  const [isPaid, setIsPaid] = useState<boolean>(true); // Peşin Tahsil Et
  const [orderCurrency, setOrderCurrency] = useState('TRY');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [exchangeRatesList, setExchangeRatesList] = useState<{Kod: string, Rate: number}[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const { isListening, supported, listen, stop } = useSpeechRecognition();

  const handleSpeechRecognition = () => {
    if (isListening) {
      stop();
    } else {
      listen((text) => {
        setOrderNotes(prev => prev ? `${prev} ${text}` : text);
      });
    }
  };

  const fetchExchangeRates = async () => {
    try {
      setRatesLoading(true);
      const res = await fetch('/api/exchange-rates');
      if (!res.ok) throw new Error('Kurlar alınamadı');
      const xmlData = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      const currencies = Array.from(xmlDoc.getElementsByTagName("Currency"));
      
      const rates = currencies.map(c => {
        const kod = c.getAttribute("Kod") || '';
        const forexSelling = c.getElementsByTagName("ForexSelling")[0]?.textContent;
        return { Kod: kod, Rate: parseFloat(forexSelling || '0') };
      }).filter(c => c.Rate > 0 && ['USD', 'EUR', 'GBP'].includes(c.Kod));
      
      setExchangeRatesList(rates);
      toast.success('Güncel kurlar Merkez Bankası\'ndan alındı');
    } catch (e: any) {
      toast.error('Kur bilgisi alınamadı: ' + e.message);
    } finally {
      setRatesLoading(false);
    }
  };

  // Derived state for new order total
  const cartSubTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartTaxTotal = cartItems.reduce((acc, item) => acc + ((item.price * item.quantity) * ((item.taxRate || 20) / 100)), 0);
  const cartTotal = cartSubTotal + cartTaxTotal;

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setSelectedProductToAdd('');
    setQuantityToAdd(1);
    setIsPaid(true);
    setOrderNotes('');
    setIsCreateModalOpen(true);
  };

  const getAvailableStock = (product: Product) => {
    if (assigned) {
      const wStock = product.warehouseStocks?.find(w => w.warehouseId === assigned);
      if (wStock) return wStock.stock;
      if (product.warehouse === assigned) return product.stock;
      return 0; // If assigned to another warehouse, no stock available here unless explicitly in warehouseStocks
    }
    if (product.warehouseStocks && product.warehouseStocks.length > 0) {
      return product.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
    }
    return product.stock || 0; // Global fallback
  };

  const addItemToCart = () => {
    if (!selectedProductToAdd) return;
    
    const product = products.find(p => String(p.id) === String(selectedProductToAdd));
    if (!product) return;

    const availableStock = getAvailableStock(product);

    if (quantityToAdd > availableStock) {
      toast.error(`Stok yetersiz! Mevcut stok: ${availableStock}`);
      return;
    }

    const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      const newItems = [...cartItems];
      const newQuantity = newItems[existingItemIndex].quantity + quantityToAdd;
      if (newQuantity > availableStock) {
         toast.error(`Stok yetersiz! Mevcut stok: ${availableStock}`);
         return;
      }
      newItems[existingItemIndex].quantity = newQuantity;
      newItems[existingItemIndex].taxRate = taxToAdd;
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
          taxRate: taxToAdd
        }
      ]);
    }
    setQuantityToAdd(1);
    setTaxToAdd(20);
    setSelectedProductToAdd('');
  };

  const removeItemFromCart = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const handleCreateOrder = () => {
    try {
      if (!selectedCustomer || cartItems.length === 0) return;

      const orderDate = new Date();
      const nextOrderId = `${store.settings.prefix_order || 'SIP'}-${store.settings.next_order_id || 1001}`;
      
      const newOrder: Order = {
        id: nextOrderId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        date: orderDate.toISOString(),
        subTotal: cartSubTotal,
        taxTotal: cartTaxTotal,
        total: cartTotal,
        currency: orderCurrency,
        exchangeRate: exchangeRate,
        status: OrderStatus.PENDING,
        items: cartItems,
        notes: orderNotes
      };

      setOrders([newOrder, ...orders]);
      store.setSettings({
        ...store.settings,
        next_order_id: (store.settings.next_order_id || 1001) + 1
      });

      // Stock is NOT reduced here because order is PENDING.
      // It will be reduced when status changes to COMPLETED.
      
      // 1. Cariye Satış İşle
      const newTransaction: CustomerTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: selectedCustomer.id,
        date: orderDate.toISOString().split('T')[0],
        type: 'Satış',
        amount: cartTotal,
        description: `Sipariş: ${newOrder.id}`
      };
      
      setTransactions(prev => [...prev, newTransaction]);
      
      // Update Customer Balance (Satış means customer debt increases -> positive balance)
      let finalBalanceDelta = cartTotal;

      // 2. Eğer peşin ödendiyse, tahsilat işle
      if (isPaid) {
        const paymentTransaction: CustomerTransaction = {
          id: Math.random().toString(36).substr(2, 9),
          customerId: selectedCustomer.id,
          date: orderDate.toISOString().split('T')[0],
          type: 'Tahsilat',
          amount: -cartTotal,
          description: `Sipariş Tahsilatı: ${newOrder.id}`
        };
        setTransactions(prev => [...prev, paymentTransaction]);
        
        const newCashTx: CashTransaction = {
          id: Math.random().toString(36).substr(2, 9),
          date: orderDate.toISOString().split('T')[0],
          type: 'Gelir',
          category: 'Satış',
          amount: cartTotal,
          description: `Sipariş Tahsilatı (${selectedCustomer.companyName || selectedCustomer.name}): ${newOrder.id}`,
          customerId: selectedCustomer.id
        };
        setCashTransactions((prev: any) => [...(prev || []), newCashTx]);
        
        // Balance cancels out
        finalBalanceDelta = 0;
      }

      if (finalBalanceDelta !== 0) {
        setCustomers((prev: any) => prev.map((c: any) => {
          if (c.id === selectedCustomer.id) {
            return { ...c, balance: Number(c.balance || 0) + finalBalanceDelta };
          }
          return c;
        }));
      }

      setIsCreateModalOpen(false);
      
      // Auto open print modal for receipt
      setSelectedOrder(newOrder);
      setPrintType('80mm');
      setPrintModalOpen(true);
    } catch (error: any) {
      console.error(error);
      toast.error('Sipariş oluşturulurken bir hata oluştu: ' + error.message);
    }
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    const newOrder: Order = {
      ...selectedOrder,
      status: OrderStatus.SHIPPED,
      cargoProvider: shippingForm.provider,
      cargoTrackingNumber: shippingForm.trackingNumber
    };
    const updatedOrders = orders.map(o => o.id === selectedOrder.id ? newOrder : o);
    setOrders(updatedOrders);
    setIsShippingModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (status: OrderStatus, targetOrder: Order) => {
    if (status === OrderStatus.COMPLETED && (targetOrder.status === OrderStatus.PENDING || targetOrder.status === OrderStatus.PREPARED)) {
       let newProducts = [...rawProducts];
       let stockErrors: string[] = [];
       (targetOrder.items || []).forEach(item => {
          const product = newProducts.find(p => String(p.id) === String(item.productId));
          if (product) {
             const availableStock = getAvailableStock(product);
             if (availableStock < item.quantity) {
                stockErrors.push(`${product.name} (Stok: ${availableStock}, İstenen: ${item.quantity})`);
             }
          }
       });

       if (stockErrors.length > 0) {
          toast.error(`Stok yetersiz:\n${stockErrors.join('\\n')}`);
          return;
       }

       (targetOrder.items || []).forEach(item => {
         const idx = newProducts.findIndex(p => String(p.id) === String(item.productId));
         if (idx !== -1) {
            let p = newProducts[idx];
            let remainingQuantity = item.quantity;
            let newWarehouseStocks = [...(p.warehouseStocks || [])];
            for (let i = 0; i < newWarehouseStocks.length; i++) {
                if (remainingQuantity <= 0) break;
                if (newWarehouseStocks[i].stock > 0) {
                    const deduct = Math.min(newWarehouseStocks[i].stock, remainingQuantity);
                    newWarehouseStocks[i] = { ...newWarehouseStocks[i], stock: newWarehouseStocks[i].stock - deduct };
                    remainingQuantity -= deduct;
                }
            }
            newProducts[idx] = { 
                ...p, 
                stock: Math.max(0, p.stock - item.quantity),
                warehouseStocks: newWarehouseStocks
            };
         }
       });
       setProducts(newProducts);
    }

    // Check if we're cancelling
    if (status === OrderStatus.CANCELLED && targetOrder.status !== OrderStatus.CANCELLED) {
      if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz? (Sipariş tutarı cariden düşülecektir)')) {
         return;
      }

      // Add cancellation transaction
      const cancellationTx: CustomerTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: targetOrder.customerId,
        date: new Date().toISOString().split('T')[0],
        type: 'Tahsilat',
        amount: -(targetOrder.total || (targetOrder as any).totalAmount || 0),
        description: `Sipariş İptali: ${targetOrder.id}`
      };
      setTransactions(prev => [...prev, cancellationTx]);

      // Deduct from customer balance
      setCustomers((prev: any) => prev.map((c: any) => {
        if (c.id === targetOrder.customerId) {
          return { ...c, balance: Number(c.balance || 0) - (targetOrder.total || (targetOrder as any).totalAmount || 0) };
        }
        return c;
      }));
      
      // Restore stock only if it was completed and stock was actually deducted
      if (targetOrder.status === OrderStatus.COMPLETED || targetOrder.status === OrderStatus.SHIPPED) {
        let newProducts = [...rawProducts];
        (targetOrder.items || []).forEach(item => {
          const idx = newProducts.findIndex(p => String(p.id) === String(item.productId));
          if (idx !== -1) {
            let p = newProducts[idx];
            let newWarehouseStocks = [...(p.warehouseStocks || [])];
            if (newWarehouseStocks.length > 0) {
               newWarehouseStocks[0] = { ...newWarehouseStocks[0], stock: newWarehouseStocks[0].stock + item.quantity };
            }
            newProducts[idx] = { 
                ...p, 
                stock: p.stock + item.quantity,
                warehouseStocks: newWarehouseStocks
            };
          }
        });
        setProducts(newProducts);
      }
    }

    const updatedOrders = orders.map(o => 
      o.id === targetOrder.id ? { ...o, status } : o
    );
    setOrders(updatedOrders);
    
    // Optimistic UI update for modal
    if (selectedOrder && selectedOrder.id === targetOrder.id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const handlePrintClick = (order: Order) => {
    setSelectedOrder(order);
    setPrintType('80mm'); // Default to receipt for quick print
    setPrintModalOpen(true);
  };

  const handleGenerateLink = async () => {
    if (!selectedOrder) return;
    try {
      const link = `${window.location.origin}?public_form=${selectedOrder.id}&type=order&t=${sessionStorage.getItem('esila_tenant_id') || '1111111111'}`;
      await navigator.clipboard.writeText(link);
      toast.success('Bağlantı panoya kopyalandı!');
    } catch (err: any) {
      toast.error('Bağlantı kopyalanamadı: ' + err.message);
    }
  };

  const handlePrint = () => {
    if (printType === '80mm' && selectedOrder) {
      import('../lib/printUtils').then(({ generateThermalReceiptHtml, printHtml }) => {
        const html = generateThermalReceiptHtml({
          storeName: store.settings?.companyName || 'ESİLA TİCARİ',
          storeAddress: store.settings?.address || '',
          storePhone: store.settings?.phone || '',
          taxOffice: store.settings?.taxOffice || '',
          taxNumber: store.settings?.taxNumber || '',
          companyLogo: store.settings?.companyLogo,
          date: formatDate(selectedOrder.date),
          receiptNumber: selectedOrder.id,
          customerName: selectedOrder.customerName,
          items: selectedOrder.items.map(i => ({
            name: i.productName,
            quantity: i.quantity,
            price: i.price * (1 + (i.taxRate || 0) / 100),
            total: (i.price * i.quantity) * (1 + (i.taxRate || 0) / 100)
          })),
          subTotal: selectedOrder.subTotal,
          taxTotal: selectedOrder.taxTotal,
          total: selectedOrder.total || (selectedOrder as any).totalAmount || 0,
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    return dateStr;
  };

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.COMPLETED: return 'text-emerald-600 bg-emerald-50';
      case OrderStatus.PREPARED: return 'text-purple-600 bg-purple-50';
      case OrderStatus.PENDING: return 'text-orange-600 bg-orange-50';
      case OrderStatus.CANCELLED: return 'text-red-600 bg-red-50';
      case OrderStatus.SHIPPED: return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredOrders = React.useMemo(() => {
    return [...orders].filter(order => {
      const ms = searchTerm.toLowerCase();
      const matchSearch = (order.customerName || '').toLowerCase().includes(ms) || (order.id || '').toLowerCase().includes(ms);
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchDate = !dateFilter || new Date(order.date).toISOString().split('T')[0] === dateFilter;
      return matchSearch && matchStatus && matchDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = itemsPerPage === -1 ? filteredOrders : filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = () => {
    import('../lib/utils').then(({ exportToCSV }) => {
      const data = filteredOrders.map(o => ({
        'Sipariş No': o.id,
        'Müşteri': o.customerName,
        'Tarih': o.date,
        'Durum': o.status,
        'Toplam Tutar': o.total
      }));
      exportToCSV(data, 'siparisler_listesi');
    });
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ShoppingCart size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Siparişler modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Siparişler</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors border border-gray-200"
            >
              Dışa Aktar
            </button>
            {canCreate && (
              <button 
                onClick={handleOpenCreateModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Yeni Sipariş</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">Arama</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Adı veya Sipariş No..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
            <select
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              {Object.values(OrderStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
            <input
              type="date"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
             <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <X size={16} />
                <span>Temizle</span>
              </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Sipariş No</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Sipariş bulunamadı.
                    </td>
                 </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                      className="text-emerald-600 hover:text-emerald-800 hover:underline font-semibold"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.date)}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {(order.total || (order as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                    {order.currency && order.currency !== 'TRY' && (
                        <div className="text-xs text-gray-500 font-normal">
                          Kur: {order.exchangeRate}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.cargoTrackingNumber && (
                        <div className="text-xs text-blue-600 mt-1" title={order.cargoProvider}>
                          Takip: {order.cargoTrackingNumber}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                    {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARED) && (
                      <button
                        onClick={() => handleStatusChange(OrderStatus.COMPLETED, order)}
                        className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                        title="Siparişi Onayla"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARED || order.status === OrderStatus.COMPLETED) && (
                      <button
                        onClick={() => handleStatusChange(OrderStatus.CANCELLED, order)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Siparişi İptal Et"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrintClick(order)}
                      className="text-gray-500 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                      title="Fiş Yazdır"
                    >
                      <Printer size={18} />
                    </button>
                    {store.eInvoices?.some(inv => inv.orderId === order.id) ? (
                      <span className="text-gray-400 p-2" title="Zaten Faturalandırıldı">
                        <CheckCircle size={18} />
                      </span>
                    ) : (
                      <button 
                        onClick={() => { setEFaturaOrder(order); setEFaturaModalOpen(true); }}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                        title="E-Faturaya Dönüştür"
                      >
                        <FileDigit size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredOrders.length}
        />
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileText className="text-emerald-600" />
                Sipariş Detayı
              </h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Müşteri Bilgileri</h4>
                  <p className="font-medium text-gray-800">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Sipariş Bilgileri</h4>
                  <p><span className="text-gray-500">No:</span> <span className="font-medium text-gray-800">{selectedOrder.id}</span></p>
                  <p><span className="text-gray-500">Tarih:</span> <span className="font-medium text-gray-800">{formatDate(selectedOrder.date)}</span></p>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                  {selectedOrder.cargoTrackingNumber && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2 text-sm">
                      <p className="font-semibold text-blue-800">{selectedOrder.cargoProvider}</p>
                      <p className="text-blue-600">Takip No: {selectedOrder.cargoTrackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <h4 className="text-sm font-semibold text-gray-500 mb-3 border-b pb-2">Sipariş Kalemleri</h4>
              <table className="w-full text-left mb-4">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="py-2 px-3">Ürün</th>
                    <th className="py-2 px-3 text-right">Miktar</th>
                    <th className="py-2 px-3 text-right">Birim Fiyat</th>
                    <th className="py-2 px-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} className="text-sm text-gray-800">
                      <td className="py-2 px-3">{item.productName}</td>
                      <td className="py-2 px-3 text-right">{item.quantity} {item.unit || 'Adet'}</td>
                      <td className="py-2 px-3 text-right">
                        {(item.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {(item.quantity * item.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <div className="w-64">
                   <div className="flex justify-between items-center text-lg font-bold">
                     <span className="text-gray-600">Genel Toplam:</span>
                     <span className="text-emerald-600">
                       {(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                     </span>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-xl">
               <div className="flex flex-wrap gap-2">
                 {(selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.PREPARED) && (
                   <button 
                     onClick={() => handleStatusChange(OrderStatus.COMPLETED, selectedOrder)}
                     className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors font-medium flex items-center gap-2"
                   >
                     <CheckCircle size={16} /> Onayla
                   </button>
                 )}
                 {(selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.PREPARED || selectedOrder.status === OrderStatus.COMPLETED) && (
                   <button 
                     onClick={() => handleStatusChange(OrderStatus.CANCELLED, selectedOrder)}
                     className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                   >
                     <XCircle size={16} /> İptal Et
                   </button>
                 )}
                 {selectedOrder.status === OrderStatus.COMPLETED && (
                   <button 
                     onClick={() => setIsShippingModalOpen(true)}
                     className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                   >
                     <Truck size={16} /> Kargola
                   </button>
                 )}
               </div>
               <div className="flex gap-3 flex-wrap">
                 <button 
                   onClick={handleGenerateLink}
                   className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                   title="Bağlantı kopyala (Giriş gerektirmez)"
                 >
                   <Link size={18} />
                   Link
                 </button>
                 {!store.eInvoices?.some(inv => inv.orderId === selectedOrder.id) ? (
                   <button 
                     onClick={() => {
                       setIsDetailsModalOpen(false);
                       setEFaturaOrder(selectedOrder);
                       setEFaturaModalOpen(true);
                     }}
                     className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                   >
                     <FileDigit size={18} />
                     E-Fatura Kes
                   </button>
                 ) : (
                   <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed" title="Bu sipariş zaten faturalandırılmıştır.">
                     <CheckCircle size={18} />
                     Faturalandı
                   </div>
                 )}
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
                   Hızlı Fiş Yazdır
                 </button>
                 <button 
                   onClick={() => setIsDetailsModalOpen(false)} 
                   className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                 >
                   Kapat
                 </button>
                 {(() => {
                   const customer = store.customers.find(c => c.id === selectedOrder.customerId);
                   if (!customer?.phone) return null;
                   return (
                     <div className="relative group">
                       <button className="px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors font-medium flex items-center gap-2">
                         <MessageCircle size={18} />
                       </button>
                       <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col overflow-hidden">
                         <button 
                           onClick={() => {
                             const text = `Sayın ${customer.companyName || customer.name}, ${selectedOrder.id} numaralı siparişiniz başarıyla alınmıştır. Toplam tutar: ${(selectedOrder.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL. Bizi tercih ettiğiniz için teşekkür ederiz. - ${store.settings?.companyName || 'Şirket'}`;
                             window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                           }}
                           className="px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b"
                         >
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                           Sipariş Onayı (Hazırlanıyor)
                         </button>
                         <button 
                           onClick={() => {
                             const text = `Sayın ${customer.companyName || customer.name}, ${selectedOrder.id} numaralı siparişiniz tamamlanmış olup teslimata/kargoya hazırdır. Bizi tercih ettiğiniz için teşekkür ederiz. - ${store.settings?.companyName || 'Şirket'}`;
                             window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                           }}
                           className="px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b"
                         >
                           <CheckCircle size={14} className="text-gray-500" />
                           Sipariş Tamamlandı
                         </button>
                         <button 
                           onClick={() => {
                             const text = `Sayın ${customer.companyName || customer.name}, ${selectedOrder.id} numaralı siparişinize istinaden ${(selectedOrder.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL tutarında ödemenizi beklemekteyiz. Hesap bilgilerimize veya ödeme linkinize portalımız üzerinden ulaşabilirsiniz. Teşekkürler. - ${store.settings?.companyName || 'Şirket'}`;
                             window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                           }}
                           className="px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                         >
                           <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                           Ödeme Hatırlatma
                         </button>
                       </div>
                     </div>
                   );
                 })()}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-emerald-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                <ShoppingCart className="text-emerald-600" />
                Yeni Sipariş Oluştur
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:p-6">
                
                {/* Left Column: Selection */}
                <div className="md:col-span-1 space-y-6">
                  {/* Customer Select */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User size={16} /> Müşteri Seçimi
                    </label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      onChange={(e) => {
                        const cust = customers.find(c => c.id === e.target.value);
                        setSelectedCustomer(cust || null);
                      }}
                      value={selectedCustomer?.id || ''}
                    >
                      <option value="">Seçiniz...</option>
                      {customers.filter(c => c.type === 'Alıcı').map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                      ))}
                    </select>
                    {selectedCustomer && (
                       <div className="mt-3 text-xs text-gray-500 bg-white p-2 rounded border">
                          <p>Bakiye: {Number(selectedCustomer?.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                          <p>{selectedCustomer.address}</p>
                       </div>
                    )}
                  </div>

                  {/* Product Add */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Plus size={16} /> Ürün Ekle
                    </label>
                    <div className="space-y-3">
                      <div className="space-y-2 mb-3">
                        <input 
                          type="text"
                          placeholder="Ürün Ara (Ad veya Barkod/Kod)..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                        <div className="w-full border border-gray-300 rounded-lg overflow-y-auto max-h-32 bg-white flex flex-col text-sm">
                          {products.filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch)).map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => setSelectedProductToAdd(String(p.id))}
                              className={`px-3 py-2 cursor-pointer border-b last:border-b-0 hover:bg-emerald-50 ${selectedProductToAdd === String(p.id) ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-700'}`}
                            >
                              {p.code} - {p.name} - {(p.price || 0).toLocaleString('tr-TR')}₺
                            </div>
                          ))}
                          {products.filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch)).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center">Sonuç bulunamadı</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <input 
                          type="number" 
                          min="0.01"
                          step="0.01"
                          title="Miktar"
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 text-sm"
                          value={quantityToAdd}
                          onChange={(e) => setQuantityToAdd(parseFloat(e.target.value) || 1)}
                        />
                        {selectedProductToAdd && (
                          <span className="text-sm font-medium text-gray-600">
                            {products.find(p => String(p.id) === selectedProductToAdd)?.unit || 'Adet'}
                          </span>
                        )}
                        <select 
                          title="KDV Oranı"
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 text-sm"
                          value={taxToAdd}
                          onChange={(e) => setTaxToAdd(parseInt(e.target.value))}
                        >
                          <option value="0">%0</option>
                          <option value="1">%1</option>
                          <option value="10">%10</option>
                          <option value="20">%20</option>
                        </select>
                        <button 
                          onClick={addItemToCart}
                          disabled={!selectedProductToAdd}
                          className="flex-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                          Listeye Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Basket */}
                <div className="md:col-span-2 flex flex-col h-full">
                  <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm text-gray-600 flex">
                      <div className="flex-1">Ürün</div>
                      <div className="w-16 text-center">Adet</div>
                      <div className="w-16 text-center">KDV</div>
                      <div className="w-24 text-right">Tutar</div>
                      <div className="w-10"></div>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-white p-2 space-y-1">
                      {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <ShoppingCart size={48} className="mb-2 opacity-20" />
                          <p>Sepetiniz boş</p>
                        </div>
                      ) : (
                        cartItems.map((item, idx) => (
                          <div key={idx} className="flex items-center p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-colors text-sm">
                             <div className="flex-1 font-medium text-gray-800">{item.productName}</div>
                             <div className="w-16 text-center text-gray-600">{item.quantity}</div>
                             <div className="w-16 text-center text-gray-500 text-xs">%{item.taxRate || 0}</div>
                             <div className="w-24 text-right font-semibold text-gray-800">
                               {Number(((item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100))) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                             </div>
                             <div className="w-10 flex justify-end">
                               <button 
                                 onClick={() => removeItemFromCart(idx)}
                                 className="text-red-400 hover:text-red-600 p-1"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 border-t border-gray-200">
                       <div className="flex justify-between items-center mb-1">
                         <label className="text-sm font-medium text-gray-700">Sipariş Notu</label>
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
                         className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 min-h-[60px]"
                         placeholder="Siparişle ilgili notlarınızı buraya yazabilir veya sesli olarak ekleyebilirsiniz."
                         value={orderNotes}
                         onChange={e => setOrderNotes(e.target.value)}
                       ></textarea>
                    </div>
                    
                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Para Birimi:</label>
                          <select 
                            value={orderCurrency}
                            onChange={(e) => {
                              setOrderCurrency(e.target.value);
                              if (e.target.value !== 'TRY' && exchangeRatesList.length === 0) {
                                fetchExchangeRates();
                              } else if (e.target.value !== 'TRY') {
                                const matched = exchangeRatesList.find(r => r.Kod === e.target.value);
                                if (matched) setExchangeRate(matched.Rate);
                              } else {
                                setExchangeRate(1);
                              }
                            }}
                            className="p-1 border border-gray-300 rounded text-sm bg-white"
                          >
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>
                        {orderCurrency !== 'TRY' && (
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>Güncel Kur:</span>
                            <div className="flex flex-col text-right">
                                {ratesLoading ? <span>Kurlar yükleniyor...</span> : 
                                    <input 
                                        type="number" step="0.01" 
                                        className="w-20 p-1 text-right border border-gray-300 rounded text-xs" 
                                        value={exchangeRate} 
                                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)} 
                                    />
                                }
                            </div>
                            <button onClick={fetchExchangeRates} className="p-1 hover:bg-gray-200 rounded text-blue-500" title="TCMB Kur Yenile"><RefreshCw size={14} /></button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
                        <span>Ara Toplam</span>
                        <span>{Number(cartSubTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: orderCurrency })}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                        <span>KDV Tutarı</span>
                        <span>{Number(cartTaxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: orderCurrency })}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-200">
                        <span className="text-gray-800 font-bold">Genel Toplam</span>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-emerald-600 block">
                              {Number(cartTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: orderCurrency })}
                            </span>
                            {orderCurrency !== 'TRY' && (
                                <span className="text-xs text-gray-500 block">
                                  TRY Karşılığı: {Number((cartTotal * exchangeRate) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                </span>
                            )}
                        </div>
                      </div>
                      
                      {cartTotal > 0 && selectedCustomer && (
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <input 
                            type="checkbox" 
                            id="isPaid"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <label htmlFor="isPaid" className="text-sm text-gray-700 select-none">
                            Tutar peşin olarak tahsil edildi (Kasa ve Cari'ye işlenecek)
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={!selectedCustomer || cartItems.length === 0}
                className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle size={20} />
                Siparişi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {isShippingModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                <Truck className="text-blue-600" />
                Kargolama İşlemi
              </h3>
              <button onClick={() => setIsShippingModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleShipSubmit} className="p-4 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Firması</label>
                  <select 
                    value={shippingForm.provider}
                    onChange={(e) => setShippingForm({...shippingForm, provider: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                    <option value="Aras Kargo">Aras Kargo</option>
                    <option value="MNG Kargo">MNG Kargo</option>
                    <option value="Sürat Kargo">Sürat Kargo</option>
                    <option value="PTT Kargo">PTT Kargo</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Takip Numarası (Opsiyonel)</label>
                  <input 
                    type="text" 
                    value={shippingForm.trackingNumber}
                    onChange={(e) => setShippingForm({...shippingForm, trackingNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Gönderi takip kodu"
                  />
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsShippingModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">İptal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Siparişi Kargola</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-lg">Makbuz Yazdır</h3>
              <button onClick={() => setPrintModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-4 flex gap-4 border-b bg-gray-50">
               <button 
                 onClick={() => setPrintType('80mm')}
                 className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${printType === '80mm' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}
               >
                 <div className="flex flex-col items-center gap-1">
                   <FileText size={24} />
                   <span className="font-medium">80mm Termal (Fiş)</span>
                 </div>
               </button>
               <button 
                 onClick={() => setPrintType('A4')}
                 className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${printType === 'A4' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}
               >
                 <div className="flex flex-col items-center gap-1">
                   <FileText size={24} className="scale-125" />
                    <span className="font-medium">A4 Normal</span>
                  </div>
                </button>
             </div>

             <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-200 flex justify-center">
              {/* Preview Area */}
              <div className={`bg-white text-black transition-all duration-300 ${printType === '80mm' ? 'w-[300px] shadow-lg p-4' : 'w-[800px] shadow-xl'}`}>
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
                        <h2 className="text-center text-2xl font-bold mb-10 tracking-wider">SİPARİŞ FORMU</h2>
                        
                        <div className="flex justify-between mb-8">
                           <div className="flex items-center gap-2">
                              <span className="font-semibold w-24">Sipariş No</span>
                              <span>: {selectedOrder.id}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="font-semibold w-28">Tarih</span>
                              <span>: {formatDate(selectedOrder.date)}</span>
                           </div>
                        </div>

                        <div className="mb-8">
                           <h3 className="font-bold mb-4">Müşteri Bilgileri :</h3>
                           <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                              <span className="font-semibold">Firma Adı</span>
                              <span className="border-b border-black pb-1">: {selectedOrder.customerName || '______________________________________'}</span>
                           </div>
                           <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                              <span className="font-semibold">Satıcı</span>
                              <span className="border-b border-black pb-1">: {store.settings.companyName || '______________________________________'}</span>
                           </div>
                        </div>

                        <div className="mb-4">
                           <h3 className="font-bold mb-4">Sipariş Detayları :</h3>
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
                               {selectedOrder.items.map((item, idx) => {
                                 const netAmount = (item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100));
                                 return (
                                   <tr key={idx}>
                                     <td className="border border-black text-left">{item.productName}</td>
                                     <td className="border border-black text-center">{item.quantity}</td>
                                     <td className="border border-black text-right">
                                       {(item.price || (item as any).unitPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
                                    <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                    <span className="font-bold">KDV Tutarı :</span>
                                    <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mt-4 text-right">
                                    <span className="font-bold">Genel Toplam :</span>
                                    <span className="font-bold">{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="mt-8 flex justify-between items-start">
                           <div>
                             <h3 className="font-bold mb-2">Notlar :</h3>
                             <div className="text-sm whitespace-pre-line">
                               {selectedOrder.notes && <div className="mb-4">{selectedOrder.notes}</div>}
                               <div>{store.settings.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.'}</div>
                             </div>
                           </div>
                           <div className="text-center">
                             <QRCodeSVG value={`${window.location.origin}?public_form=${selectedOrder.id}&type=order&t=${sessionStorage.getItem('esila_tenant_id') || '1111111111'}`} size={80} level="M" />
                             <p className="text-[10px] mt-1 text-gray-500">Siparişi Doğrula</p>
                           </div>
                        </div>

                        <div className="flex justify-between px-10 text-center mt-16">
                           <div>
                             <p className="font-bold mb-8">Teslim Eden</p>
                             <div className="flex items-end gap-2">
                                <span>İmza :</span>
                                <span className="inline-block w-48 border-b border-black"></span>
                             </div>
                           </div>
                           <div>
                             <p className="font-bold mb-8">Teslim Alan</p>
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
                   <div style={{ fontSize: '12px' }}>
                     <div className="text-center mb-6">
                        {store.settings.companyLogo ? (
                          <img src={store.settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                        ) : (
                          <h1 className="font-logo text-4xl mb-2 text-black">{store.settings.printer_header_text || 'esila'}</h1>
                        )}
                        <p className="text-xs font-medium">{store.settings.companyName}</p>
                        <p className="text-xs whitespace-pre-line">{store.settings.address}</p>
                        {store.settings.taxOffice && store.settings.taxNumber && (
                          <p className="text-xs mt-1">{store.settings.taxOffice} - VKN: {store.settings.taxNumber}</p>
                        )}
                        <p className="text-xs uppercase mt-2 font-bold tracking-widest border-y border-black py-1">Sipariş Fişi</p>
                     </div>
                     
                     <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
                     
                     <div className="mb-4">
                        <p><strong>Tarih:</strong> {formatDate(selectedOrder.date)}</p>
                        <p><strong>Sipariş No:</strong> {selectedOrder.id}</p>
                        <p><strong>Müşteri:</strong> {selectedOrder.customerName}</p>
                     </div>

                     <table className="w-full mb-4">
                       <thead>
                         <tr className="border-b border-gray-300 text-left">
                           <th className="py-1">Ürün</th>
                           <th className="py-1 text-right">Mik.</th>
                           <th className="py-1 text-right">Tutar</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedOrder.items.map((item, idx) => (
                           <tr key={idx} className="border-b border-gray-100">
                             <td className="py-1">{item.productName}</td>
                             <td className="py-1 text-right">{item.quantity}</td>
                             <td className="py-1 text-right">
                               {Number(((item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100))) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>

                     <div className="flex justify-end mb-6">
                       <div className="text-right w-full border-t border-gray-300 pt-2 border-dashed mt-2">
                         <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                           <span>Ara Toplam:</span>
                           <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                           <span>KDV:</span>
                           <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-1 mt-1">
                           <span>Genel Toplam:</span>
                           <span>{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                         </div>
                       </div>
                     </div>

                     <div className="text-center text-xs text-gray-500 mt-8 flex flex-col items-center">
                       <QRCodeSVG value={`${window.location.origin}?public_form=${selectedOrder.id}&type=order&t=${sessionStorage.getItem('esila_tenant_id') || '1111111111'}`} size={64} level="M" className="mb-2" />
                       <p className="mb-2">Siparişi Doğrula</p>
                       <p className="whitespace-pre-line">{store.settings.printer_footer_text}</p>
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setPrintModalOpen(false)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Kapat
              </button>
              <button 
                onClick={handlePrint} 
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Printer size={18} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Print Content (Hidden normally, shown on print) */}
      {selectedOrder && (
        <div className="print-only">
          <div className="mx-auto">
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
                    
                    <div className="flex flex-col items-center justify-center mb-8 border-b-2 pb-6" style={{ borderColor: store.settings?.invoiceTemplate_color || '#000' }}>
                      {store.settings?.companyLogo && (
                        <img src={store.settings.companyLogo} alt="Logo" className="max-h-24 object-contain mb-4" />
                      )}
                      <h2 className="text-center text-3xl font-bold tracking-wider" style={{ color: store.settings?.invoiceTemplate_color || '#000' }}>SİPARİŞ FORMU</h2>
                      <p className="text-md font-semibold mt-2">{store.settings?.companyName || ''}</p>
                    </div>
                    
                    <div className="flex justify-between mb-8">
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2">
                            <span className="font-semibold w-24">Sipariş No</span>
                            <span>: {selectedOrder.id}</span>
                         </div>
                       </div>
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2">
                            <span className="font-semibold w-28">Sipariş Tarihi</span>
                            <span>: {formatDate(selectedOrder.date)}</span>
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold w-28">Yazdırma Zamanı</span>
                            <span>: {new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                       </div>
                    </div>

                    <div className="mb-8">
                       <h3 className="font-bold mb-4">Müşteri Bilgileri :</h3>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Firma Adı</span>
                          <span className="border-b border-black pb-1">: {selectedOrder.customerName || '______________________________________'}</span>
                       </div>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Satıcı</span>
                          <span className="border-b border-black pb-1">: {store.settings.companyName || '______________________________________'}</span>
                       </div>
                    </div>

                    <div className="mb-4">
                       <h3 className="font-bold mb-4">Sipariş Detayları :</h3>
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
                           {selectedOrder.items.map((item, idx) => {
                             const netAmount = (item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100));
                             return (
                               <tr key={idx}>
                                 <td className="border border-black text-left">{item.productName}</td>
                                 <td className="border border-black text-center">{item.quantity}</td>
                                 <td className="border border-black text-right">
                                   {Number(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
                                <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                <span className="font-bold">KDV Tutarı :</span>
                                <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mt-4 text-right">
                                <span className="font-bold">Genel Toplam :</span>
                                <span className="font-bold">{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 flex justify-between items-start">
                       <div>
                         <h3 className="font-bold mb-2">Notlar :</h3>
                         <div className="text-sm whitespace-pre-line">
                           {selectedOrder.notes && <div className="mb-4">{selectedOrder.notes}</div>}
                           <div>{store.settings.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.'}</div>
                         </div>
                       </div>
                       <div className="text-center">
                         <QRCodeSVG value={`${window.location.origin}?public_form=${selectedOrder.id}&type=order&t=${sessionStorage.getItem('esila_tenant_id') || '1111111111'}`} size={80} level="M" />
                         <p className="text-[10px] mt-1 text-gray-500">Siparişi Doğrula</p>
                       </div>
                    </div>

                    <div className="flex justify-between px-10 text-center mt-16">
                       <div>
                         <p className="font-bold mb-8">Teslim Eden</p>
                         <div className="flex items-end gap-2">
                            <span>İmza :</span>
                            <span className="inline-block w-48 border-b border-black"></span>
                         </div>
                       </div>
                       <div>
                         <p className="font-bold mb-8">Teslim Alan</p>
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
               <div className="w-[300px] mx-auto text-black" style={{ fontSize: '12px' }}>
                 <div className="text-center mb-6">
                    {store.settings.companyLogo ? (
                      <img src={store.settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                    ) : (
                      <h1 className="font-logo text-4xl mb-2 text-black">{store.settings.printer_header_text || 'esila'}</h1>
                    )}
                    <p className="text-xs font-medium">{store.settings.companyName}</p>
                    <p className="text-xs whitespace-pre-line">{store.settings.address}</p>
                    {store.settings.taxOffice && store.settings.taxNumber && (
                       <p className="text-xs mt-1">{store.settings.taxOffice} - VKN: {store.settings.taxNumber}</p>
                    )}
                    <p className="text-xs uppercase mt-2 font-bold tracking-widest border-y border-black py-1">Sipariş Fişi</p>
                 </div>
                 
                 <div className="mb-4 text-sm">
                    <p><strong>Tarih:</strong> {formatDate(selectedOrder.date)}</p>
                    <p><strong>Yazdırılma:</strong> {new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Fiş No:</strong> {selectedOrder.id}</p>
                    <p><strong>Müşteri:</strong> {selectedOrder.customerName}</p>
                 </div>

                 <table className="w-full mb-4 text-sm">
                   <thead>
                     <tr className="border-b border-black text-left">
                       <th className="py-1">Ürün</th>
                       <th className="py-1 text-right">Adet</th>
                       <th className="py-1 text-right">Tutar</th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedOrder.items.map((item, idx) => (
                       <tr key={idx} className="border-b border-gray-300">
                         <td className="py-1">{item.productName}</td>
                         <td className="py-1 text-right">{item.quantity}</td>
                         <td className="py-1 text-right">
                           {Number((item.price * item.quantity) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>

                 <div className="flex justify-end mb-6">
                   <div className="text-right w-full border-t border-black pt-2 border-dashed mt-2">
                     <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                       <span>Ara Toplam:</span>
                       <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                       <span>KDV:</span>
                       <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                     </div>
                     <div className="flex justify-between items-center text-lg font-bold border-t border-black pt-1 mt-1">
                       <span>Genel Toplam:</span>
                       <span>{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="text-center text-xs mt-8 flex flex-col items-center">
                   <QRCodeSVG value={`${window.location.origin}?public_form=${selectedOrder.id}&type=order&t=${sessionStorage.getItem('esila_tenant_id') || '1111111111'}`} size={64} level="M" className="mb-2" />
                   <p className="mb-2">Siparişi Doğrula</p>
                   <p className="whitespace-pre-line">{store.settings.printer_footer_text || 'Teşekkür Ederiz'}</p>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
      {/* E-Fatura Modal */}
      {eFaturaModalOpen && eFaturaOrder && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                <FileDigit className="text-blue-600" />
                E-Fatura Kes
              </h3>
              <button 
                onClick={() => setEFaturaModalOpen(false)} 
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <p className="text-sm font-medium text-gray-500">Sipariş Bilgileri</p>
                 <div className="flex justify-between items-start mt-1">
                   <div>
                     <p className="text-sm font-bold text-gray-800">{eFaturaOrder.id}</p>
                     <p className="text-sm text-gray-700">{eFaturaOrder.customerName}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-500">Matrah: {Number(currentEFaturaTotals.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                     <p className="text-xs text-gray-500">KDV: {(eFaturaInvoiceType === 'ISTISNA' || eFaturaInvoiceType === 'IHRACAT') ? '%0 (İstisna)' : currentEFaturaTotals.taxTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                     <p className="text-sm font-bold text-gray-800">Tutar: {Number(currentEFaturaTotals.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                   </div>
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Fatura Formatı</label>
                 <select 
                   value={eFaturaType} 
                   onChange={(e) => setEFaturaType(e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                 >
                   <option value="E-Fatura">E-Fatura (Mükellef)</option>
                   <option value="E-Arşiv">E-Arşiv (Son Tüketici)</option>
                 </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Fatura Türü (GİB)</label>
                 <select 
                   value={eFaturaInvoiceType} 
                   onChange={(e) => {
                     const newType = e.target.value;
                     setEFaturaInvoiceType(newType);
                     if (newType === 'ISTISNA' || newType === 'IHRACAT') {
                       toast(`Fatura türü ${newType === 'ISTISNA' ? 'İstisna' : 'İhracat'} olarak seçildiği için KDV oranı otomatik olarak %0 şeklinde güncellendi.`, {
                         icon: 'ℹ️',
                         duration: 5000
                       });
                     } else if (eFaturaInvoiceType === 'ISTISNA' || eFaturaInvoiceType === 'IHRACAT') {
                         toast.success('Fatura türü değiştirildiği için KDV tutarı eski haline getirildi.', { duration: 4000 });
                     }
                   }}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                 >
                   <option value="SATIS">Satış</option>
                   <option value="IADE">İade</option>
                   <option value="TEVKIFAT">Tevkifat</option>
                   <option value="ISTISNA">İstisna</option>
                   <option value="OZELMATRAH">Özel Matrah</option>
                   <option value="IHRACKAYITLI">İhraç Kayıtlı</option>
                   <option value="SGK">SGK</option>
                 </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Senaryo Türü</label>
                 <select 
                   value={eFaturaScenario} 
                   onChange={(e) => setEFaturaScenario(e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                 >
                   <option value="TICARIFATURA">Ticari Fatura</option>
                   <option value="TEMELFATURA">Temel Fatura</option>
                   <option value="EARSIVFATURA">E-Arşiv Fatura</option>
                   <option value="KAMUFATURA">Kamu Faturası</option>
                   <option value="YOLCUBERABERFATURA">Yolcu Beraberi Fatura</option>
                   <option value="IHRACAT">İhracat Faturası</option>
                 </select>
              </div>

              {(eFaturaInvoiceType === 'ISTISNA' || eFaturaInvoiceType === 'TEVKIFAT' || eFaturaInvoiceType === 'IHRACAT') && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     {eFaturaInvoiceType === 'TEVKIFAT' ? 'Tevkifat Kodu' : 'İstisna / Muafiyet Kodu'}
                   </label>
                   <input 
                     type="text" 
                     value={eFaturaExceptionCode}
                     onChange={(e) => setEFaturaExceptionCode(e.target.value)}
                     className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                     placeholder={eFaturaInvoiceType === 'TEVKIFAT' ? "Örn: 601" : "Örn: 351"}
                     required
                   />
                </div>
              )}

              <div className="text-xs text-gray-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                 <Cloud className="text-blue-500 shrink-0" size={16} />
                 <p>
                   Bu işlem siparişteki kalemleri ve cari bilgilerini sisteminizdeki e-Dönüşüm portalına (Taslak Fatura olarak) aktaracaktır.
                 </p>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setEFaturaModalOpen(false)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                disabled={eFaturaLoading}
              >
                İptal
              </button>
              <button 
                onClick={async () => {
                  setEFaturaLoading(true);
                  try {
                    const isArsiv = eFaturaType === 'E-Arşiv';
                    const prefix = (isArsiv ? store.settings.prefix_earsiv : store.settings.prefix_efatura) || (isArsiv ? 'ARS' : 'FAT');
                    const nextId = (isArsiv ? store.settings.next_earsiv_id : store.settings.next_efatura_id) || 1;
                    const year = new Date().getFullYear().toString();
                    const formattedId = `${prefix.padEnd(3, 'A').slice(0, 3)}${year}${String(nextId).padStart(9, '0')}`;

                    const invoiceData: any = {
                        id: formattedId,
                        orderId: eFaturaOrder.id,
                        customerName: eFaturaOrder.customerName,
                        amount: currentEFaturaTotals.total,
                        taxTotal: currentEFaturaTotals.taxTotal,
                        subTotal: currentEFaturaTotals.subTotal,
                        type: eFaturaType,
                        invoiceType: eFaturaInvoiceType,
                        scenario: eFaturaScenario,
                        exceptionCode: eFaturaExceptionCode,
                        date: new Date().toISOString(),
                        status: 'Taslak'
                    };
                    
                    if (store.setEInvoices) {
                        store.setEInvoices([...(store.eInvoices || []), invoiceData]);
                    }
                    if (store.setSettings) {
                        store.setSettings({
                            ...store.settings,
                            [isArsiv ? 'next_earsiv_id' : 'next_efatura_id']: nextId + 1
                        });
                    }
                    
                    // Demo için gecikme ekliyoruz
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    setEFaturaModalOpen(false);
                    alert("E-Fatura taslağı başarıyla oluşturuldu.");
                  } catch (error) {
                    alert("E-Fatura gönderimi sırasında bir hata oluştu.");
                  } finally {
                    setEFaturaLoading(false);
                  }
                }}
                disabled={eFaturaLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {eFaturaLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={16} />
                )}
                Taslağı Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};