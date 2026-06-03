import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save, User, Briefcase, FileText, Calendar, Building, DollarSign, Paperclip, Download, Printer } from 'lucide-react';
import { Personnel, PersonnelRecord, Payroll } from '../types';

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
  const store = useAppStore();
  const { personnel, setPersonnel } = store;
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Personnel>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  // Özlük Dosyası States
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordFormData, setRecordFormData] = useState<PersonnelRecord>(INITIAL_RECORD);
  const [recordAmount, setRecordAmount] = useState<number>(0);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  // Bordro States
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isAddingPayroll, setIsAddingPayroll] = useState(false);
  const [payrollFormData, setPayrollFormData] = useState<Payroll>({
    id: '', date: new Date().toISOString().substring(0, 7), workedDays: 30, basicSalary: 0, overtimeHours: 0, overtimePay: 0, bonus: 0, deductions: 0, netSalary: 0, status: 'Bekliyor'
  });

  const filteredPersonnel = personnel.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.tcNo.includes(searchTerm) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    const nextId = `${store.settings.prefix_personnel || 'PER'}-${store.settings.next_personnel_id || 1001}`;
    setFormData({ ...INITIAL_FORM, id: nextId });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setPersonnel(personnel.map(p => p.id === formData.id ? formData : p));
    } else {
      setPersonnel([...personnel, formData]);
      store.setSettings({
        ...store.settings,
        next_personnel_id: (store.settings.next_personnel_id || 1001) + 1
      });
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

    if (recordFormData.type === 'Avans Ödemesi' as any) {
        if (!window.confirm(`${recordAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} tutarında avansı kasadan ödemek istediğinize emin misiniz?`)) return;
    }

    const newRecord = { ...recordFormData, id: Math.random().toString(36).substr(2, 9), targetId: selectedPersonnel.id };
    
    // Add real amount to description to keep track
    if (recordFormData.type === 'Avans Ödemesi' as any) {
        newRecord.description = `${newRecord.description}\nTutar: ${recordAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`;
    }

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

    if (recordFormData.type === 'Avans Ödemesi' as any) {
        const newCashTransaction = {
          id: Math.random().toString(36).substr(2, 9),
          date: recordFormData.date || new Date().toISOString().split('T')[0],
          type: 'Gider' as const,
          category: 'Personel Avans' as const,
          amount: recordAmount,
          description: `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} - Avans Ödemesi (${recordFormData.title})`,
          personnelId: selectedPersonnel.id,
        };
        store.setCashTransactions([newCashTransaction, ...(store.cashTransactions || [])]);
        toast.success('Avans kasaya işlendi.');
    }
    
    setIsAddingRecord(false);
    setRecordAmount(0);
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

  // Bordro & Puantaj
  const handleOpenPayroll = (p: Personnel) => {
    setSelectedPersonnel(p);
    setIsPayrollModalOpen(true);
    setIsAddingPayroll(false);
  };

  const calculateNetSalary = (data: Payroll) => {
    return (data.basicSalary / 30 * data.workedDays) + data.overtimePay + data.bonus - data.deductions;
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel) return;

    const netSalary = calculateNetSalary(payrollFormData);
    const newPayroll = { ...payrollFormData, id: Math.random().toString(36).substr(2, 9), netSalary };
    
    setPersonnel(personnel.map(p => {
        if (p.id === selectedPersonnel.id) {
            return { ...p, payrolls: [newPayroll, ...(p.payrolls || [])] };
        }
        return p;
    }));

    setSelectedPersonnel({
        ...selectedPersonnel,
        payrolls: [newPayroll, ...(selectedPersonnel.payrolls || [])]
    });
    
    setIsAddingPayroll(false);
  };

  const handlePayPayroll = (payroll: Payroll) => {
    if (!selectedPersonnel) return;
    if (!window.confirm(`${payroll.date} dönemi maaşını (${payroll.netSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}) kasadan ödemek istediğinize emin misiniz?`)) return;

    const updatedPayroll = {...payroll, status: 'Ödendi' as any};
    
    const newCashTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: 'Gider' as const,
      category: 'Personel Maaşı' as const,
      amount: payroll.netSalary,
      description: `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} - ${payroll.date} Dönemi Maaş Ödemesi`,
      personnelId: selectedPersonnel.id,
    };

    const newRecord = {
        id: Math.random().toString(36).substr(2, 9),
        targetId: selectedPersonnel.id,
        date: new Date().toISOString(),
        type: 'Not' as any,
        title: 'Personel Maaşı',
        description: `${payroll.date} Dönemi Maaş Ödemesi Tutarı: ` + payroll.netSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    };

    const newPersonnelList = personnel.map(p => {
        if(p.id === selectedPersonnel.id) {
            return {
                ...p, 
                payrolls: p.payrolls?.map(pr => pr.id === payroll.id ? updatedPayroll : pr) || [],
                records: [newRecord, ...(p.records || [])]
            };
        }
        return p;
    });

    setPersonnel(newPersonnelList);
    setSelectedPersonnel(newPersonnelList.find(p => p.id === selectedPersonnel.id) || selectedPersonnel);
    store.setCashTransactions([newCashTransaction, ...(store.cashTransactions || [])]);
    toast.success('Maaş ödemesi kasaya işlendi.');
  };

  const sendEPayroll = async (payroll: Payroll) => {
    if (!selectedPersonnel?.email) {
      toast.error("Personelin e-posta adresi bulunmamaktadır.");
      return;
    }

    const templateRaw = store.settings.email_template_personnel || defaultTemplates.personnel;
    const body = parseEmailTemplate(templateRaw, {
      PERSONEL_ADI: `${selectedPersonnel.firstName} ${selectedPersonnel.lastName}`,
      AY_YIL: payroll.date,
      NET_ODENEN: payroll.netSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      FIRMA_ADI: store.settings.companyName || ''
    });

    const promise = fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         to: selectedPersonnel.email, 
         subject: `${payroll.date} Dönemi Maaş Bordrosu`, 
         html: body 
      })
    }).then(async res => {
      if (!res.ok) throw new Error("E-Bordro gönderilemedi.");
      
      const updatedPayroll = {...payroll, emailSentAt: new Date().toISOString()};
      setPersonnel(personnel.map(p => {
          if(p.id === selectedPersonnel.id) {
              return {...p, payrolls: p.payrolls?.map(pr => pr.id === payroll.id ? updatedPayroll : pr) || [] };
          }
          return p;
      }));
      setSelectedPersonnel({
          ...selectedPersonnel,
          payrolls: selectedPersonnel.payrolls?.map(pr => pr.id === payroll.id ? updatedPayroll : pr) || []
      });

      return res.json();
    });

    toast.promise(promise, {
      loading: 'E-Bordro gönderiliyor...',
      success: `E-Bordro ${selectedPersonnel.email} adresine gönderildi.`,
      error: 'Mail gönderimi sırasında hata oluştu.'
    });
  };

  const [printBordroModalOpen, setPrintBordroModalOpen] = useState(false);
  const [selectedBordroToPrint, setSelectedBordroToPrint] = useState<Payroll | null>(null);

  const [activeTab, setActiveTab] = useState<'Personeller' | 'İşe Alım'>('Personeller');

  const downloadPayrollPDF = (payroll: Payroll) => {
    setSelectedBordroToPrint(payroll);
    setPrintBordroModalOpen(true);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('Personeller')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'Personeller' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Personel Listesi
          </button>
          <button 
            onClick={() => setActiveTab('İşe Alım')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'İşe Alım' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            İşe Alım Süreçleri
          </button>
        </div>
      </div>

      {activeTab === 'Personeller' && (
        <>
          <div className="flex justify-end">
            <button 
              onClick={handleAddNew}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>Yeni Personel</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-full sm:max-w-md">
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
                        onClick={(e) => { e.stopPropagation(); handleOpenPayroll(p); }} 
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Puantaj & Bordro"
                      >
                        <DollarSign size={18} />
                      </button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:p-8 relative">
                
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
                    <div className="flex flex-wrap items-center gap-4">
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
                            {(!selectedPersonnel.records || selectedPersonnel.records.length === 0) ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                    <FileText size={48} className="text-gray-300 mb-3" />
                                    <p>Henüz özlük dosyasına kayıt eklenmemiş.</p>
                                </div>
                            ) : (
                                (selectedPersonnel.records || []).map((record) => (
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
                            <form onSubmit={handleSaveRecord} className="p-4 sm:p-6 space-y-4">
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
                                        <option value="Avans Ödemesi">Avans Ödemesi</option>
                                    </select>
                                </div>
                                {recordFormData.type === 'Avans Ödemesi' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Avans Tutarı (₺) <span className="text-red-500">*</span></label>
                                        <input required type="number" min="0" step="0.01" value={recordAmount} onChange={e => setRecordAmount(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                                    </div>
                                )}
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

      {/* Bordro Dosyası Modal */}
      {isPayrollModalOpen && selectedPersonnel && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex flex-wrap items-center gap-4">
                       <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
                           {selectedPersonnel.firstName[0]}{selectedPersonnel.lastName[0]}
                       </div>
                       <div>
                           <h3 className="text-xl font-bold text-gray-800">Puantaj ve E-Bordro</h3>
                           <p className="text-sm text-gray-500">{selectedPersonnel.firstName} {selectedPersonnel.lastName} • Net Maaş: {selectedPersonnel.salary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                       </div>
                    </div>
                    <button onClick={() => setIsPayrollModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                      <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className={`w-full ${isAddingPayroll ? 'hidden md:block md:w-1/2 lg:w-3/5' : ''} border-r border-gray-200 bg-gray-50 flex flex-col`}>
                        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                            <h4 className="font-semibold text-gray-700">Bordro Geçmişi</h4>
                            <button 
                                onClick={() => {
                                    setPayrollFormData({
                                        id: '', date: new Date().toISOString().substring(0, 7), workedDays: 30, basicSalary: selectedPersonnel.salary || 0, overtimeHours: 0, overtimePay: 0, bonus: 0, deductions: 0, netSalary: 0, status: 'Bekliyor'
                                    });
                                    setIsAddingPayroll(true);
                                }}
                                className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                            >
                                <Plus size={16} /> Yeni Bordro Çıkar
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(!selectedPersonnel.payrolls || selectedPersonnel.payrolls.length === 0) ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                    <DollarSign size={48} className="text-gray-300 mb-3" />
                                    <p>Henüz bordro kaydı bulunmamaktadır.</p>
                                </div>
                            ) : (
                                selectedPersonnel.payrolls.map((pr) => (
                                    <div key={pr.id} className="bg-white border text-left border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors group relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-800 text-lg">{pr.date}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${pr.status === 'Ödendi' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {pr.status}
                                                </span>
                                                {pr.emailSentAt && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1"><Mail size={12}/> Gönderildi</span>}
                                            </div>
                                            <p className="text-sm text-gray-600">Puantaj: {pr.workedDays} Gün | Mesai: {pr.overtimeHours} Saat</p>
                                            <p className="font-bold text-emerald-600 mt-1">{pr.netSalary.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} Hakediş</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                                            <button 
                                                onClick={() => downloadPayrollPDF(pr)}
                                                className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium text-sm flex items-center gap-1 transition-colors border border-emerald-200"
                                            >
                                                <Download size={16} /> PDF İndir
                                            </button>
                                            <button 
                                                onClick={() => sendEPayroll(pr)}
                                                className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-sm flex items-center gap-1 transition-colors border border-blue-200"
                                            >
                                                <Mail size={16} /> Gönder
                                            </button>
                                            {pr.status !== 'Ödendi' && (
                                                <button 
                                                    onClick={() => handlePayPayroll(pr)}
                                                    className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium text-sm flex items-center gap-1 transition-colors"
                                                >
                                                    <DollarSign size={16} /> Kasadan Öde
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add Form */}
                    {isAddingPayroll && (
                        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white overflow-y-auto relative">
                             <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <DollarSign size={18} className="text-emerald-600"/> Yeni Bordro Çıkar
                                </h4>
                                <button onClick={() => setIsAddingPayroll(false)} className="text-gray-400 hover:text-gray-600 md:hidden">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSavePayroll} className="p-4 sm:p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dönem (Ay/Yıl)</label>
                                        <input required type="month" value={payrollFormData.date} onChange={e => setPayrollFormData({...payrollFormData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                        <select value={payrollFormData.status} onChange={e => setPayrollFormData({...payrollFormData, status: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                                            <option value="Bekliyor">Bekliyor</option>
                                            <option value="Ödendi">Ödendi</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Çalışılan Gün</label>
                                        <input required type="number" min="0" max="31" value={payrollFormData.workedDays} onChange={e => setPayrollFormData({...payrollFormData, workedDays: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Temel Maaş (Net)</label>
                                        <input required type="number" value={payrollFormData.basicSalary} onChange={e => setPayrollFormData({...payrollFormData, basicSalary: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesai Saati</label>
                                        <input required type="number" min="0" value={payrollFormData.overtimeHours} onChange={e => setPayrollFormData({...payrollFormData, overtimeHours: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesai Ücreti Miktarı</label>
                                        <input required type="number" min="0" value={payrollFormData.overtimePay} onChange={e => setPayrollFormData({...payrollFormData, overtimePay: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prim / İkramiye</label>
                                        <input required type="number" min="0" value={payrollFormData.bonus} onChange={e => setPayrollFormData({...payrollFormData, bonus: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kesintiler</label>
                                        <input required type="number" min="0" value={payrollFormData.deductions} onChange={e => setPayrollFormData({...payrollFormData, deductions: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-emerald-50 rounded-lg flex justify-between items-center border border-emerald-100">
                                    <span className="font-semibold text-emerald-800">Hesaplanan Net Hakediş:</span>
                                    <span className="text-xl font-bold text-emerald-600">
                                        {calculateNetSalary(payrollFormData).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsAddingPayroll(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                        İptal
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2">
                                        <Save size={18} /> Bordro Oluştur
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* A4 Bordro Print Modal */}
      {printBordroModalOpen && selectedBordroToPrint && selectedPersonnel && (
        <div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl no-print">
              <div className="flex items-center gap-3">
                <FileText className="text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800">Bordro Yazdır (A4)</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Printer size={18} />
                  Yazdır / PDF İndir
                </button>
                <button onClick={() => setPrintBordroModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Print Content - A4 Document Format */}
            <div className="p-8 md:p-12 print:p-4 print:text-black font-sans bg-white">
              <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6 print:border-black">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 print:text-black mb-2">PERSONEL MAAŞ BORDROSU</h1>
                  <p className="text-gray-600 print:text-black mt-2 font-bold text-xl">
                    Kayıt Dönemi: {selectedBordroToPrint.date}
                  </p>
                  <p className="text-gray-500 print:text-black mt-2">
                    Çıktı Tarihi: {new Date().toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  {store.settings.companyLogo ? (
                    <img src={store.settings.companyLogo} alt="Logo" className="max-h-20 object-contain ml-auto mb-2" />
                  ) : (
                    <h2 className="font-logo text-3xl font-bold text-emerald-900 print:text-black mb-2">{store.settings.printer_header_text || 'esila'}</h2>
                  )}
                  <p className="text-sm text-gray-600 print:text-black font-medium">{store.settings.companyName}</p>
                </div>
              </div>

              {/* Personnel Information */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 print:text-black mb-3 border-b pb-2">Personel Bilgileri</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700 print:text-black">
                  <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                    <span className="font-medium text-gray-600">Ad Soyad:</span>
                    <span className="font-bold">{selectedPersonnel.firstName} {selectedPersonnel.lastName}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                    <span className="font-medium text-gray-600">TC Kimlik / Pasaport:</span>
                    <span className="font-bold">{selectedPersonnel.tcNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                    <span className="font-medium text-gray-600">Departman:</span>
                    <span className="font-bold">{selectedPersonnel.department}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                    <span className="font-medium text-gray-600">Görev:</span>
                    <span className="font-bold">{selectedPersonnel.position}</span>
                  </div>
                </div>
              </div>

              {/* Payroll Details */}
              <div className="mb-12">
                <h3 className="font-bold text-gray-800 print:text-black mb-3 border-b pb-2">Tahakkuk Bilgileri</h3>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 text-gray-800 print:text-black font-semibold">
                      <th className="p-3 border border-gray-200 print:border-gray-400">Açıklama</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400 text-right w-40">Tutar / Değer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 print:border-gray-300">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black">Çalışılan Gün</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium">{selectedBordroToPrint.workedDays} gün</td>
                    </tr>
                    <tr className="border-b border-gray-200 print:border-gray-300">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black">Temel Maaş Hakedişi</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium">{selectedBordroToPrint.basicSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    </tr>
                    <tr className="border-b border-gray-200 print:border-gray-300">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black">Mesai Saati</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium">{selectedBordroToPrint.overtimeHours} saat</td>
                    </tr>
                    <tr className="border-b border-gray-200 print:border-gray-300 bg-emerald-50/30">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black text-emerald-800">+ Mesai Ücreti Tutarı</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium text-emerald-700">{selectedBordroToPrint.overtimePay.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    </tr>
                    <tr className="border-b border-gray-200 print:border-gray-300 bg-emerald-50/30">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black text-emerald-800">+ Prim / İkramiye / Diğer Kazançlar</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium text-emerald-700">{selectedBordroToPrint.bonus.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    </tr>
                    <tr className="border-b border-gray-200 print:border-gray-300 bg-red-50/30">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black text-red-800">- Avans / Kesintiler</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium text-red-700">{selectedBordroToPrint.deductions.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 print:bg-gray-200 font-bold text-gray-900 print:text-black">
                      <td className="p-3 border border-gray-200 print:border-gray-400 text-right text-lg">NET ÖDENECEK TUTAR:</td>
                      <td className="p-3 border border-gray-200 print:border-gray-400 text-right text-lg text-emerald-700 print:text-black">
                        {calculateNetSalary(selectedBordroToPrint).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-16 flex justify-between px-8 no-print">
                <div className="text-center">
                  <div className="w-48 h-px bg-gray-300 mb-2"></div>
                  <p className="text-gray-500 text-sm font-medium">Personel İmzası</p>
                  <p className="text-xs text-gray-400 mt-1">Okudum, anladım ve<br/>eksiksiz teslim aldım.</p>
                </div>
                <div className="text-center">
                  <div className="w-48 h-px bg-gray-300 mb-2"></div>
                  <p className="text-gray-500 text-sm font-medium">Firma Yetkilisi / Kaşe / İmza</p>
                </div>
              </div>

              {/* Print-only CSS layout fixes for signature blocks */}
              <div className="mt-20 print:flex justify-between px-12 hidden text-black">
                <div className="text-center">
                  <div className="w-48 h-px bg-black mb-2"></div>
                  <p className="font-semibold text-sm">Personel İmzası</p>
                  <p className="text-xs mt-1">Okudum, anladım ve<br/>eksiksiz teslim aldım.</p>
                </div>
                <div className="text-center">
                  <div className="w-48 h-px bg-black mb-2"></div>
                  <p className="font-semibold text-sm">Firma Yetkilisi / Kaşe / İmza</p>
                </div>
              </div>
              
              <div className="mt-12 text-center text-xs text-gray-400 print:text-gray-500 border-t pt-4">
                Bu belge bilgilendirme amaçlıdır.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Since we want to close the fragment, let's close it right before the wrapper </div> */}
      </>)}

      {activeTab === 'İşe Alım' && (
        <RecruitmentView />
      )}
    </div>
  );
};

const RecruitmentView: React.FC = () => {
  const store = useAppStore();
  const { jobApplications, setJobApplications } = store;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<any>(null);

  const initialForm = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    positionApplied: '',
    applicationDate: new Date().toISOString().split('T')[0],
    status: 'Yeni',
    notes: ''
  };
  const [formData, setFormData] = useState<any>(initialForm);

  const filtered = (jobApplications || []).filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.positionApplied.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingApplication) {
      setJobApplications((jobApplications || []).map(a => a.id === formData.id ? formData : a));
    } else {
      setJobApplications([...(jobApplications || []), { ...formData, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) {
      setJobApplications((jobApplications || []).filter(a => a.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Yeni': return 'bg-blue-100 text-blue-700';
      case 'İnceleniyor': return 'bg-yellow-100 text-yellow-700';
      case 'Mülakat': return 'bg-purple-100 text-purple-700';
      case 'Teklif': return 'bg-indigo-100 text-indigo-700';
      case 'Kabul Edildi': return 'bg-emerald-100 text-emerald-700';
      case 'Reddedildi': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
          <div className="relative max-w-full sm:max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="İsim veya Pozisyon ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setFormData(initialForm); setEditingApplication(null); setIsModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            <span>Yeni Başvuru</span>
          </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4">Aday</th>
                  <th className="px-6 py-4">Başvurulan Pozisyon</th>
                  <th className="px-6 py-4">Başvuru Tarihi</th>
                  <th className="px-6 py-4">İletişim</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Hiç başvuru bulunmuyor. Yeni ekleyebilirsiniz.
                    </td>
                  </tr>
                ) : filtered.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{app.firstName} {app.lastName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                       {app.positionApplied}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                       {new Date(app.applicationDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                           <Phone size={14} /> {app.phone}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                           <Mail size={14} /> {app.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-3 py-1 rounded-full text-xs font-medium \${getStatusColor(app.status)}`}>
                         {app.status}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setFormData(app); setEditingApplication(app); setIsModalOpen(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(app.id, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold rounded text-gray-800">
                {editingApplication ? 'Başvuruyu Düzenle' : 'Yeni İşe Alım Başvurusu'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başvurulan Pozisyon <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.positionApplied} onChange={e => setFormData({...formData, positionApplied: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başvuru Tarihi <span className="text-red-500">*</span></label>
                    <input type="date" required value={formData.applicationDate} onChange={e => setFormData({...formData, applicationDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Süreç Durumu</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                      <option value="Yeni">Yeni</option>
                      <option value="İnceleniyor">İnceleniyor</option>
                      <option value="Mülakat">Mülakat</option>
                      <option value="Teklif">Teklif</option>
                      <option value="Kabul Edildi">Kabul Edildi</option>
                      <option value="Reddedildi">Reddedildi</option>
                    </select>
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Notlar / Mülakat Kararı</label>
                   <textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border rounded-lg placeholder-gray-300" placeholder="Adayın mülakat performansını veya özgeçmiş notlarını buraya alın..."></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 mt-auto rounded-b-xl">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
                 <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium">
                   <Save size={20} /> Kaydet
                 </button>
              </div>
            </form>
          </div>
          </div>
       )}
    </div>
  );
};
