import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { 
  FileText, Search, Filter, ShoppingCart, ShoppingBag, ArrowUpRight, 
  Eye, Calendar, Box, Package, User, Hash, FileCheck, CircleDollarSign
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

export const SiparisListesi: React.FC = () => {
  const store = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getOrderSource = (order: Order) => {
    if (order.proposalId) {
      return { label: 'Tekliften', color: 'bg-indigo-100 text-indigo-700', icon: FileCheck };
    }
    // Simplistic distinction: maybe POS vs standard.
    // For now, if no proposalId, let's treat it as Hızlı Satış / Standart Sipariş
    return { label: 'Hızlı Satış / Sipariş', color: 'bg-emerald-100 text-emerald-700', icon: ShoppingCart };
  };

  const filteredOrders = useMemo(() => {
    let result = [...(store.orders || [])];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.customerName?.toLowerCase().includes(lower) || 
        o.id.toLowerCase().includes(lower)
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [store.orders, searchTerm, statusFilter]);

  const getStatusStyle = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.SHIPPED: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.DELIVERED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Sipariş Listesi
          </h1>
          <p className="text-gray-500 mt-1">
            Hızlı satışlar, tekliften dönüşenler ve tüm standart siparişleriniz.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Sipariş no veya müşteri adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="sm:w-64 relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
          >
            <option value="all">Tüm Durumlar</option>
            {Object.values(OrderStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş No & Kaynak</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const source = getOrderSource(order);
                  const SourceIcon = source.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-900">{order.id.split('-')[0].toUpperCase()}</span>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${source.color}`}>
                            <SourceIcon className="w-3 h-3" />
                            {source.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(order.date).toLocaleDateString('tr-TR', { 
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                          <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                          {(order.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || '₺'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Detay Görüntüle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Sipariş Detayı
                  </h3>
                  <div className="text-sm text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                    #{selectedOrder.id}
                    {selectedOrder.proposalId && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium font-sans">
                        Teklif Ref: {selectedOrder.proposalId.split('-')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Customer & Date Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Müşteri Bilgileri</div>
                  <div className="font-medium text-gray-900">{selectedOrder.customerName}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sipariş Tarihi</div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedOrder.date).toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4 text-gray-400" />
                  Sipariş Kalemleri
                </h4>
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Ürün</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">Miktar</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Birim Fiyat</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {((item.price || 0) * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ara Toplam</span>
                    <span className="font-medium">{(selectedOrder.subTotal || selectedOrder.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}</span>
                  </div>
                  {selectedOrder.taxTotal !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">KDV Toplamı</span>
                      <span className="font-medium">{selectedOrder.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-bold text-gray-900">Genel Toplam</span>
                    <span className="font-bold text-indigo-600 text-lg">{(selectedOrder.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="text-xs font-medium text-amber-800 uppercase tracking-wider mb-2">Sipariş Notu</div>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
