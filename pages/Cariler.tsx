import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save, Building, User } from 'lucide-react';
import { Customer } from '../types';

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', customerType: 'Bireysel', name: 'Ahmet Yılmaz', type: 'Alıcı', email: 'ahmet@mail.com', phone: '0555 123 45 67', address: 'İstanbul, Kadıköy', balance: 1500, status: 'Aktif' },
  { id: '2', customerType: 'Kurumsal', name: '', companyTitle: 'Demir Ticaret A.Ş.', type: 'Satıcı', email: 'ayse@mail.com', phone: '0532 987 65 43', address: 'Ankara, Çankaya', balance: -500, status: 'Aktif' },
  { id: '3', customerType: 'Bireysel', name: 'Mehmet Kaya', type: 'Alıcı', email: 'mehmet@mail.com', phone: '0544 333 22 11', address: 'İzmir, Karşıyaka', balance: 0, status: 'Aktif' },
];

const INITIAL_FORM: Customer = {
  id: '',
  customerType: 'Bireysel',
  name: '',
  companyTitle: '',
  email: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  taxOffice: '',
  taxNumber: '',
  iban: '',
  type: 'Alıcı',
  balance: 0,
  status: 'Aktif'
};

interface Province {
  id: number;
  name: string;
  districts: { id: number; name: string }[];
}

export const Cariler: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') {
          // Sort alphabetically
          const sorted = data.data.sort((a: Province, b: Province) => a.name.localeCompare(b.name, 'tr'));
          setProvinces(sorted);
        }
      })
      .catch(err => console.error("Could not fetch provinces:", err));
  }, []);

  useEffect(() => {
    if (formData.city) {
      const selectedProvince = provinces.find(p => p.name === formData.city);
      if (selectedProvince) {
        setDistricts(selectedProvince.districts.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [formData.city, provinces]);

  const filteredCustomers = customers.filter(c => {
    const searchStr = searchTerm.toLowerCase();
    const matchName = c.name?.toLowerCase().includes(searchStr);
    const matchTitle = c.companyTitle?.toLowerCase().includes(searchStr);
    const matchEmail = c.email?.toLowerCase().includes(searchStr);
    return matchName || matchTitle || matchEmail;
  });

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
                <th className="px-6 py-4">Cari Türü</th>
                <th className="px-6 py-4">Cari Adı / Ünvan</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Adres</th>
                <th className="px-6 py-4">Bakiye</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.customerType === 'Kurumsal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {customer.customerType === 'Kurumsal' ? <Building size={12} /> : <User size={12} />}
                        {customer.customerType}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{customer.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {customer.customerType === 'Kurumsal' ? customer.companyTitle : customer.name}
                      </div>
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
                        <MapPin size={14} className="text-gray-400 min-w-[14px]" />
                        <span className="truncate max-w-[200px]">
                          {customer.city ? `${customer.city}${customer.district ? `, ${customer.district}` : ''}` : customer.address}
                        </span>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-xl text-gray-800">{isEditing ? 'Cari Düzenle' : 'Yeni Cari Ekle'}</h3>
                <p className="text-sm text-gray-500 mt-1">Müşteri veya tedarikçi bilgilerini eksiksiz doldurun.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              {/* Tip Secimleri */}
              <div className="flex gap-6 pb-4 border-b">
                <div className="flex-1">
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Cari Türü</label>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customerType" 
                          value="Bireysel" 
                          checked={formData.customerType === 'Bireysel'}
                          onChange={(e) => setFormData({...formData, customerType: e.target.value as 'Bireysel'|'Kurumsal', companyTitle: '', taxNumber: ''})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Bireysel</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customerType" 
                          value="Kurumsal" 
                          checked={formData.customerType === 'Kurumsal'}
                          onChange={(e) => setFormData({...formData, customerType: e.target.value as 'Bireysel'|'Kurumsal', name: '', taxNumber: ''})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Kurumsal</span>
                     </label>
                   </div>
                </div>
                <div className="flex-1">
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Bağlantı Tipi</label>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="connectionType" 
                          value="Alıcı" 
                          checked={formData.type === 'Alıcı'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'Alıcı'|'Satıcı'})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Alıcı (Müşteri)</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="connectionType" 
                          value="Satıcı" 
                          checked={formData.type === 'Satıcı'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'Alıcı'|'Satıcı'})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Satıcı (Tedarikçi)</span>
                     </label>
                   </div>
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Temel Bilgiler</h4>
                </div>

                {formData.customerType === 'Bireysel' ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Örn: Ahmet Yılmaz"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Firma Ünvanı</label>
                      <input 
                        required
                        type="text" 
                        value={formData.companyTitle || ''}
                        onChange={(e) => setFormData({...formData, companyTitle: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Örn: Demir Ticaret Ltd. Şti."
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="ornek@firma.com"
                  />
                </div>
              </div>

              {/* Ticari Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                 <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Ticari Bilgiler</h4>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                    <input 
                      type="text" 
                      value={formData.taxOffice || ''}
                      onChange={(e) => setFormData({...formData, taxOffice: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Örn: Kadıköy V.D."
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.customerType === 'Bireysel' ? 'TC Kimlik Numarası' : 'Vergi Numarası'}
                    </label>
                    <input 
                      type="text" 
                      maxLength={formData.customerType === 'Bireysel' ? 11 : 10}
                      value={formData.taxNumber || ''}
                      onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, ''); // Sadece sayılar
                         setFormData({...formData, taxNumber: val})
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={formData.customerType === 'Bireysel' ? '11 Haneli TC Kimlik No' : '10 Haneli Vergi No'}
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN Numarası</label>
                    <input 
                      type="text" 
                      value={formData.iban || ''}
                      onChange={(e) => setFormData({...formData, iban: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />
                 </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                 <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Adres Bilgileri</h4>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İl (Şehir)</label>
                    <select
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value, district: ''})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">İl Seçin</option>
                      {provinces.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                    <select
                      value={formData.district || ''}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      disabled={!formData.city || districts.length === 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100"
                    >
                      <option value="">İlçe Seçin</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                 </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres</label>
                  <textarea 
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Mahalle, Sokak, No, Daire vb."
                  />
                </div>
              </div>

              {/* Finansal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cari Durumu</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'Aktif'|'Pasif'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Pasif">Pasif</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açılış Bakiyesi (₺)</label>
                    <input 
                      type="number" 
                      value={formData.balance}
                      onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                 </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-200"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
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