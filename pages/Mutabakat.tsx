import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Search, Plus, Mail, CheckCircle, XCircle, Clock, Users, MessageCircle, MessageSquare, Mic, MicOff, CheckSquare, ExternalLink, Printer, Download, FileText, Bell } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Reconciliation, ReconciliationStatus, Customer } from '../types';
import { apiFetch, invalidateApiCache } from '../lib/api';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { sendSMS } from '../src/utils/smsRequest';
import { hasPermission } from '../lib/permissions';

export const Mutabakat: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'mutabakat', 'view');
  const canCreate = hasPermission(currentUser, 'mutabakat', 'create');
  const canEdit = hasPermission(currentUser, 'mutabakat', 'edit');
  const canDelete = hasPermission(currentUser, 'mutabakat', 'delete');

  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isListening, supported, listen, stop } = useSpeechRecognition();
  const [activeSpeechField, setActiveSpeechField] = useState<string | null>(null);

  const startListening = (field: string, updateFn: (text: string) => void) => {
    if (isListening && activeSpeechField === field) {
      stop();
      setActiveSpeechField(null);
    } else {
      if (isListening) stop();
      setActiveSpeechField(field);
      listen((text) => {
        updateFn(text);
      });
    }
  };

  const [formData, setFormData] = useState<Partial<Reconciliation> & { sendSms?: boolean; customerEmail?: string }>({
    date: new Date().toISOString().split('T')[0],
    balanceType: 'Borç',
    balance: 0,
    status: ReconciliationStatus.PENDING,
    notes: '',
    sendSms: false,
    customerEmail: ''
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    sendSms: false
  });

  const getTenantVkn = () => {
    return localStorage.getItem('esila_tenant_id') || store.settings?.taxNumber || '1111111111';
  };

  const getCustomerRawBalance = useCallback((customer?: Customer): number => {
    if (!customer) return 0;
    const explicitBalance = Number(customer.balance);
    if (Number.isFinite(explicitBalance) && explicitBalance !== 0) {
      return explicitBalance;
    }

    // Fallback 1: Calculate from customer transactions if available
    const customerTxs = (store.transactions || []).filter((t: any) => String(t.customerId) === String(customer.id));
    if (customerTxs.length > 0) {
      const txSum = customerTxs.reduce((acc: number, t: any) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'Satış' || t.type === 'Borç' || t.type === 'Ödeme') {
          return acc + amt;
        }
        return acc - amt;
      }, 0);
      if (txSum !== 0) return txSum;
    }

    // Fallback 2: Check eInvoices if customer was auto-created from E-Fatura
    const matchingInvoices = (store.eInvoices || []).filter(
      (inv: any) =>
        (customer.taxNumber && String(inv.supplierTaxNumber) === String(customer.taxNumber)) ||
        (customer.companyName && inv.customerName === customer.companyName) ||
        (customer.name && inv.customerName === customer.name)
    );
    if (matchingInvoices.length > 0) {
      const invSum = matchingInvoices.reduce((acc: number, inv: any) => {
        const amt = Number(inv.amount) || 0;
        return inv.type === 'Gelen Fatura' ? acc - amt : acc + amt;
      }, 0);
      if (invSum !== 0) return invSum;
    }

    return Number.isFinite(explicitBalance) ? explicitBalance : 0;
  }, [store.transactions, store.eInvoices]);

  const fetchReconciliations = useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      invalidateApiCache('/api/reconciliations');
      const res = await apiFetch(`/api/reconciliations?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) {
        setReconciliations([]);
        return;
      }
      const data = await res.json();
      const list: Reconciliation[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.reconciliations)
        ? data.reconciliations
        : [];
      setReconciliations(list);
      if (store.setReconciliations) {
        store.setReconciliations(list);
      }
      if (showToast) {
        toast.success('Mutabakat durumları güncellendi.');
      }
    } catch (e) {
      console.error(e);
      if (showToast) {
        toast.error('Mutabakat listesi yenilenemedi.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [store.setReconciliations]);

  useEffect(() => {
    fetchReconciliations(false);
    const int = setInterval(() => fetchReconciliations(false), 8000);

    const handleStorageOrFocus = (e?: StorageEvent) => {
      if (!e || e.key === 'esila_mutabakat_updated') {
        fetchReconciliations(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchReconciliations(false);
      }
    };

    window.addEventListener('storage', handleStorageOrFocus);
    window.addEventListener('focus', () => fetchReconciliations(false));
    document.addEventListener('visibilitychange', handleVisibility);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('esila_mutabakat_channel');
        bc.onmessage = () => {
          fetchReconciliations(false);
        };
      } catch (_e) {}
    }

    return () => {
      clearInterval(int);
      window.removeEventListener('storage', handleStorageOrFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (bc) bc.close();
    };
  }, [fetchReconciliations]);

  const sendEmailAlert = async (reconciliation: any, customer: Partial<Customer>, explicitEmail?: string) => {
    const recipientEmail = (explicitEmail || customer?.email || reconciliation?.customerEmail || '').trim();
    if (!recipientEmail) {
      toast('Cariye ait e-posta adresi bulunmadığı için e-posta gönderilmedi.', { icon: 'ℹ️' });
      return false;
    }

    const safeBalance = Number(reconciliation.balance) || 0;
    const vknParam = reconciliation.vkn || getTenantVkn();
    const templateRaw = store.settings.email_template_reconciliation || defaultTemplates.reconciliation;
    const body = parseEmailTemplate(templateRaw, {
      MUSTERI_ADI: customer.companyName || customer.name || reconciliation.customerName || '',
      BAKIYE: safeBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      BAKIYE_TIPI: reconciliation.balanceType || 'Borç',
      FIRMA_ADI: store.settings.companyName || 'Esila Ticari',
      FIRMA_TELEFON: store.settings.phone || '',
      FIRMA_MAIL: store.settings.email || '',
      FIRMA_ADRES: store.settings.address || '',
      FIRMA_VERGI_DAIRESI: store.settings.taxOffice || '',
      FIRMA_VKN: store.settings.taxNumber || vknParam,
      TARIH: new Date(reconciliation.date || Date.now()).toLocaleDateString('tr-TR'),
      MUTABAKAT_LINKI: `${window.location.origin}/mutabakat-onay/${reconciliation.id}?vkn=${vknParam}`
    });

    const promise = apiFetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        subject: `Bakiye Mutabakatı - ${store.settings.companyName || 'Esila Ticari'}`,
        html: body
      })
    }).then(async res => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'E-posta gönderimi başarısız oldu.');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: `${customer.companyName || customer.name || reconciliation.customerName} için mutabakat e-postası gönderiliyor...`,
      success: `${recipientEmail} adresine mutabakat e-postası gönderildi.`,
      error: (err) => `Mutabakat kaydedildi ancak e-posta gönderilemedi: ${err.message || 'Sunucu hatası'}`
    });

    try {
      await promise;
      return true;
    } catch (_e) {
      return false;
    }
  };

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const sendReminderEmailAlert = async (
    reconciliation: Reconciliation,
    customer: Partial<Customer>,
    explicitEmail?: string
  ) => {
    const recipientEmail = (
      explicitEmail ||
      customer?.email ||
      (reconciliation as any)?.customerEmail ||
      ''
    ).trim();
    if (!recipientEmail) {
      toast('Cariye ait e-posta adresi bulunmadığı için hatırlatma e-postası gönderilmedi.', {
        icon: 'ℹ️'
      });
      return false;
    }

    const safeBalance = Number(reconciliation.balance) || 0;
    const vknParam = (reconciliation as any).vkn || getTenantVkn();
    const companyTitle = store.settings.companyName || 'Esila Ticari';
    const customerTitle =
      customer.companyName || customer.name || reconciliation.customerName || '';
    const formattedDate = new Date(reconciliation.date || Date.now()).toLocaleDateString('tr-TR');
    const formattedBalance = safeBalance.toLocaleString('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    });
    const onlineUrl = `${window.location.origin}/mutabakat-onay/${reconciliation.id}?vkn=${vknParam}`;

    const reminderBannerHtml = `
      <div style="max-width: 600px; margin: 0 auto 14px auto; background-color: #fffbeb; border: 1px solid #f59e0b; border-left: 5px solid #d97706; border-radius: 8px; padding: 14px 18px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #92400e;">
          🔔 HATIRLATMA: Bekleyen Cari Hesap Mutabakatınız Bulunmaktadır
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #78350f; line-height: 1.5;">
          Sayın <strong>${customerTitle}</strong>, <strong>${formattedDate}</strong> dönemine ait <strong>${formattedBalance} (${reconciliation.balanceType || 'Borç'})</strong> tutarındaki mutabakat mektubumuz onayınızı beklemektedir. Aşağıdaki bağlantı üzerinden tek tıkla mutabakat yanıtınızı iletebilirsiniz.
        </p>
      </div>
    `;

    const templateRaw =
      store.settings.email_template_reconciliation || defaultTemplates.reconciliation;
    const baseBody = parseEmailTemplate(templateRaw, {
      MUSTERI_ADI: customerTitle,
      BAKIYE: formattedBalance,
      BAKIYE_TIPI: reconciliation.balanceType || 'Borç',
      FIRMA_ADI: companyTitle,
      FIRMA_TELEFON: store.settings.phone || '',
      FIRMA_MAIL: store.settings.email || '',
      FIRMA_ADRES: store.settings.address || '',
      FIRMA_VERGI_DAIRESI: store.settings.taxOffice || '',
      FIRMA_VKN: store.settings.taxNumber || vknParam,
      TARIH: formattedDate,
      MUTABAKAT_LINKI: onlineUrl
    });

    const fullHtml = `${reminderBannerHtml}${baseBody}`;

    const promise = apiFetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        subject: `[HATIRLATMA] Bekleyen Bakiye Mutabakatı - ${companyTitle}`,
        html: fullHtml
      })
    }).then(async (res) => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Hatırlatma e-postası gönderimi başarısız oldu.');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: `${customerTitle} carisine hatırlatma e-postası gönderiliyor...`,
      success: `${recipientEmail} adresine mutabakat hatırlatması gönderildi.`,
      error: (err) => `Hatırlatma e-postası gönderilemedi: ${err.message || 'Sunucu hatası'}`
    });

    try {
      await promise;
      return true;
    } catch (_e) {
      return false;
    }
  };

  const handleSendReminder = async (r: Reconciliation) => {
    if (r.status !== ReconciliationStatus.PENDING) {
      toast('Sadece bekleyen mutabakatlar için hatırlatıcı gönderilebilir.', { icon: 'ℹ️' });
      return;
    }

    const customer = store.customers.find((c) => c.id === r.customerId);
    const targetMail = (customer?.email || (r as any).customerEmail || '').trim();

    if (!targetMail) {
      setFormData({
        customerId: r.customerId,
        customerEmail: '',
        date: r.date || new Date().toISOString().split('T')[0],
        balance: Number(r.balance) || 0,
        balanceType: r.balanceType || 'Borç',
        status: ReconciliationStatus.PENDING,
        notes: r.notes || '',
        sendSms: false
      });
      setIsModalOpen(true);
      toast(
        'Carinin kayıtlı e-posta adresi bulunamadı. Lütfen açılan pencereden alıcı e-posta adresini girerek gönderin.',
        {
          icon: 'ℹ️',
          duration: 4500
        }
      );
      return;
    }

    setRemindingId(r.id);
    try {
      const sentOk = await sendReminderEmailAlert(
        r,
        customer || { name: r.customerName, email: targetMail },
        targetMail
      );
      if (sentOk) {
        const updatedEmailSentAt = new Date().toISOString();
        await apiFetch(`/api/reconciliations/${r.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...r,
            customerEmail: targetMail,
            emailSentAt: updatedEmailSentAt
          })
        });
        await fetchReconciliations(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Hatırlatıcı gönderilirken hata oluştu.');
    } finally {
      setRemindingId(null);
    }
  };

  const handleResendReconciliation = async (r: Reconciliation) => {
    const customer = store.customers.find(c => c.id === r.customerId);
    const targetMail = (customer?.email || (r as any).customerEmail || '').trim();

    if (!targetMail) {
      // Pre-fill modal so user can type recipient email and send
      setFormData({
        customerId: r.customerId,
        customerEmail: '',
        date: r.date || new Date().toISOString().split('T')[0],
        balance: Number(r.balance) || 0,
        balanceType: r.balanceType || 'Borç',
        status: ReconciliationStatus.PENDING,
        notes: r.notes || '',
        sendSms: false
      });
      setIsModalOpen(true);
      toast('Carinin kayıtlı e-posta adresi bulunamadı. Lütfen açılan pencereden alıcı e-posta adresini girerek gönderin.', {
        icon: 'ℹ️',
        duration: 4500
      });
      return;
    }

    setResendingId(r.id);
    try {
      const sentOk = await sendEmailAlert(r, customer || { name: r.customerName, email: targetMail }, targetMail);
      const updatedEmailSentAt = new Date().toISOString();
      await apiFetch(`/api/reconciliations/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...r,
          customerEmail: targetMail,
          emailSentAt: updatedEmailSentAt
        })
      });
      await fetchReconciliations(false);
      if (sentOk) {
        toast.success(`${r.customerName} için mutabakat tekrar gönderildi.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Tekrar gönderim sırasında hata oluştu.');
    } finally {
      setResendingId(null);
    }
  };

  const handleQuickDecision = async (id: string, action: 'approve' | 'reject', vkn?: string) => {
    try {
      const res = await apiFetch(`/api/reconciliations/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vkn: vkn || getTenantVkn(),
          notes: action === 'approve' ? 'Panel üzerinden onaylandı' : 'Panel üzerinden reddedildi'
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'İşlem başarısız');
      }
      toast.success(action === 'approve' ? 'Mutabakat onaylandı.' : 'Mutabakat reddedildi.');
      await fetchReconciliations(false);
    } catch (err: any) {
      toast.error(err.message || 'Durum güncellenemedi.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Lütfen Cari seçiniz.');
      return;
    }
    const customer = store.customers.find(c => c.id === formData.customerId);
    const targetEmail = (formData.customerEmail ?? customer?.email ?? '').trim();
    const numericBalance = Number(formData.balance);
    const safeBalance = Number.isFinite(numericBalance) ? Math.abs(numericBalance) : 0;

    setIsSubmitting(true);
    try {
      // If user entered/updated the customer's email in the modal, save it to the customer record too
      if (customer && targetEmail && targetEmail !== (customer.email || '').trim()) {
        const updatedCustomer = { ...customer, email: targetEmail };
        store.setCustomers(prev => prev.map(c => (c.id === customer.id ? updatedCustomer : c)));
      }

      const res = await apiFetch('/api/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          balance: safeBalance,
          balanceType: formData.balanceType || (safeBalance === 0 ? 'Yok' : 'Borç'),
          customerName: customer?.companyName || customer?.name || 'Bilinmiyor',
          customerEmail: targetEmail,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Mutabakat kaydedilemedi.');
      }

      const newlyCreated = await res.json();
      toast.success('Mutabakat kaydı oluşturuldu.');

      if (targetEmail) {
        await sendEmailAlert(newlyCreated, customer || { name: newlyCreated.customerName }, targetEmail);
      } else {
        toast('Alıcı e-posta adresi girilmediği için e-posta gönderilmedi. Tablodaki butonlarla WhatsApp, SMS veya Onay Linki paylaşabilirsiniz.', {
          icon: 'ℹ️',
          duration: 5000
        });
      }

      if (formData.sendSms && customer?.phone) {
        const vknParam = newlyCreated.vkn || getTenantVkn();
        const text = `Sayın ${customer.companyName || customer.name} yetkilisi, ${new Date(newlyCreated.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${Number(newlyCreated.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${newlyCreated.balanceType}) mutabıktır. Linkten onaylayabilirsiniz: ${window.location.origin}/mutabakat-onay/${newlyCreated.id}?vkn=${vknParam} - ${store.settings?.companyName || ''}`;
        try {
          await sendSMS(store.settings, [customer.phone], text);
          toast.success('SMS başarıyla gönderildi!');
        } catch (err: any) {
          toast.error('SMS Gönderilemedi: ' + (err.message || 'Hata'));
        }
      }

      setIsModalOpen(false);
      await fetchReconciliations(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        balanceType: 'Borç',
        balance: 0,
        status: ReconciliationStatus.PENDING,
        notes: '',
        sendSms: false,
        customerEmail: ''
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Mutabakat gönderilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingBulk(true);
    let sentCount = 0;

    for (const customer of store.customers) {
      const rawBalance = getCustomerRawBalance(customer);
      if (!customer.email && rawBalance === 0 && !bulkFormData.sendSms) continue;

      const isDebt = rawBalance >= 0;
      const bType = rawBalance === 0 ? 'Yok' : (isDebt ? 'Borç' : 'Alacak');
      const safeBalance = Math.abs(rawBalance);

      try {
        const res = await apiFetch('/api/reconciliations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer.id,
            customerName: customer.companyName || customer.name || 'Bilinmiyor',
            customerEmail: customer.email || '',
            date: bulkFormData.date,
            balance: safeBalance,
            balanceType: bType,
            status: ReconciliationStatus.PENDING,
            notes: bulkFormData.notes
          }),
        });
        if (res.ok) {
          const newlyCreated = await res.json();
          if (customer.email) {
            await sendEmailAlert(newlyCreated, customer, customer.email);
          }
          if (bulkFormData.sendSms && customer.phone) {
            const vknParam = newlyCreated.vkn || getTenantVkn();
            const text = `Sayın ${customer.companyName || customer.name} yetkilisi, ${new Date(newlyCreated.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${Number(newlyCreated.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${newlyCreated.balanceType}) mutabıktır. Linkten onaylayabilirsiniz: ${window.location.origin}/mutabakat-onay/${newlyCreated.id}?vkn=${vknParam} - ${store.settings?.companyName || ''}`;
            try {
              await sendSMS(store.settings, [customer.phone], text);
            } catch (_e) {}
          }
          sentCount++;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setIsSendingBulk(false);
    setIsBulkModalOpen(false);
    await fetchReconciliations(false);
    setBulkFormData({
      date: new Date().toISOString().split('T')[0],
      notes: '',
      sendSms: false
    });
    if (sentCount > 0) {
      toast.success(`${sentCount} adet cariye mutabakat başarıyla oluşturuldu ve gönderildi.`);
    } else {
      toast('Gönderilecek uygun cari bulunamadı (e-posta adresi veya bakiyesi olan cari yok).', { icon: 'ℹ️' });
    }
  };

  const calculateAutoBalance = (customerId: string) => {
    const customer = store.customers.find(c => c.id === customerId);
    if (!customer) {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        balance: 0,
        balanceType: 'Borç',
        customerEmail: ''
      }));
      return;
    }
    const rawBalance = getCustomerRawBalance(customer);
    const isDebt = rawBalance >= 0;
    setFormData(prev => ({
      ...prev,
      customerId,
      customerEmail: customer.email || '',
      balance: Math.abs(rawBalance),
      balanceType: rawBalance === 0 ? 'Yok' : (isDebt ? 'Borç' : 'Alacak')
    }));
  };

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredReconciliations = reconciliations.filter(r => {
    const searchMatch = (r.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;
    if (activeTab === 'pending') return r.status === ReconciliationStatus.PENDING;
    if (activeTab === 'approved') return r.status === ReconciliationStatus.APPROVED;
    if (activeTab === 'rejected') return r.status === ReconciliationStatus.REJECTED;
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredReconciliations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReconciliations = itemsPerPage === -1 ? filteredReconciliations : filteredReconciliations.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Mutabakat Geçmişi tablosu sıralı listesi ve toplu seçim / PDF yazdırma-indirme durumları
  const sortedHistoryReconciliations = [...reconciliations].sort(
    (a, b) =>
      new Date(b.emailSentAt || b.date).getTime() -
      new Date(a.emailSentAt || a.date).getTime()
  );

  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  useEffect(() => {
    setSelectedHistoryIds(prev => prev.filter(id => reconciliations.some(r => r.id === id)));
  }, [reconciliations]);

  const selectedHistoryItems = sortedHistoryReconciliations.filter(r =>
    selectedHistoryIds.includes(r.id)
  );

  const isAllHistorySelected =
    sortedHistoryReconciliations.length > 0 &&
    selectedHistoryIds.length === sortedHistoryReconciliations.length;

  const toggleSelectHistoryRow = (id: string) => {
    setSelectedHistoryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllHistory = () => {
    if (isAllHistorySelected) {
      setSelectedHistoryIds([]);
    } else {
      setSelectedHistoryIds(sortedHistoryReconciliations.map(r => r.id));
    }
  };

  const handleBulkDownloadPDF = async () => {
    if (selectedHistoryItems.length === 0) {
      toast.error('Lütfen PDF olarak indirmek için en az bir mutabakat seçin.');
      return;
    }

    const element = document.getElementById('mutabakat-bulk-pdf-container');
    if (!element) {
      toast.error('PDF şablonu hazırlanamadı.');
      return;
    }

    setIsDownloadingPdf(true);
    const loadingToast = toast.loading(
      `${selectedHistoryItems.length} adet seçili mutabakat PDF olarak hazırlanıyor...`
    );

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`Mutabakat_Gecmisi_${selectedHistoryItems.length}_Kayit_${dateStr}.pdf`);
      toast.success(
        `${selectedHistoryItems.length} adet mutabakat tek seferde PDF olarak indirildi.`,
        { id: loadingToast }
      );
    } catch (error) {
      console.error('Toplu PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken bir hata oluştu.', { id: loadingToast });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleOpenBulkPrintPreview = () => {
    if (selectedHistoryItems.length === 0) {
      toast.error('Lütfen yazdırmak veya PDF önizlemek için en az bir mutabakat seçin.');
      return;
    }
    setIsPrintPreviewOpen(true);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <CheckSquare size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Mutabakat modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold rounded-lg text-gray-800">Mutabakat Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri/Tedarikçi bakiye mutabakatlarını yönetin</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Users size={20} />
                <span className="hidden sm:inline">Toplu Mutabakat Gönder</span>
                <span className="sm:hidden">Toplu Gönder</span>
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Yeni Mutabakat Gönder</span>
                <span className="sm:hidden">Yeni Gönder</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tümü ({reconciliations.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock size={16} />
              Onay Bekleyenler ({reconciliations.filter(r => r.status === ReconciliationStatus.PENDING).length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'approved'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle size={16} />
              Onaylananlar ({reconciliations.filter(r => r.status === ReconciliationStatus.APPROVED).length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <XCircle size={16} />
              Reddedilenler ({reconciliations.filter(r => r.status === ReconciliationStatus.REJECTED).length})
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative max-w-full sm:max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari adı ile ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchReconciliations(true)}
            disabled={isRefreshing}
            className="flex gap-2 items-center text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Yenileniyor...' : 'Yenile'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">Tarih</th>
                <th className="py-3 px-4">Cari Adı</th>
                <th className="py-3 px-4">Bakiye</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-center">İletişim & Tekrar Gönder</th>
                <th className="py-3 px-4 text-right">Online Onay / İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">Yükleniyor...</td>
                </tr>
              ) : paginatedReconciliations.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">Kayıtlı mutabakat bulunamadı.</td>
                </tr>
              ) : paginatedReconciliations.map((r) => {
                const safeBalance = Number(r.balance) || 0;
                const rowVkn = (r as any).vkn || getTenantVkn();
                const onlineUrl = `${window.location.origin}/mutabakat-onay/${r.id}?vkn=${rowVkn}`;
                return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div>{r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'}</div>
                    {r.emailSentAt && (
                      <div className="text-[11px] text-gray-400">
                        Gönderim: {new Date(r.emailSentAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    <div>{r.customerName}</div>
                    {r.responseNotes && (
                      <div className="text-xs text-gray-500 italic mt-0.5">Not: "{r.responseNotes}"</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{safeBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                    <div className="text-xs text-gray-500">{r.balanceType}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      r.status === ReconciliationStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                      r.status === ReconciliationStatus.REJECTED ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status === ReconciliationStatus.APPROVED && <CheckCircle size={14} />}
                      {r.status === ReconciliationStatus.REJECTED && <XCircle size={14} />}
                      {r.status === ReconciliationStatus.PENDING && <Clock size={14} />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                       {r.status === ReconciliationStatus.PENDING && (
                         <button
                           type="button"
                           disabled={remindingId === r.id || resendingId === r.id}
                           onClick={() => handleSendReminder(r)}
                           className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                           title="Bekleyen mutabakat için ilgili cariye tek tıkla e-posta ile otomatik hatırlatma gönder"
                         >
                           <Bell size={13} className={remindingId === r.id ? 'animate-bounce' : ''} />
                           <span>{remindingId === r.id ? 'Gönderiliyor...' : 'Hatırlatıcı Gönder'}</span>
                         </button>
                       )}

                       <button
                         type="button"
                         disabled={resendingId === r.id || remindingId === r.id}
                         onClick={() => handleResendReconciliation(r)}
                         className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                         title={
                           r.emailSentAt
                             ? `Son Gönderim: ${new Date(r.emailSentAt).toLocaleString('tr-TR')}`
                             : 'Mutabakatı Tekrar Gönder'
                         }
                       >
                         <RefreshCcw size={13} className={resendingId === r.id ? 'animate-spin' : ''} />
                         <span>{resendingId === r.id ? 'Gönderiliyor...' : 'Tekrar Gönder'}</span>
                       </button>
                       
                       <button 
                         onClick={() => {
                           const customer = store.customers.find(c => c.id === r.customerId);
                           if (!customer?.phone) {
                             toast.error('Müşterinin telefon numarası kayıtlı değil.');
                             return;
                           }
                           const ibanText = (r.balanceType === 'Borç' && store.settings?.iban) ? `\n\nÖdeme Bilgilerimiz:\nBanka: ${store.settings?.bankName || ''}\nIBAN: ${store.settings?.iban}` : '';
                           const text = `Sayın ${r.customerName} yetkilisi, güncel kayıtlarımıza göre ${new Date(r.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${safeBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} (${r.balanceType}) tutarında mutabıktır. Linkten teyit etmenizi rica ederiz: ${onlineUrl} ${ibanText}\n\nSaygılarımızla, ${store.settings?.companyName || 'Şirket'}`;
                           window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                         }}
                         className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                         title="WhatsApp ile Gönder"
                       >
                         <MessageCircle size={16} />
                       </button>
                       <button 
                         onClick={async () => {
                           const customer = store.customers.find(c => c.id === r.customerId);
                           if (!customer?.phone) {
                             toast.error('Müşterinin telefon numarası kayıtlı değil.');
                             return;
                           }
                           const ibanText = (r.balanceType === 'Borç' && store.settings?.iban) ? ` Ödeme: ${store.settings?.iban}` : '';
                           const text = `Sayın ${r.customerName} yetkilisi, ${new Date(r.date).toLocaleDateString('tr-TR')} itibariyle bakiyemiz ${safeBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${r.balanceType}) mutabıktır. Linkten onaylayabilirsiniz: ${onlineUrl} ${ibanText} ${store.settings?.companyName || 'Şirket'}`;
                           try {
                             await sendSMS(store.settings, [customer.phone], text);
                             toast.success('SMS başarıyla gönderildi!');
                           } catch (err: any) {
                             toast.error(err.message || 'SMS gönderilirken bir hata oluştu.');
                           }
                         }}
                         className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                         title="SMS ile Gönder"
                       >
                         <MessageSquare size={16} />
                       </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <a
                        href={onlineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded inline-flex items-center gap-1"
                        title="Müşterinin göreceği Online Mutabakat Onay sayfasını aç"
                      >
                        <ExternalLink size={12} /> Online Sayfa
                      </a>
                      {r.status === ReconciliationStatus.PENDING && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickDecision(r.id, 'approve', rowVkn)}
                            className="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded cursor-pointer"
                          >
                            Onayla
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDecision(r.id, 'reject', rowVkn)}
                            className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                          >
                            Reddet
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      <Pagination currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredReconciliations.length}
        />
        </div>

        {/* Gönderilmiş Mutabakatların Durumunu Gösteren Mutabakat Geçmişi Tablosu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Mutabakat Geçmişi</h2>
                <p className="text-xs text-gray-500">
                  Gönderilmiş tüm mutabakatların durumu (Bekliyor, Onaylandı, Reddedildi), toplu PDF indirme/yazdırma ve tekrar gönderim işlemleri
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedHistoryIds.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                  <span>{selectedHistoryIds.length} seçili</span>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryIds([])}
                    className="ml-1 text-indigo-500 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={selectedHistoryIds.length === 0 || isDownloadingPdf}
                onClick={handleBulkDownloadPDF}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs"
                title="Seçili mutabakatları tek seferde PDF olarak indir"
              >
                <Download size={14} className={isDownloadingPdf ? 'animate-bounce' : ''} />
                <span>
                  {isDownloadingPdf
                    ? 'PDF Hazırlanıyor...'
                    : `PDF İndir${selectedHistoryIds.length > 0 ? ` (${selectedHistoryIds.length})` : ''}`}
                </span>
              </button>

              <button
                type="button"
                disabled={selectedHistoryIds.length === 0}
                onClick={handleOpenBulkPrintPreview}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                title="Seçili mutabakatları toplu yazdır veya önizle"
              >
                <Printer size={14} />
                <span>
                  Toplu Yazdır{selectedHistoryIds.length > 0 ? ` (${selectedHistoryIds.length})` : ''}
                </span>
              </button>

              <div className="h-4 w-px bg-gray-200 mx-0.5 hidden sm:block" />

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  Bekliyor: {reconciliations.filter(r => r.status === ReconciliationStatus.PENDING).length}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  Onaylandı: {reconciliations.filter(r => r.status === ReconciliationStatus.APPROVED).length}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                  Reddedildi: {reconciliations.filter(r => r.status === ReconciliationStatus.REJECTED).length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllHistorySelected}
                      onChange={toggleSelectAllHistory}
                      disabled={sortedHistoryReconciliations.length === 0}
                      className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                      title="Tümünü Seç / Seçimi Kaldır"
                    />
                  </th>
                  <th className="py-3 px-4">Gönderim Tarihi</th>
                  <th className="py-3 px-4">Cari Adı / Alıcı</th>
                  <th className="py-3 px-4">Mutabakat Dönemi</th>
                  <th className="py-3 px-4">Bakiye Tutarı</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4">Yanıt Tarihi & Not</th>
                  <th className="py-3 px-4 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedHistoryReconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Henüz gönderilmiş mutabakat geçmişi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  sortedHistoryReconciliations.map((r) => {
                    const customer = store.customers.find(c => c.id === r.customerId);
                    const emailAddr = customer?.email || (r as any).customerEmail || '';
                    const safeBalance = Number(r.balance) || 0;
                    const isSelected = selectedHistoryIds.includes(r.id);
                    return (
                      <tr
                        key={`history-${r.id}`}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectHistoryRow(r.id)}
                            className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                          {r.emailSentAt
                            ? new Date(r.emailSentAt).toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : r.date
                            ? new Date(r.date).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-800">{r.customerName}</div>
                          <div className="text-xs text-gray-400">
                            {emailAddr || 'E-posta kayıtlı değil'}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                          {r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-800">
                            {safeBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                          </span>{' '}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                            {r.balanceType}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                              r.status === ReconciliationStatus.APPROVED
                                ? 'bg-emerald-100 text-emerald-700'
                                : r.status === ReconciliationStatus.REJECTED
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {r.status === ReconciliationStatus.APPROVED && <CheckCircle size={13} />}
                            {r.status === ReconciliationStatus.REJECTED && <XCircle size={13} />}
                            {r.status === ReconciliationStatus.PENDING && <Clock size={13} />}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {r.respondedAt ? (
                            <div>
                              <div className="font-medium text-gray-700">
                                {new Date(r.respondedAt).toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {r.responseNotes && (
                                <div className="italic text-gray-500 mt-0.5">"{r.responseNotes}"</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Yanıt bekleniyor</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {r.status === ReconciliationStatus.PENDING && (
                              <button
                                type="button"
                                disabled={remindingId === r.id || resendingId === r.id}
                                onClick={() => handleSendReminder(r)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                title="Bekleyen mutabakat için ilgili cariye tek tıkla e-posta ile otomatik hatırlatma gönder"
                              >
                                <Bell size={13} className={remindingId === r.id ? 'animate-bounce' : ''} />
                                <span>{remindingId === r.id ? 'Gönderiliyor...' : 'Hatırlatıcı Gönder'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={resendingId === r.id || remindingId === r.id}
                              onClick={() => handleResendReconciliation(r)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCcw size={13} className={resendingId === r.id ? 'animate-spin' : ''} />
                              <span>{resendingId === r.id ? 'Gönderiliyor...' : 'Tekrar Gönder'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-700">Son Hareket Özeti</h3>
            </div>
            <div className="p-0 max-h-[calc(100vh-200px)] overflow-y-auto">
              {reconciliations
                .slice()
                .sort((a, b) => new Date(b.respondedAt || b.emailSentAt || b.date).getTime() - new Date(a.respondedAt || a.emailSentAt || a.date).getTime())
                .slice(0, 15)
                .map((r, i) => (
                  <div key={r.id + i} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-800 line-clamp-1" title={r.customerName}>{r.customerName}</span>
                      {r.status === 'Onaylandı' ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      ) : r.status === 'Reddedildi' ? (
                        <XCircle size={16} className="text-red-500 shrink-0" />
                      ) : (
                        <Clock size={16} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      <span
                        className={
                          r.status === 'Onaylandı'
                            ? 'text-emerald-600 font-medium'
                            : r.status === 'Reddedildi'
                            ? 'text-red-600 font-medium'
                            : 'text-amber-600 font-medium'
                        }
                      >
                        {r.status}
                      </span>
                      <span className="mx-1">•</span>
                      {new Date(r.respondedAt || r.emailSentAt || r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {r.responseNotes && (
                      <p className="text-xs text-gray-600 bg-gray-100 p-2 rounded mb-2 border border-gray-200 italic line-clamp-2" title={r.responseNotes}>
                        "{r.responseNotes}"
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={resendingId === r.id}
                      onClick={() => handleResendReconciliation(r)}
                      className="w-full py-1 px-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCcw size={12} className={resendingId === r.id ? 'animate-spin' : ''} />
                      {resendingId === r.id ? 'Gönderiliyor...' : 'Tekrar Gönder'}
                    </button>
                  </div>
                ))}
              {reconciliations.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  Henüz mutabakat işlemi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* New Reconciliation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Yeni Mutabakat Gönder</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cari Seçimi</label>
                  <select
                    required
                    value={formData.customerId || ''}
                    onChange={(e) => calculateAutoBalance(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Cari Seçiniz</option>
                    {store.customers.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alıcı E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@firma.com (E-posta gönderimi için)"
                    value={formData.customerEmail || ''}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {formData.customerId && !formData.customerEmail && (
                    <p className="text-xs text-amber-600 mt-1">
                      Seçili carinin kayıtlı e-postası yok. Buraya yazarsanız hem mutabakat gönderilir hem de cari kartına kaydedilir.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mutabakat Tarihi</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bakiye (₺)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.balance !== undefined && !Number.isNaN(Number(formData.balance)) ? formData.balance : 0}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormData({
                          ...formData,
                          balance: val,
                          balanceType: val === 0 ? 'Yok' : (formData.balanceType === 'Yok' ? 'Borç' : formData.balanceType)
                        });
                      }}
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bakiye Yönü</label>
                    <select
                      value={formData.balanceType}
                      onChange={(e) => setFormData({...formData, balanceType: e.target.value as any})}
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Borç">Borçlu</option>
                      <option value="Alacak">Alacaklı</option>
                      <option value="Yok">Bakiye Yok</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Açıklama / Not (Opsiyonel)</label>
                    {supported && (
                      <button
                        type="button"
                        onClick={() => startListening('singleNote', (text) => setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes} ${text}` : text })))}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                          isListening && activeSpeechField === 'singleNote' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening && activeSpeechField === 'singleNote' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                      >
                        {isListening && activeSpeechField === 'singleNote' ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Müşteriye iletilecek not..."
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <input
                    type="checkbox"
                    id="sendSmsSingle"
                    checked={formData.sendSms || false}
                    onChange={(e) => setFormData({...formData, sendSms: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="sendSmsSingle" className="text-sm font-medium cursor-pointer">
                    Aynı zamanda SMS olarak da gönder (Sadece telefonu kayıtlı olanlara)
                  </label>
                </div>
                
                <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-800">
                    <strong>Bilgi:</strong> Mutabakat kaydedildiğinde, cariye online onay/red bağlantısını içeren bildirim gönderilecektir.
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  <Mail size={16} /> {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Reconciliation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-indigo-600" size={24} />
                Toplu Mutabakat Gönder
              </h2>
              <button disabled={isSendingBulk} onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleBulkSend} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800">
                  <p><strong>{store.customers.length}</strong> adet aktif cariye otomatik bakiye hesaplanarak mutabakat gönderilecektir.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mutabakat Tarihi</label>
                  <input
                    type="date"
                    required
                    disabled={isSendingBulk}
                    value={bulkFormData.date || ''}
                    onChange={(e) => setBulkFormData({...bulkFormData, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Toplu Açıklama / Not (Opsiyonel)</label>
                    {supported && (
                      <button
                        type="button"
                        onClick={() => startListening('bulkNote', (text) => setBulkFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes} ${text}` : text })))}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                          isListening && activeSpeechField === 'bulkNote' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening && activeSpeechField === 'bulkNote' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                      >
                        {isListening && activeSpeechField === 'bulkNote' ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    disabled={isSendingBulk}
                    value={bulkFormData.notes || ''}
                    onChange={(e) => setBulkFormData({...bulkFormData, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Müşterilere iletilecek genel not..."
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <input
                    type="checkbox"
                    id="sendSmsBulk"
                    disabled={isSendingBulk}
                    checked={bulkFormData.sendSms || false}
                    onChange={(e) => setBulkFormData({...bulkFormData, sendSms: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="sendSmsBulk" className="text-sm font-medium cursor-pointer">
                    Aynı zamanda SMS olarak da gönder (Sadece telefonu kayıtlı olanlara)
                  </label>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  disabled={isSendingBulk}
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSendingBulk || store.customers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Mail size={16} /> 
                  {isSendingBulk ? 'Gönderiliyor...' : 'Tümüne Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seçili Mutabakatları Toplu PDF İndirme / Yazdırma için Gizli veya Önizleme A4 Şablonu */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          id="mutabakat-bulk-pdf-container"
          className="w-[794px] bg-white text-gray-900 p-8 font-sans"
        >
          <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900 uppercase">
                {store.settings?.companyName || 'ESİLA FİNANS ERP'}
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Cari Hesap Mutabakat Geçmişi ve Mutabakat Formları Raporu
              </p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div className="font-semibold text-gray-800">
                Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}
              </div>
              <div>Seçili Kayıt Sayısı: {selectedHistoryItems.length} Adet</div>
            </div>
          </div>

          {/* Özet Tablo */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase mb-2">
              1. Seçili Mutabakatlar Özet Listesi
            </h2>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-800">
                  <th className="border border-gray-300 py-2 px-2 text-left">Gönderim Tarihi</th>
                  <th className="border border-gray-300 py-2 px-2 text-left">Cari Adı</th>
                  <th className="border border-gray-300 py-2 px-2 text-left">Mutabakat Tarihi</th>
                  <th className="border border-gray-300 py-2 px-2 text-right">Bakiye Tutarı</th>
                  <th className="border border-gray-300 py-2 px-2 text-center">Bakiye Tipi</th>
                  <th className="border border-gray-300 py-2 px-2 text-center">Durum</th>
                  <th className="border border-gray-300 py-2 px-2 text-left">Yanıt / Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {selectedHistoryItems.map((r) => {
                  const safeBalance = Number(r.balance) || 0;
                  return (
                    <tr key={`pdf-row-${r.id}`}>
                      <td className="border border-gray-300 py-1.5 px-2">
                        {r.emailSentAt
                          ? new Date(r.emailSentAt).toLocaleDateString('tr-TR')
                          : r.date
                          ? new Date(r.date).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2 font-semibold">
                        {r.customerName}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2">
                        {r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold">
                        {safeBalance.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center">
                        {r.balanceType}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold">
                        {r.status}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2">
                        {r.respondedAt
                          ? `${new Date(r.respondedAt).toLocaleDateString('tr-TR')}${
                              r.responseNotes ? ` - ${r.responseNotes}` : ''
                            }`
                          : 'Bekliyor'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Her Seçili Mutabakat İçin Detaylı Resmi Mutabakat Belgesi */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase">
              2. Cari Hesap Mutabakat Mektubu Detayları
            </h2>
            {selectedHistoryItems.map((r, idx) => {
              const customer = store.customers.find(c => c.id === r.customerId);
              const safeBalance = Number(r.balance) || 0;
              return (
                <div
                  key={`pdf-card-${r.id}`}
                  className="border border-gray-300 rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                    <div className="font-bold text-sm text-gray-900">
                      #{idx + 1} - CARİ HESAP MUTABAKAT BELGESİ ({r.customerName})
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded border border-gray-300">
                      Durum: {r.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-700 mb-3">
                    <div>
                      <div>
                        <span className="font-semibold">Cari Ünvanı:</span> {r.customerName}
                      </div>
                      {customer?.taxNumber && (
                        <div>
                          <span className="font-semibold">VKN / TCKN:</span> {customer.taxNumber}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Alıcı E-Posta:</span>{' '}
                        {customer?.email || (r as any).customerEmail || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div>
                        <span className="font-semibold">Mutabakat Tarihi:</span>{' '}
                        {r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'}
                      </div>
                      <div>
                        <span className="font-semibold">Gönderim Zamanı:</span>{' '}
                        {r.emailSentAt
                          ? new Date(r.emailSentAt).toLocaleString('tr-TR')
                          : '-'}
                      </div>
                      {r.respondedAt && (
                        <div>
                          <span className="font-semibold">Yanıt Zamanı:</span>{' '}
                          {new Date(r.respondedAt).toLocaleString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                    Sayın <strong>{r.customerName}</strong>, şirketimiz nezdindeki cari hesabınız{' '}
                    <strong>
                      {r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'}
                    </strong>{' '}
                    tarihi itibarıyla{' '}
                    <strong>
                      {safeBalance.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                      })}{' '}
                      ({r.balanceType})
                    </strong>{' '}
                    bakiye vermektedir.
                    {r.notes ? ` Not: ${r.notes}` : ''}
                    {r.responseNotes ? ` | Cari Yanıt Notu: "${r.responseNotes}"` : ''}
                  </p>
                  <div className="grid grid-cols-2 gap-6 mt-4 pt-2 text-xs text-gray-600">
                    <div>
                      <div className="font-semibold text-gray-800">
                        Gönderen Firma Kaşe / İmza
                      </div>
                      <div className="mt-1">{store.settings?.companyName || 'Firma Yetkilisi'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        Onaylayan Cari Kaşe / İmza / Durum
                      </div>
                      <div className="mt-1">
                        {r.status} {r.respondedAt ? `(${new Date(r.respondedAt).toLocaleString('tr-TR')})` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toplu Yazdır / PDF Önizleme Modalı */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-gray-800">
                    Seçili Mutabakatlar Toplu Yazdırma & PDF Önizleme ({selectedHistoryItems.length} Kayıt)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Seçtiğiniz mutabakatları tek seferde PDF olarak indirebilir veya yazdırabilirsiniz.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={handleBulkDownloadPDF}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download size={15} />
                  <span>{isDownloadingPdf ? 'İndiriliyor...' : 'PDF Olarak İndir'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Yazdır</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
              <div className="max-w-[794px] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 sm:p-8 text-gray-900">
                <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 uppercase">
                      {store.settings?.companyName || 'ESİLA FİNANS ERP'}
                    </h1>
                    <p className="text-xs text-gray-600 mt-1">
                      Cari Hesap Mutabakat Geçmişi ve Mutabakat Formları Raporu
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div className="font-semibold text-gray-800">
                      Tarih: {new Date().toLocaleDateString('tr-TR')}
                    </div>
                    <div>Seçili Kayıt: {selectedHistoryItems.length} Adet</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedHistoryItems.map((r, idx) => {
                    const customer = store.customers.find(c => c.id === r.customerId);
                    const safeBalance = Number(r.balance) || 0;
                    return (
                      <div
                        key={`preview-card-${r.id}`}
                        className="border border-gray-300 rounded-lg p-4 bg-white"
                      >
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                          <div className="font-bold text-sm text-gray-900">
                            #{idx + 1} - {r.customerName}
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              r.status === ReconciliationStatus.APPROVED
                                ? 'bg-emerald-100 text-emerald-700'
                                : r.status === ReconciliationStatus.REJECTED
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 mb-3">
                          <div>
                            <div>
                              <span className="font-semibold">Mutabakat Dönemi:</span>{' '}
                              {r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Alıcı E-Posta:</span>{' '}
                              {customer?.email || (r as any).customerEmail || '-'}
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <div>
                              <span className="font-semibold">Bakiye Tutarı:</span>{' '}
                              <strong className="text-gray-900">
                                {safeBalance.toLocaleString('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY'
                                })}{' '}
                                ({r.balanceType})
                              </strong>
                            </div>
                            <div>
                              <span className="font-semibold">Yanıt Durumu:</span>{' '}
                              {r.respondedAt
                                ? new Date(r.respondedAt).toLocaleString('tr-TR')
                                : 'Yanıt Bekleniyor'}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200">
                          Sayın <strong>{r.customerName}</strong>,{' '}
                          {r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-'} tarihi
                          itibarıyla cari hesabınız{' '}
                          <strong>
                            {safeBalance.toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            })}{' '}
                            ({r.balanceType})
                          </strong>{' '}
                          bakiye vermektedir.
                          {r.responseNotes ? ` | Yanıt Notu: "${r.responseNotes}"` : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
};
