import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save, User, Briefcase, FileText, Calendar, Building, DollarSign, Paperclip, Download } from 'lucide-react';
import { Personnel, PersonnelRecord } from '../types';

const INITIAL_FORM: Personnel = {
  id: '',
  firstName: '',
  lastName: '',
  tcNo: '',
  birthDate: '',
  gender: 'Erkek',
  bloodType: '',
  phone: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  department: '',
  position: '',
  startDate: new Date().toISOString().split('T')[0],
  employmentStatus: 'Aktif',
  salary: 0,
  iban: '',
  socialSecurityNo: '',
  records: []
};

const INITIAL_RECORD: PersonnelRecord = {
  id: '',
  targetId: '',
  date: new Date().toISOString().split('T')[0],
  type: 'Not',
  title: '',
  description: '',
  documentUrl: '',
  documentName: ''
};

export const Personel: React.FC = () => {
  const { personnel, setPersonnel } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Personnel>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  // Özlük Dosyası States
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordFormData, setRecordFormData] = useState<PersonnelRecord>(INITIAL_RECORD);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const filteredPersonnel = personnel.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.tcNo.includes(searchTerm) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setPersonnel(personnel.map(p => p.id === formData.id ? formData : p));
    } else {
      setPersonnel([...personnel, { ...formData, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      setPersonnel(personnel.filter(p => p.id !== id));
    }
  };

  const openEditModal = (p: Personnel, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(p);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Özlük
  const handleOpenRecords = (p: Personnel) => {
    setSelectedPersonnel(p);
    setIsRecordModalOpen(true);
    setIsAddingRecord(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecordFormData({
          ...recordFormData,
          documentUrl: reader.result as string,
          documentName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel) return;

    const newRecord = { ...recordFormData, id: Math.random().toString(36).substr(2, 9), targetId: selectedPersonnel.id };
    
    setPersonnel(personnel.map(p => {
        if (p.id === selectedPersonnel.id) {
            return { ...p, records: [newRecord, ...p.records] };
        }
        return p;
    }));

    // Local selected update
    setSelectedPersonnel({
        ...selectedPersonnel,
        records: [newRecord, ...selectedPersonnel.records]
    });
    
    setIsAddingRecord(false);
  };

  const handleDeleteRecord = (recordId: string) => {
      if(!selectedPersonnel) return;
      if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
          setPersonnel(personnel.map(p => {
              if (p.id === selectedPersonnel.id) {
                  return { ...p, records: p.records.filter(r => r.id !== recordId) };
              }
              return p;
          }));

          setSelectedPersonnel({
              ...selectedPersonnel,
              records: selectedPersonnel.records.filter(r => r.id !== recordId)
          });
      }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h2>
        <button 
          onClick={() => {
            setFormData(INITIAL_FORM);
            setIsEditing(false);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Yeni Personel</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="İsim, TC, Departman veya Pozisyon ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">Personel Bilgileri</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Görev / Departman</th>
                <th className="px-6 py-4">İşe Başlama</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPersonnel.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleOpenRecords(p)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-gray-500">TC: {p.tcNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Phone size={14} className="text-emerald-500" /> {p.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-emerald-500" /> {p.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                      <Briefcase size={14} className="text-gray-400" /> {p.position}
                    </div>
                    <div className="text-sm text-gray-500 ml-5">{p.department}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(p.startDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      p.employmentStatus === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 
                      p.employmentStatus === 'İzinde' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.employmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenRecords(p); }} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Özlük Dosyası"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={(e) => openEditModal(p, e)} 
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(p.id, e)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personel Ekle/Düzenle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                
                {/* Kişisel Bilgiler */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-emerald-700 flex items-center gap-2 border-b pb-2">
                    <User size={18} /> Kişisel Bilgiler
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad <span className="text-red-500">*</span></label>
                      <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soyad <span className="text-red-500">*</span></label>
                      <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No <span className="text-red-500">*</span></label>
                      <input required type="text" maxLength={11} value={formData.tcNo} onChange={e => setFormData({...formData, tcNo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                      <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                        <option value="Erkek">Erkek</option>
                        <option value="Kadın">Kadın</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kan Grubu</label>
                      <input type="text" placeholder="Örn: A Rh+" value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                      <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acil Kişi Adı</label>
                      <input type="text" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acil Kişi Tel</label>
                      <input type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200"></div>

                {/* İş ve Kurum Bilgileri */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-emerald-700 flex items-center gap-2 border-b pb-2">
                    <Briefcase size={18} /> İstihdam Bilgileri
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departman <span className="text-red-500">*</span></label>
                      <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Görev / Pozisyon <span className="text-red-500">*</span></label>
                      <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İşe Başlama Tarihi <span className="text-red-500">*</span></label>
                      <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İşten Çıkış Tarihi</label>
                      <input type="date" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Durumu</label>
                      <select value={formData.employmentStatus} onChange={e => setFormData({...formData, employmentStatus: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                        <option value="Aktif">Aktif</option>
                        <option value="Ayrıldı">Ayrıldı</option>
                        <option value="İzinde">İzinde</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maaş (Net)</label>
                      <input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banka IBAN</label>
                    <input type="text" placeholder="TR..." value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SGK Sicil No</label>
                    <input type="text" value={formData.socialSecurityNo} onChange={e => setFormData({...formData, socialSecurityNo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>

                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  İptal
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2">
                  <Save size={18} /> Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Özlük Dosyası Modal */}
      {isRecordModalOpen && selectedPersonnel && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
                           {selectedPersonnel.firstName[0]}{selectedPersonnel.lastName[0]}
                       </div>
                       <div>
                           <h3 className="text-xl font-bold text-gray-800">Özlük Dosyası</h3>
                           <p className="text-sm text-gray-500">{selectedPersonnel.firstName} {selectedPersonnel.lastName} • {selectedPersonnel.position}</p>
                       </div>
                    </div>
                    <button onClick={() => setIsRecordModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                      <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className={`w-full ${isAddingRecord ? 'hidden md:block md:w-1/2 lg:w-3/5' : ''} border-r border-gray-200 bg-gray-50 flex flex-col`}>
                        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                            <h4 className="font-semibold text-gray-700">Kayıt Geçmişi</h4>
                            <button 
                                onClick={() => {
                                    setRecordFormData({
                                        ...INITIAL_RECORD,
                                        date: new Date().toISOString().split('T')[0]
                                    });
                                    setIsAddingRecord(true);
                                }}
                                className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                            >
                                <Plus size={16} /> Yeni Kayıt Ekle
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedPersonnel.records.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                    <FileText size={48} className="text-gray-300 mb-3" />
                                    <p>Henüz özlük dosyasına kayıt eklenmemiş.</p>
                                </div>
                            ) : (
                                selectedPersonnel.records.map((record) => (
                                    <div key={record.id} className="bg-white border text-left border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors group relative">
                                        <button 
                                            onClick={() => handleDeleteRecord(record.id)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                                ${record.type === 'Belge' ? 'bg-blue-100 text-blue-700' : 
                                                  record.type === 'Maaş Değişikliği' ? 'bg-green-100 text-green-700' : 
                                                  record.type === 'İhtar' ? 'bg-red-100 text-red-700' : 
                                                  record.type === 'Ödül' ? 'bg-yellow-100 text-yellow-700' : 
                                                  record.type === 'İzin' ? 'bg-purple-100 text-purple-700' : 
                                                  record.type === 'Rapor' ? 'bg-orange-100 text-orange-700' : 
                                                  'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {record.type}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(record.date).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <h5 className="font-semibold text-gray-800 mb-1">{record.title}</h5>
                                        <p className="text-sm text-gray-600 line-clamp-2">{record.description}</p>
                                        {record.documentUrl && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <a 
                                                    href={record.documentUrl} 
                                                    download={record.documentName || 'belge'} 
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Paperclip size={14} />
                                                    <span className="truncate max-w-[150px]">{record.documentName || 'Ekli Belge'}</span>
                                                    <Download size={14} className="ml-1 opacity-70" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add Form */}
                    {isAddingRecord && (
                        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white overflow-y-auto relative">
                             <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <FileText size={18} className="text-emerald-600"/> Yeni Özlük Kaydı
                                </h4>
                                <button onClick={() => setIsAddingRecord(false)} className="text-gray-400 hover:text-gray-600 md:hidden">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih <span className="text-red-500">*</span></label>
                                    <input required type="date" value={recordFormData.date} onChange={e => setRecordFormData({...recordFormData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Türü <span className="text-red-500">*</span></label>
                                    <select value={recordFormData.type} onChange={e => setRecordFormData({...recordFormData, type: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                                        <option value="Belge">Belge</option>
                                        <option value="Not">Not</option>
                                        <option value="İhtar">İhtar / Uyarı</option>
                                        <option value="Ödül">Ödül / Başarı</option>
                                        <option value="Maaş Değişikliği">Maaş Değişikliği</option>
                                        <option value="İzin">İzin Formu</option>
                                        <option value="Rapor">Sağlık Raporu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık / Konu <span className="text-red-500">*</span></label>
                                    <input required type="text" value={recordFormData.title} onChange={e => setRecordFormData({...recordFormData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Örn: 2024 Zammı, Yıllık İzin vb." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Detaylı Açıklama</label>
                                    <textarea rows={5} required value={recordFormData.description} onChange={e => setRecordFormData({...recordFormData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Eki (Opsiyonel)</label>
                                    <input type="file" onChange={handleFileUpload} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsAddingRecord(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                        İptal
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2">
                                        <Save size={18} /> Ekle
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
