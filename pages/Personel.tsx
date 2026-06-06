import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppStore } from '../lib/store';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save, User, Briefcase, FileText, Calendar, Building, DollarSign, Paperclip, Download, Printer, Package, MessageSquare } from 'lucide-react';
import { Personnel, PersonnelRecord, Payroll } from '../types';
import { sendSMS } from '../src/utils/smsRequest';

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

  // İzin States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    id: '', 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0], 
    type: 'Yıllık İzin', 
    days: 1, 
    status: 'Bekliyor', 
    description: ''
  });

  // Bordro States
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isAddingPayroll, setIsAddingPayroll] = useState(false);
  const [payrollFormData, setPayrollFormData] = useState<Payroll>({
    id: '', date: new Date().toISOString().substring(0, 7), workedDays: 30, basicSalary: 0, overtimeHours: 0, overtimePay: 0, bonus: 0, deductions: 0, netSalary: 0, status: 'Bekliyor'
  });

  // Zimmet States
  const [isFixtureModalOpen, setIsFixtureModalOpen] = useState(false);
  const [isAddingFixture, setIsAddingFixture] = useState(false);
  const [fixtureFormData, setFixtureFormData] = useState({ productId: '', quantity: 1, dateGiven: new Date().toISOString().split('T')[0] });

  const filteredPersonnel = personnel.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.tcNo.includes(searchTerm) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const data = filteredPersonnel.map(p => ({
      'ID': p.id,
      'Ad Soyad': `${p.firstName} ${p.lastName}`,
      'TC No': p.tcNo,
      'Departman': p.department,
      'Pozisyon': p.position,
      'İşe Giriş': new Date(p.startDate).toLocaleDateString('tr-TR'),
      'Telefon': p.phone,
      'E-posta': p.email,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personeller');
    XLSX.writeFile(workbook, 'personeller.xlsx');
    toast.success('Personel listesi Excel olarak dışa aktarıldı');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.text('Personel Listesi', 40, 40);
    const data = filteredPersonnel.map(p => [
      p.id,
      `${p.firstName} ${p.lastName}`,
      p.tcNo,
      p.department,
      p.position,
      new Date(p.startDate).toLocaleDateString('tr-TR'),
      p.phone,
      p.email
    ]);
    autoTable(doc, {
      head: [['ID', 'Ad Soyad', 'TC No', 'Departman', 'Pozisyon', 'İşe Giriş', 'Telefon', 'E-posta']],
      body: data,
      startY: 60,
      styles: { fontSize: 8 },
    });
    doc.save('personeller.pdf');
    toast.success('Personel listesi PDF olarak dışa aktarıldı');
  };

  const exportPersonnelDossier = (p: Personnel) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    const tr = (str: string | undefined | null) => {
        if (!str) return '';
        return str.replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                  .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                  .replace(/Ş/g, 'S').replace(/ş/g, 's')
                  .replace(/İ/g, 'I').replace(/ı/g, 'i')
                  .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                  .replace(/Ç/g, 'C').replace(/ç/g, 'c');
    };

    const checkPageBreak = (doc: any, y: number, neededSpace: number) => {
        if (y + neededSpace > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            return 40;
        }
        return y;
    };

    doc.setFontSize(20);
    doc.text(tr('Personel Ozluk Raporu'), 40, 50);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 40, 70);

    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('1. Temel Bilgiler', 40, 100);
    
    const basicInfo = [
        ['Ad Soyad', tr(`${p.firstName} ${p.lastName}`), 'TC Kimlik', tr(p.tcNo || '-')],
        ['Departman', tr(p.department || '-'), 'Pozisyon', tr(p.position || '-')],
        ['Ise Giris', p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '-', 'Isten Cikis', p.endDate ? new Date(p.endDate).toLocaleDateString('tr-TR') : 'Devam Ediyor'],
        ['E-posta', tr(p.email || '-'), 'Telefon', tr(p.phone || '-')],
        ['Maas (Aylik)', p.salary ? `${p.salary} ${tr(p.currency || 'TRY')}` : '-', 'Durum', tr(p.employmentStatus || 'Aktif')],
        ['Adres', tr(p.address || '-'), 'IBAN', tr(p.iban || '-')],
    ];

    autoTable(doc, {
        body: basicInfo,
        startY: 110,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 100 },
            2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 100 },
        }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 30;

    // Ödemeler & Puantaj (Bordro)
    currentY = checkPageBreak(doc, currentY, 50);
    doc.setFontSize(14);
    doc.text('2. Odemeler ve Puantaj (Bordro Kayitlari)', 40, currentY);
    
    const payrollData = (p.payrollRecords || []).map(pr => [
        pr.periodStart + " - " + pr.periodEnd,
        `${pr.normalDays} Gun`,
        `${pr.overtimeHours} Saat`,
        `${pr.totalBonus} ${tr(p.currency || 'TRY')}`,
        `${pr.totalDeduction} ${tr(p.currency || 'TRY')}`,
        `${pr.netPay} ${tr(p.currency || 'TRY')}`,
        tr(pr.status || '-')
    ]);

    autoTable(doc, {
        head: [['Donem', 'Normal', 'Mesai', 'Ek Odeme', 'Kesinti', 'Net Maas', 'Durum']],
        body: payrollData.length > 0 ? payrollData : [['Kayit bulunamadi', '', '', '', '', '', '']],
        startY: currentY + 10,
        theme: 'striped',
        styles: { fontSize: 9 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;

    // İzinler
    currentY = checkPageBreak(doc, currentY, 50);
    doc.setFontSize(14);
    doc.text('3. Izin Kayitlari', 40, currentY);

    const leaveData = (p.leaveRecords || []).map(lr => [
        tr(lr.type),
        new Date(lr.startDate).toLocaleDateString('tr-TR'),
        new Date(lr.endDate).toLocaleDateString('tr-TR'),
        `${lr.days} Gun`,
        tr(lr.status),
        tr(lr.description || '-')
    ]);

    autoTable(doc, {
        head: [['Izin Turu', 'Baslangic', 'Bitis', 'Sure', 'Durum', 'Aciklama']],
        body: leaveData.length > 0 ? leaveData : [['Kayit bulunamadi', '', '', '', '', '']],
        startY: currentY + 10,
        theme: 'striped',
        styles: { fontSize: 9 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;

    // Özlük Dosyası & Uyarılar
    currentY = checkPageBreak(doc, currentY, 50);
    doc.setFontSize(14);
    doc.text('4. Uyarilar ve Ozluk Dosyasi Ekleri', 40, currentY);

    const recordsData = (p.records || []).map(r => [
        tr(r.type),
        new Date(r.date).toLocaleDateString('tr-TR'),
        tr(r.title),
        tr(r.description || '-')
    ]);

    autoTable(doc, {
        head: [['Kategori', 'Tarih', 'Baslik', 'Aciklama']],
        body: recordsData.length > 0 ? recordsData : [['Kayit bulunamadi', '', '', '']],
        startY: currentY + 10,
        theme: 'striped',
        styles: { fontSize: 9 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;

    // Zimmetler
    currentY = checkPageBreak(doc, currentY, 50);
    doc.setFontSize(14);
    doc.text('5. Zimmet Kayitlari (Demirbaslar)', 40, currentY);

    const fixtureData = (p.fixtures || []).map(f => [
        tr(f.fixtureName),
        tr(f.serialNumber || '-'),
        new Date(f.issueDate).toLocaleDateString('tr-TR'),
        f.returnDate ? new Date(f.returnDate).toLocaleDateString('tr-TR') : 'Kullanimda',
        tr(f.condition || '-')
    ]);

    autoTable(doc, {
        head: [['Demirbas Adi', 'Seri No', 'Verilis Tarihi', 'Iade Tarihi', 'Durum']],
        body: fixtureData.length > 0 ? fixtureData : [['Kayit bulunamadi', '', '', '', '']],
        startY: currentY + 10,
        theme: 'striped',
        styles: { fontSize: 9 }
    });

    doc.save(`${tr(p.firstName)}_${tr(p.lastName)}_Ozluk_Dosyasi.pdf`);
    toast.success(`${p.firstName} ${p.lastName} raporu olusturuldu.`);
  };

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredPersonnel.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonnel = itemsPerPage === -1 ? filteredPersonnel : filteredPersonnel.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
  const handleOpenFixtures = (p: Personnel) => {
    setSelectedPersonnel(p);
    setIsFixtureModalOpen(true);
    setIsAddingFixture(false);
  };

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

  const handleSaveFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel) return;

    const selectedProduct = store.products.find(p => p.id === fixtureFormData.productId);
    if (!selectedProduct) return toast.error('Lütfen bir ürün seçin.');
    if (selectedProduct.stock < fixtureFormData.quantity) return toast.error('Depoda yeterli stok yok.');

    const newFixture = { 
        id: Math.random().toString(36).substr(2, 9), 
        productId: selectedProduct.id, 
        productName: selectedProduct.name, 
        quantity: Number(fixtureFormData.quantity), 
        dateGiven: fixtureFormData.dateGiven 
    };

    const newPersonnelList = personnel.map(p => {
        if (p.id === selectedPersonnel.id) {
            return { ...p, fixtures: [newFixture, ...(p.fixtures || [])] };
        }
        return p;
    });

    setPersonnel(newPersonnelList);
    setSelectedPersonnel(newPersonnelList.find(p => p.id === selectedPersonnel.id) || selectedPersonnel);

    // Düşülen stok güncellemesi
    const updatedProduct = { ...selectedProduct, stock: selectedProduct.stock - newFixture.quantity };
    store.setProducts(store.products.map(p => p.id === selectedProduct.id ? updatedProduct : p));

    setIsAddingFixture(false);
    toast.success('Zimmet başarıyla eklendi ve stoktan düşüldü.');
  };

  const handleReturnFixture = (fixtureId: string, productId: string, quantity: number) => {
    if (!selectedPersonnel) return;
    if (!window.confirm('Bu zimmeti iade almak istediğinize emin misiniz?')) return;

    const newPersonnelList = personnel.map(p => {
        if (p.id === selectedPersonnel.id) {
            return { ...p, fixtures: (p.fixtures || []).filter(f => f.id !== fixtureId) };
        }
        return p;
    });

    setPersonnel(newPersonnelList);
    setSelectedPersonnel(newPersonnelList.find(p => p.id === selectedPersonnel.id) || selectedPersonnel);

    const product = store.products.find(p => p.id === productId);
    if (product) {
       const updatedProduct = { ...product, stock: product.stock + quantity };
       store.setProducts(store.products.map(p => p.id === productId ? updatedProduct : p));
    }
    toast.success('Zimmet iade alındı ve stoka eklendi.');
  };

  const handleSendRecordSMS = async (record: PersonnelRecord) => {
    if (!selectedPersonnel?.phone) {
      toast.error('Personelin telefon numarası kayıtlı değil.');
      return;
    }
    
    let text = `Sayın ${selectedPersonnel.firstName} ${selectedPersonnel.lastName},\n`;
    if (record.type === 'İzin') {
      text += `İzin talebiniz / kaydınız oluşturulmuştur.\nKonu: ${record.title}\nTarih: ${new Date(record.date).toLocaleDateString('tr-TR')}\n${store.settings?.companyName || ''}`;
    } else if (record.type === 'İhtar') {
      text += `Tarafınıza bir uyarı/ihtar kaydedilmiştir.\nKonu: ${record.title}\nLütfen yetkilinizle görüşün.\n${store.settings?.companyName || ''}`;
    } else {
      text += `Sistemimizde adınıza yeni bir kayıt oluşturuldu.\nTür: ${record.type}\nKonu: ${record.title}\n${store.settings?.companyName || ''}`;
    }

    try {
      await sendSMS(store.settings, [selectedPersonnel.phone], text);
      toast.success('SMS başarıyla gönderildi.');
    } catch (err: any) {
      toast.error(err.message || 'SMS gönderilirken bir hata oluştu.');
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

  // İzin Management
  const handleOpenLeave = (p: Personnel) => {
    setSelectedPersonnel(p);
    setIsLeaveModalOpen(true);
    setIsAddingLeave(false);
  };

  const handleSaveLeave = () => {
    if (!selectedPersonnel) return;
    if (leaveFormData.days <= 0) return toast.error('İzin gün sayısı 0 dan büyük olmalıdır.');

    const newLeave = {
        id: leaveFormData.id || Math.random().toString(36).substr(2, 9),
        startDate: leaveFormData.startDate,
        endDate: leaveFormData.endDate,
        type: leaveFormData.type as any,
        days: Number(leaveFormData.days),
        status: leaveFormData.status as any,
        description: leaveFormData.description
    };

    const newPersonnelList = personnel.map(p => {
        if (p.id === selectedPersonnel.id) {
            let leaves = p.leaveRecords || [];
            if (leaveFormData.id) {
                leaves = leaves.map(l => l.id === leaveFormData.id ? newLeave : l);
            } else {
                leaves = [newLeave, ...leaves];
            }
            return { ...p, leaveRecords: leaves };
        }
        return p;
    });

    setPersonnel(newPersonnelList);
    setSelectedPersonnel(newPersonnelList.find(p => p.id === selectedPersonnel.id) || selectedPersonnel);
    setIsAddingLeave(false);
    toast.success('İzin kaydı başarıyla kaydedildi.');
  };

  const handleDeleteLeave = (leaveId: string) => {
    if (!selectedPersonnel) return;
    if (!window.confirm('Bu izin kaydını silmek istediğinize emin misiniz?')) return;

    const newPersonnelList = personnel.map(p => {
        if (p.id === selectedPersonnel.id) {
            return { ...p, leaveRecords: (p.leaveRecords || []).filter(l => l.id !== leaveId) };
        }
        return p;
    });
    setPersonnel(newPersonnelList);
    setSelectedPersonnel(newPersonnelList.find(p => p.id === selectedPersonnel.id) || selectedPersonnel);
  };

  // Bordro & Puantaj
  const handleOpenPayroll = (p: Personnel) => {
    setSelectedPersonnel(p);
    setIsPayrollModalOpen(true);
    setIsAddingPayroll(false);
  };

  const calculateNetSalary = (data: Payroll) => {
    return (data.basicSalary / 30 * data.workedDays) + (data.overtimeHours * data.overtimePay) + data.bonus - data.deductions;
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

    const promise = new Promise(async (resolve, reject) => {
      try {
        const netSalary = calculateNetSalary(payroll);
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
          <div style="font-family: sans-serif; color: #000; padding: 20px; text-align: left; background: #fff;">
            <h1 style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px;">Maaş Bordrosu</h1>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td><strong>Firma:</strong> ${store.settings.companyName || ''}</td>
                <td style="text-align: right;"><strong>Dönem:</strong> ${payroll.date}</td>
              </tr>
              <tr>
                <td><strong>Personel:</strong> ${selectedPersonnel.firstName} ${selectedPersonnel.lastName}</td>
                <td style="text-align: right;"><strong>TC No:</strong> ${selectedPersonnel.tcNo}</td>
              </tr>
            </table>
            
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: #eee;">
                  <th style="padding: 8px; border: 1px solid #ccc;">Açıklama</th>
                  <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Tutar / Değer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Çalışılan Gün</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">${payroll.workedDays} gün</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Temel Maaş Hakedişi</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">${payroll.basicSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Mesai Saati</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">${payroll.overtimeHours} saat</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Saatlik Mesai Ücreti</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">${payroll.overtimePay.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
                <tr style="background: #e6ffed;">
                  <td style="padding: 8px; border: 1px solid #ccc; color: #059669;">+ Toplam Mesai Hakedişi</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right; color: #059669;">${(payroll.overtimeHours * payroll.overtimePay).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
                <tr style="background: #e6ffed;">
                  <td style="padding: 8px; border: 1px solid #ccc; color: #059669;">+ Prim / İkramiye / Diğer Kazançlar</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right; color: #059669;">${payroll.bonus.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
                <tr style="background: #ffe6e6;">
                  <td style="padding: 8px; border: 1px solid #ccc; color: #dc2626;">- Avans / Kesintiler</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right; color: #dc2626;">${payroll.deductions.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background: #eee; font-weight: bold;">
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">NET ÖDENECEK TUTAR:</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right; color: #059669;">${netSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
        wrapper.style.position = "absolute";
        wrapper.style.left = "-9999px";
        document.body.appendChild(wrapper);

        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Bordro_${payroll.date}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        const pdfBase64DataUri = await html2pdf().set(opt).from(wrapper).outputPdf("datauristring");
        document.body.removeChild(wrapper);

        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             to: selectedPersonnel.email, 
             subject: `${payroll.date} Dönemi Maaş Bordrosu`, 
             html: body,
             attachments: [
               {
                 filename: `Bordro_${payroll.date}.pdf`,
                 path: pdfBase64DataUri
               }
             ]
          })
        });

        if (!res.ok) {
           try {
             const errData = await res.json();
             if (errData.error) throw new Error(errData.error);
           } catch (e:any) {
             throw new Error(e.message || "E-Bordro gönderilemedi.");
           }
           throw new Error("E-Bordro gönderilemedi.");
        }
        
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

        resolve(await res.json());
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise, {
      loading: 'E-Bordro PDF hazırlanıyor ve gönderiliyor...',
      success: `E-Bordro ${selectedPersonnel.email} adresine PDF olarak gönderildi.`,
      error: 'Mail gönderimi sırasında hata oluştu.'
    });
  };

  const [printBordroModalOpen, setPrintBordroModalOpen] = useState(false);
  const [selectedBordroToPrint, setSelectedBordroToPrint] = useState<Payroll | null>(null);

  const [activeTab, setActiveTab] = useState<'Personeller' | 'İşe Alım' | 'İzin Yönetimi'>('Personeller');

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
          <button 
            onClick={() => setActiveTab('İzin Yönetimi')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'İzin Yönetimi' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            İzin Yönetimi
          </button>
        </div>
      </div>

      {activeTab === 'Personeller' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                <div>
                   <p className="text-gray-500 text-sm font-medium">Toplam Personel</p>
                   <p className="text-2xl font-bold text-gray-800">{personnel.filter(p => !p.employmentStatus || p.employmentStatus === 'Aktif').length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><User size={24} /></div>
             </div>
             
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                <div>
                   <p className="text-gray-500 text-sm font-medium">İzindeki Personel</p>
                   <p className="text-2xl font-bold text-gray-800">
                      {personnel.filter(p => p.leaveRecords?.some(l => l.status === 'Onaylandı' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date())).length}
                   </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Calendar size={24} /></div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setActiveTab('İzin Yönetimi')}>
                <div>
                   <p className="text-gray-500 text-sm font-medium">Onay Bekleyen İzinler</p>
                   <p className="text-2xl font-bold text-amber-600">
                      {personnel.reduce((acc, p) => acc + (p.leaveRecords?.filter(l => l.status === 'Bekliyor').length || 0), 0)}
                   </p>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><FileText size={24} /></div>
             </div>
          </div>

          <div className="flex justify-end gap-3 mb-4">
            <button 
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <Download size={20} />
              <span>Excel</span>
            </button>
            <button 
              onClick={exportToPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <Download size={20} />
              <span>PDF</span>
            </button>
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
              {paginatedPersonnel.map((p) => (
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
                        onClick={(e) => { e.stopPropagation(); exportPersonnelDossier(p); }} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="PDF Dosyası Yazdır"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenLeave(p); }} 
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="İzin Yönetimi"
                      >
                        <Calendar size={18} />
                      </button>
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
                        onClick={(e) => { e.stopPropagation(); handleOpenFixtures(p); }} 
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Zimmetler"
                      >
                        <Package size={18} />
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
        {activeTab === 'Personeller' && (
           <Pagination 
             currentPage={currentPage}
             totalPages={totalPages}
             onPageChange={setCurrentPage}
             itemsPerPage={itemsPerPage}
             onItemsPerPageChange={setItemsPerPage}
             totalItems={filteredPersonnel.length}
           />
        )}
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
                      <input required type="text" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soyad <span className="text-red-500">*</span></label>
                      <input required type="text" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No <span className="text-red-500">*</span></label>
                      <input required type="text" maxLength={11} value={formData.tcNo || ''} onChange={e => setFormData({...formData, tcNo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                      <input type="date" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
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
                      <input type="text" placeholder="Örn: A Rh+" value={formData.bloodType || ''} onChange={e => setFormData({...formData, bloodType: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                      <input required type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                      <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <textarea rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acil Kişi Adı</label>
                      <input type="text" value={formData.emergencyContactName || ''} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acil Kişi Tel</label>
                      <input type="tel" value={formData.emergencyContactPhone || ''} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
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

      {/* Zimmet Modal */}
      {isFixtureModalOpen && selectedPersonnel && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex flex-wrap items-center gap-4">
                       <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xl">
                           <Package size={24} />
                       </div>
                       <div>
                           <h3 className="text-xl font-bold text-gray-800">Personel Zimmetleri</h3>
                           <p className="text-sm text-gray-500">{selectedPersonnel.firstName} {selectedPersonnel.lastName} • {selectedPersonnel.position}</p>
                       </div>
                    </div>
                    <button onClick={() => setIsFixtureModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                      <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className={`w-full ${isAddingFixture ? 'hidden md:block md:w-1/2 lg:w-3/5' : ''} border-r border-gray-200 bg-gray-50 flex flex-col`}>
                        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                            <h4 className="font-semibold text-gray-700">Zimmet Geçmişi</h4>
                            <button 
                                onClick={() => {
                                    setFixtureFormData({ productId: '', quantity: 1, dateGiven: new Date().toISOString().split('T')[0] });
                                    setIsAddingFixture(true);
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} /> Yeni Zimmet
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(!selectedPersonnel.fixtures || selectedPersonnel.fixtures.length === 0) ? (
                                <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-100">
                                    <Package size={48} className="mx-auto mb-3 text-gray-300" />
                                    Herhangi bir zimmet kaydı bulunamadı.
                                </div>
                            ) : (
                                selectedPersonnel.fixtures.map(f => (
                                    <div key={f.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                               <span className="font-semibold text-gray-800 text-lg">{f.productName}</span>
                                               <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">{f.quantity} Adet</span>
                                            </div>
                                            <button onClick={() => handleReturnFixture(f.id, f.productId, f.quantity)} className="text-red-500 hover:bg-red-50 text-xs px-2 py-1 rounded font-medium border border-red-200 transition-colors">
                                                İade Al
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500 flex gap-4">
                                            <span>Veriliş: {new Date(f.dateGiven).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add Form */}
                    {isAddingFixture && (
                        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white overflow-y-auto relative">
                             <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Package size={18} className="text-orange-600"/> Yeni Zimmet Ver
                                </h4>
                                <button onClick={() => setIsAddingFixture(false)} className="text-gray-400 hover:text-gray-600 p-1 md:hidden rounded-lg hover:bg-gray-100"><X size={20}/></button>
                             </div>
                             <form onSubmit={handleSaveFixture} className="p-4 space-y-5">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stoktaki Ürün</label>
                                    <select 
                                        required
                                        value={fixtureFormData.productId}
                                        onChange={(e) => setFixtureFormData({...fixtureFormData, productId: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {store.products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                                        ))}
                                    </select>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
                                        <input 
                                            type="number" min="1" required
                                            value={fixtureFormData.quantity}
                                            onChange={(e) => setFixtureFormData({...fixtureFormData, quantity: Number(e.target.value)})}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                     </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Veriliş Tarihi</label>
                                        <input 
                                            type="date" required
                                            value={fixtureFormData.dateGiven}
                                            onChange={(e) => setFixtureFormData({...fixtureFormData, dateGiven: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                     </div>
                                 </div>
                                 
                                 <button type="submit" className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 mt-4 font-medium">
                                    <Plus size={18} /> Zimmeti Kaydet ve Stoktan Düş
                                 </button>
                             </form>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* İzin Yönetimi Modal */}
      {isLeaveModalOpen && selectedPersonnel && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                           <Calendar size={24} />
                       </div>
                       <div>
                           <h3 className="text-xl font-bold text-gray-800">İzin Yönetimi</h3>
                           <p className="text-sm text-gray-500">{selectedPersonnel.firstName} {selectedPersonnel.lastName} • {selectedPersonnel.position}</p>
                       </div>
                    </div>
                    <button onClick={() => setIsLeaveModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                      <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                    {/* List */}
                    <div className={`w-full ${isAddingLeave ? 'hidden md:block md:w-1/2 lg:w-3/5' : ''} border-r border-gray-200 bg-gray-50 flex flex-col`}>
                        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-700">İzin Kayıtları</h4>
                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
                                    Kalan Yıllık İzin: {(selectedPersonnel.annualLeaveEntitlement || 14) - (selectedPersonnel.leaveRecords?.filter(l => l.type === 'Yıllık İzin' && l.status === 'Onaylandı').reduce((sum, l) => sum + l.days, 0) || 0)} Gün
                                </span>
                            </div>
                            <button 
                                onClick={() => {
                                    setLeaveFormData({
                                        id: '',
                                        startDate: new Date().toISOString().split('T')[0],
                                        endDate: new Date().toISOString().split('T')[0],
                                        type: 'Yıllık İzin',
                                        days: 1,
                                        status: 'Bekliyor',
                                        description: ''
                                    });
                                    setIsAddingLeave(true);
                                }}
                                className="text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                            >
                                <Plus size={16} /> Yeni İzin Ekle
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(!selectedPersonnel.leaveRecords || selectedPersonnel.leaveRecords.length === 0) ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                    <Calendar size={48} className="text-gray-300 mb-3" />
                                    <p>Henüz izin kaydı eklenmemiş.</p>
                                </div>
                            ) : (
                                (selectedPersonnel.leaveRecords || []).map((leave) => (
                                    <div key={leave.id} className="bg-white border text-left border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors group relative flex flex-col gap-2">
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setLeaveFormData({
                                                        id: leave.id,
                                                        startDate: leave.startDate,
                                                        endDate: leave.endDate,
                                                        type: leave.type,
                                                        days: leave.days,
                                                        status: leave.status,
                                                        description: leave.description || ''
                                                    });
                                                    setIsAddingLeave(true);
                                                }}
                                                className="text-gray-400 hover:text-purple-500"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteLeave(leave.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                leave.type === 'Yıllık İzin' ? 'bg-blue-100 text-blue-700' :
                                                leave.type === 'Hastalık İzni' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {leave.type}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                leave.status === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700' :
                                                leave.status === 'Bekliyor' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mt-2 mb-2 text-sm">
                                            <div>
                                                <span className="text-gray-500 block text-xs">Başlangıç</span>
                                                <span className="font-medium text-gray-800">{new Date(leave.startDate).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs">Bitiş</span>
                                                <span className="font-medium text-gray-800">{new Date(leave.endDate).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-end border-t pt-2">
                                            <span className="text-sm text-gray-600 truncate mr-4">{leave.description}</span>
                                            <span className="font-bold text-gray-800 shrink-0">{leave.days} Gün</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Form */}
                    {isAddingLeave && (
                        <div className="w-full md:w-1/2 lg:w-2/5 p-6 overflow-y-auto bg-white border-l">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-lg text-gray-800">{leaveFormData.id ? 'İzni Düzenle' : 'Yeni İzin Ekle'}</h4>
                                <button onClick={() => setIsAddingLeave(false)} className="md:hidden text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">İzin Türü</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        value={leaveFormData.type}
                                        onChange={e => setLeaveFormData({...leaveFormData, type: e.target.value as any})}
                                    >
                                        <option value="Yıllık İzin">Yıllık İzin</option>
                                        <option value="Mazeret İzni">Mazeret İzni</option>
                                        <option value="Ücretsiz İzin">Ücretsiz İzin</option>
                                        <option value="Hastalık İzni">Hastalık İzni</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        value={leaveFormData.startDate}
                                        onChange={e => setLeaveFormData({...leaveFormData, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        value={leaveFormData.endDate}
                                        onChange={e => setLeaveFormData({...leaveFormData, endDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gün Sayısı</label>
                                    <input
                                        type="number"
                                        required
                                        min="0.5"
                                        step="0.5"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        value={leaveFormData.days}
                                        onChange={e => setLeaveFormData({...leaveFormData, days: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        value={leaveFormData.status}
                                        onChange={e => setLeaveFormData({...leaveFormData, status: e.target.value as any})}
                                    >
                                        <option value="Bekliyor">Bekliyor</option>
                                        <option value="Onaylandı">Onaylandı</option>
                                        <option value="Reddedildi">Reddedildi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        rows={3}
                                        value={leaveFormData.description}
                                        onChange={e => setLeaveFormData({...leaveFormData, description: e.target.value})}
                                        placeholder="İzin açıklaması..."
                                    />
                                </div>

                                <button
                                    onClick={handleSaveLeave}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    {leaveFormData.id ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(record.type === 'İhtar' || record.type === 'İzin' || record.type === 'Not' || record.type === 'Ödül') && (
                                                <button 
                                                    onClick={() => handleSendRecordSMS(record)}
                                                    className="text-gray-400 hover:text-blue-500"
                                                    title="SMS İle Gönder"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteRecord(record.id)}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Saatlik Mesai Ücreti</label>
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
              <div className="flex justify-between items-start mb-8 border-b-2 pb-6 print:border-black" style={{ borderColor: store.settings?.invoiceTemplate_color || '#1f2937' }}>
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: store.settings?.invoiceTemplate_color || '#111827' }}>PERSONEL MAAŞ BORDROSU</h1>
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
                    <h2 className="font-logo text-3xl font-bold mb-2" style={{ color: store.settings?.invoiceTemplate_color || '#065f46' }}>{store.settings.printer_header_text || 'esila'}</h2>
                  )}
                  <p className="text-sm font-medium" style={{ color: store.settings?.invoiceTemplate_color || '#374151' }}>{store.settings.companyName}</p>
                </div>
              </div>

              {/* Personnel Information */}
              <div className="mb-8">
                <h3 className="font-bold mb-3 border-b pb-2" style={{ borderBottomColor: store.settings?.invoiceTemplate_color || '#e5e7eb', color: store.settings?.invoiceTemplate_color || '#1f2937' }}>Personel Bilgileri</h3>
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
                    <tr className="border-b border-gray-200 print:border-gray-300">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black">Saatlik Mesai Ücreti</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium">{selectedBordroToPrint.overtimePay.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    </tr>
                    <tr className="border-b border-gray-200 print:border-gray-300 bg-emerald-50/30">
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-700 print:text-black text-emerald-800">+ Toplam Mesai Hakedişi</td>
                      <td className="p-3 border-x border-gray-200 print:border-gray-300 text-right font-medium text-emerald-700">{(selectedBordroToPrint.overtimeHours * selectedBordroToPrint.overtimePay).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
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

      {activeTab === 'İzin Yönetimi' && (
        <LeaveManagementView />
      )}
    </div>
  );
};

const LeaveManagementView: React.FC = () => {
  const store = useAppStore();
  const { personnel, setPersonnel } = store;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'Yıllık İzin',
    days: 1,
    status: 'Bekliyor',
    description: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) {
      toast.error('Lütfen personel seçin.');
      return;
    }
    
    setPersonnel(personnel.map(p => {
      if (p.id === selectedPersonId) {
        const leaves = p.leaveRecords || [];
        return {
          ...p,
          leaveRecords: [...leaves, { ...formData, id: Math.random().toString(36).substr(2, 9) } as any]
        };
      }
      return p;
    }));
    toast.success('İzin talebi eklendi.');
    setIsModalOpen(false);
  };

  const handleStatusChange = (personId: string, leaveId: string, newStatus: any) => {
    setPersonnel(personnel.map(p => {
      if (p.id === personId && p.leaveRecords) {
        return {
          ...p,
          leaveRecords: p.leaveRecords.map(lr => lr.id === leaveId ? { ...lr, status: newStatus } : lr)
        };
      }
      return p;
    }));
    toast.success(`İzin durumu '${newStatus}' olarak güncellendi.`);
  };

  const calculateUsedLeave = (p: Personnel) => {
    return (p.leaveRecords || []).filter(l => l.status === 'Onaylandı' && l.type === 'Yıllık İzin').reduce((acc, curr) => acc + curr.days, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h3 className="font-bold text-lg text-gray-800">İzin Yönetimi</h3>
          <p className="text-gray-500 text-sm">Personel yıllık izin, mazeret ve hastalık izinlerinin takibi</p>
        </div>
        <button 
          onClick={() => {
            setFormData({
               id: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0],
               type: 'Yıllık İzin', days: 1, status: 'Bekliyor', description: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Yeni İzin Talebi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {personnel.map(p => {
          const usedLeave = calculateUsedLeave(p);
          const totalLeave = p.annualLeaveEntitlement || 14;
          const remainingLeave = totalLeave - usedLeave;
          
          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{p.firstName} {p.lastName}</h4>
                  <p className="text-xs text-gray-500">{p.position}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-center">
                 <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
                    <p className="text-gray-500 text-xs mb-1 drop-shadow-sm">Kalan Yıllık İzin</p>
                    <p className={`font-bold text-xl ${remainingLeave <= 3 ? 'text-red-500' : 'text-emerald-600'}`}>{remainingLeave} <span className="text-sm font-normal">Gün</span></p>
                 </div>
                 <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
                    <p className="text-gray-500 text-xs mb-1 drop-shadow-sm">Kullanılan</p>
                    <p className="font-bold text-xl text-gray-700">{usedLeave} <span className="text-sm font-normal">Gün</span></p>
                 </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3">
                 <h5 className="text-xs font-semibold text-gray-500 mb-2">Son İzin Hareketleri</h5>
                 {p.leaveRecords && p.leaveRecords.length > 0 ? (
                    <div className="space-y-2">
                      {p.leaveRecords.slice(-3).reverse().map((lr, idx) => (
                        <div key={idx} className="flex flex-col text-xs p-2 bg-gray-50 rounded gap-2">
                           <div className="flex justify-between items-center">
                              <div>
                                 <span className="font-medium text-gray-800">{lr.type}</span>
                                 <span className="block text-gray-500">{new Date(lr.startDate).toLocaleDateString('tr-TR')} ({lr.days} Gün)</span>
                              </div>
                              <span className={`px-2 py-1 rounded font-medium ${lr.status === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700' : lr.status === 'Reddedildi' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{lr.status}</span>
                           </div>
                           {lr.status === 'Bekliyor' && (
                             <div className="flex justify-end gap-1 mt-1 border-t border-gray-200 pt-2">
                                <button onClick={() => handleStatusChange(p.id, lr.id, 'Reddedildi')} className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors text-[10px] font-medium border border-red-200">Reddet</button>
                                <button onClick={() => handleStatusChange(p.id, lr.id, 'Onaylandı')} className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors text-[10px] font-medium border border-emerald-200">Onayla</button>
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                 ) : (
                    <p className="text-xs text-gray-400">İzin kaydı bulunmuyor.</p>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-lg text-gray-800">Yeni İzin Talebi</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleSave} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personel</label>
                  <select value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg bg-white">
                    <option value="">Personel Seçin</option>
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İzin Türü</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white">
                      <option value="Yıllık İzin">Yıllık İzin</option>
                      <option value="Mazeret İzni">Mazeret İzni</option>
                      <option value="Hastalık İzni">Hastalık İzni</option>
                      <option value="Ücretsiz İzin">Ücretsiz İzin</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gün Sayısı</label>
                    <input type="number" min="0.5" step="0.5" value={formData.days} onChange={e => setFormData({...formData, days: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">İzin Durumu</label>
                   <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white">
                     <option value="Bekliyor">Bekliyor</option>
                     <option value="Onaylandı">Onaylandı</option>
                     <option value="Reddedildi">Reddedildi</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama / Sebebi</label>
                   <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg placeholder-gray-400" placeholder="İsteğe bağlı açıklama..."></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">İptal</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"><Save size={18} /> Kaydet</button>
                </div>
             </form>
          </div>
        </div>
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
