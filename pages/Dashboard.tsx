import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  Clock 
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
  Line
} from 'recharts';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import { Product } from '../types';

export const Dashboard: React.FC = () => {
  const { customers, transactions } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:p-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
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