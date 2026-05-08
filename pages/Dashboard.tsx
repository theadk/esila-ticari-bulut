import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle 
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

const data = [
  { name: 'Pzt', satis: 4000, cari: 2400 },
  { name: 'Sal', satis: 3000, cari: 1398 },
  { name: 'Çar', satis: 2000, cari: 9800 },
  { name: 'Per', satis: 2780, cari: 3908 },
  { name: 'Cum', satis: 1890, cari: 4800 },
  { name: 'Cmt', satis: 2390, cari: 3800 },
  { name: 'Paz', satis: 3490, cari: 4300 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Yönetim Paneli</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam Satış (Aylık)</p>
            <p className="text-2xl font-bold text-gray-800">₺124,500</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Aktif Cariler</p>
            <p className="text-2xl font-bold text-gray-800">1,204</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam Ürün</p>
            <p className="text-2xl font-bold text-gray-800">856</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Kritik Stok</p>
            <p className="text-2xl font-bold text-gray-800">12</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Haftalık Satış Grafiği</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="satis" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Cari Hareketleri</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="cari" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};