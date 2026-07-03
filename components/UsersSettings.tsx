import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { User, UserPermissions, PermissionSet } from '../types';
import { useAppStore } from '../lib/store';

const DEFAULT_PERMISSIONS: UserPermissions = {
  uretim: { view: true, create: false, edit: false, delete: false },
  satinalma: { view: true, create: false, edit: false, delete: false },
  ceksenet: { view: true, create: false, edit: false, delete: false },
  ariza: { view: true, create: false, edit: false, delete: false },
  personel: { view: true, create: false, edit: false, delete: false },
  satislar: { view: true, create: false, edit: false, delete: false },
  hizlisatis: { view: true, create: false, edit: false, delete: false },
  urunler: { view: true, create: false, edit: false, delete: false },
  siparisler: { view: true, create: false, edit: false, delete: false },
  cariler: { view: true, create: false, edit: false, delete: false },
  kasa: { view: true, create: false, edit: false, delete: false },
  teklifler: { view: true, create: false, edit: false, delete: false },
  ajanda: { view: true, create: false, edit: false, delete: false },
  depo: { view: true, create: false, edit: false, delete: false },
  efatura: { view: true, create: false, edit: false, delete: false },
  mutabakat: { view: true, create: false, edit: false, delete: false },
  stoksayim: { view: true, create: false, edit: false, delete: false },
  raporlar: { view: true, create: false, edit: false, delete: false },
  izin_yonetimi: { view: false, create: false, edit: false, delete: false },
  crm: { view: true, create: false, edit: false, delete: false },
  terminal: { view: true, create: false, edit: false, delete: false },
  dokumanlar: { view: true, create: false, edit: false, delete: false },
};

const INITIAL_FORM: Omit<User, 'id'> = {
  name: '',
  username: '',
  email: '',
  passwordHash: '',
  role: 'Kullanıcı',
  status: 'Aktif',
  branch: '',
  permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
};

import { api } from '../lib/api';
import { Warehouse } from '../types';

export const UsersSettings: React.FC = () => {
  const store = useAppStore();
  const { users, setUsers } = store;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>({ ...INITIAL_FORM, id: '' });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    api.getWarehouses().then(setWarehouses).catch(console.error);
  }, []);

  const handleAddNew = () => {
    setFormData({ ...INITIAL_FORM, id: Math.random().toString(36).substr(2, 9) });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setFormData({
      ...user,
      passwordHash: '',
      permissions: user.permissions || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const originalUser = users.find(u => u.id === formData.id);
      const toSave = { ...formData };
      if (!toSave.passwordHash && originalUser) {
        toSave.passwordHash = originalUser.passwordHash;
      }
      setUsers(users.map(u => (u.id === formData.id ? toSave : u)));
    } else {
      setUsers([...users, formData]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in md:p-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h3>
          <p className="text-sm text-gray-500">Sisteme giriş yapabilecek kullanıcıları ve yetkilerini yönetin.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Ad Soyad</th>
                <th className="px-6 py-3 font-semibold">Kullanıcı Adı</th>
                <th className="px-6 py-3 font-semibold">E-Posta</th>
                <th className="px-6 py-3 font-semibold">Yetki Grubu</th>
                <th className="px-6 py-3 font-semibold">Durum</th>
                <th className="px-6 py-3 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.username}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                      user.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'Aktif' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Sistemde kayıtlı kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı *</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre {isEditing ? '(Boş bırakılırsa değişmez)' : '*'}
                </label>
                <input 
                  type={isEditing ? 'password' : 'text'} 
                  required={!isEditing}
                  value={formData.passwordHash}
                  onChange={e => setFormData({ ...formData, passwordHash: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={isEditing ? '••••••••' : 'Örn: Sifre123'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yetki Grubu</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="Kullanıcı">Kullanıcı</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>
                {formData.role === 'Kullanıcı' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Şube</label>
                      <input 
                        type="text"
                        value={formData.branch || ''}
                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        placeholder="Örn: Merkez Şube"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Görevli Depo</label>
                      <select 
                        value={formData.assignedWarehouse || ''}
                        onChange={e => setFormData({ ...formData, assignedWarehouse: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      >
                        <option value="">Tüm Depolar</option>
                        {warehouses.map((w: any) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {formData.role === 'Kullanıcı' && formData.permissions && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                   <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                     <h4 className="text-sm font-semibold text-gray-700">Modül Yetkileri</h4>
                   </div>
                   <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                     {Object.entries({
                       uretim: 'Üretim (Ar-Ge & İmalat)',
                       satinalma: 'Satın Alma',
                       ceksenet: 'Çek & Senet',
                       ariza: 'Arıza Formu',
                       personel: 'Personel',
                       satislar: 'Satışlar',
                       hizlisatis: 'Hızlı Satış',
                       urunler: 'Ürünler',
                       siparisler: 'Siparişler',
                       cariler: 'Cariler',
                       kasa: 'Kasa',
                       teklifler: 'Teklifler',
                       ajanda: 'Ajanda',
                       depo: 'Depo',
                       efatura: 'E-Fatura',
                       mutabakat: 'Mutabakat',
                       stoksayim: 'Stok Sayım',
                       raporlar: 'Raporlar',
                       izin_yonetimi: 'Personel İzin Yönetimi',
                       crm: 'CRM & Kampanya',
                       dokumanlar: 'Dökümanlar'
                     }).map(([key, label]) => {
                       const permKey = key as keyof UserPermissions;
                       const perms = formData.permissions?.[permKey] || { view: false, create: false, edit: false, delete: false };
                       return (
                         <div key={key} className="p-3 bg-white border rounded-lg shadow-sm">
                           <div className="font-medium text-gray-800 text-sm mb-2 pb-2 border-b">{label}</div>
                           <div className="grid grid-cols-2 gap-2 text-sm">
                             <label className="flex items-center gap-2">
                               <input type="checkbox" checked={perms.view} onChange={e => {
                                 const val = e.target.checked;
                                 setFormData(prev => ({
                                   ...prev,
                                   permissions: {
                                     ...prev.permissions!,
                                     [permKey]: { ...prev.permissions![permKey], view: val, ...(val ? {} : { create: false, edit: false, delete: false }) }
                                   }
                                 }))
                               }} className="rounded text-emerald-600 focus:ring-emerald-500" />
                               <span>Görüntüleme</span>
                             </label>
                             <label className="flex items-center gap-2">
                               <input type="checkbox" disabled={!perms.view} checked={perms.create} onChange={e => setFormData(prev => ({
                                 ...prev,
                                 permissions: { ...prev.permissions!, [permKey]: { ...prev.permissions![permKey], create: e.target.checked } }
                               }))} className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-50" />
                               <span className={!perms.view ? 'text-gray-400' : ''}>Oluşturma</span>
                             </label>
                             <label className="flex items-center gap-2">
                               <input type="checkbox" disabled={!perms.view} checked={perms.edit} onChange={e => setFormData(prev => ({
                                 ...prev,
                                 permissions: { ...prev.permissions!, [permKey]: { ...prev.permissions![permKey], edit: e.target.checked } }
                               }))} className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-50" />
                               <span className={!perms.view ? 'text-gray-400' : ''}>Düzenleme</span>
                             </label>
                             <label className="flex items-center gap-2">
                               <input type="checkbox" disabled={!perms.view} checked={perms.delete} onChange={e => setFormData(prev => ({
                                 ...prev,
                                 permissions: { ...prev.permissions!, [permKey]: { ...prev.permissions![permKey], delete: e.target.checked } }
                               }))} className="rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-50" />
                               <span className={!perms.view ? 'text-gray-400' : ''}>Silme</span>
                             </label>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                </div>
              )}

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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                >
                  {isEditing ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
