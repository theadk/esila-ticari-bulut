import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save } from 'lucide-react';
import { Customer } from '../types';

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@mail.com', phone: '0555 123 45 67', address: 'İstanbul, Kadıköy', balance: 1500 },
  { id: '2', name: 'Ayşe Demir', email: 'ayse@mail.com', phone: '0532 987 65 43', address: 'Ankara, Çankaya', balance: -500 },
  { id: '3', name: 'Mehmet Kaya', email: 'mehmet@mail.com', phone: '0544 333 22 11', address: 'İzmir, Karşıyaka', balance: 0 },
];

const INITIAL_FORM: Customer = {
  id: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  balance: 0
};

export const Cariler: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setFormData({ ...INITIAL_FORM, id: Math.random().toString(36).substr(2, 9) });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({ ...customer });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu cariyi silmek istediğinizden emin misiniz?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setCustomers(customers.map(c => c.id === formData.id ? formData : c));
    } else {
      setCustomers([...customers, formData]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Cari Hesaplar</h2>
        <button 
          onClick={handleAddNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Yeni Cari Ekle</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Cari Adı</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Adres</th>
                <th className="px-6 py-4">Bakiye</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{customer.name}</div>
                      <div className="text-sm text-gray-500">#{customer.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail size={14} className="text-emerald-500" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-emerald-500" /> {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        {customer.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${customer.balance > 0 ? 'text-emerald-600' : customer.balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {Number(customer.balance).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(customer)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Cari Düzenle' : 'Yeni Cari Ekle'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad / Ünvan</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea 
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Bakiyesi</label>
                <input 
                  type="number" 
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};