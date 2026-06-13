import React, { useState, useEffect } from "react";
import { ThermalEArsiv } from "./ThermalEArsiv";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  FileText,
  FileJson,
  Download,
  Send,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Printer,
  Eye,
  X,
  Edit,
  Trash2,
  Upload,
  Check,
} from "lucide-react";
import { XMLParser } from "fast-xml-parser";
import { useAppStore } from "../lib/store";
import { api } from "../lib/api";
import { InvoiceTemplateEditor } from "../components/InvoiceTemplateEditor";
import { Pagination } from "../components/Pagination";
import { hasPermission } from '../lib/permissions';

export const EFatura: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'efatura', 'view');
  const canCreate = hasPermission(currentUser, 'efatura', 'create');
  const canDelete = hasPermission(currentUser, 'efatura', 'delete');

  const [activeTab, setActiveTab] = useState<"Taslak" | "Giden" | "Gelen" | "Şablon">(
    "Taslak",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [printType, setPrintType] = useState<'A4' | '80mm' | 'XML'>('A4');

  const invoices = store.eInvoices || [];

  const [isQuerying, setIsQuerying] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Giden" && !hasQueried) {
      setHasQueried(true);
      const needsQuery = invoices.filter((inv) => ['Gönderildi', 'Bekliyor'].includes(inv.status));
      if (needsQuery.length > 0) {
        handleQueryStatus(true);
      }
    }
  }, [activeTab, invoices, hasQueried]);

  const handleQueryStatus = (silent = false) => {
    const needsQuery = invoices.filter((inv) => ['Gönderildi', 'Bekliyor'].includes(inv.status));
    if (needsQuery.length === 0) {
      if (!silent) alert("Sorgulanacak faturanız bulunmamaktadır.");
      return;
    }
    setIsQuerying(true);
    setTimeout(() => {
      const updated = invoices.map((inv) => {
        if (['Gönderildi', 'Bekliyor'].includes(inv.status)) {
            // Rastgele yeni bir durum belirle
            const random = Math.random();
            let newStatus = 'Bekliyor';
            if (random > 0.6) newStatus = 'Onaylandı';
            else if (random > 0.9) newStatus = 'Reddedildi';
            return { ...inv, status: newStatus as any };
        }
        return inv;
      });
      if (store.setEInvoices) store.setEInvoices(updated);
      setIsQuerying(false);
      if (!silent) alert(`${needsQuery.length} adet faturanın son durumu GİB'den güncellendi.`);
    }, 1500);
  };


  const handleDeleteInvoice = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if it's Gelen Fatura and processed
    const isIncomingProcessed = inv.type === 'Gelen Fatura' && inv.isProcessed;
    const confirmMessage = isIncomingProcessed 
        ? "Bu gelen fatura daha önce işlenmiş. Silerseniz cari hareketlerden, ajanda hatırlatmasından ve stoklardan işlemin GERİ ALINMASINA neden olacaktır. Silmek istediğinize emin misiniz?"
        : "Faturayı silmek istediğinize emin misiniz?";

    if (window.confirm(confirmMessage)) {
      if (isIncomingProcessed) {
        // Find existing transaction to get customerId
        const transactionToRemove = store.transactions?.find(t => t.description?.includes(`(${inv.id})`));
        const amountToRevert = Number(inv.total) || Number(inv.amount) || 0;
        
        // Revert transactions and balance logic for customer accounts
        if (store.transactions && store.setTransactions) {
           store.setTransactions(store.transactions.filter(t => !t.description?.includes(`(${inv.id})`)));
           
           if (transactionToRemove && store.customers && store.setCustomers) {
              store.setCustomers(store.customers.map(c => 
                 c.id === transactionToRemove.customerId ? { ...c, balance: (c.balance || 0) - amountToRevert } : c
              ));
           }
        }
        
        // Revert reminders
        if (store.reminderNotes && store.setReminderNotes) {
           store.setReminderNotes(store.reminderNotes.filter(r => r.relatedId !== inv.id));
        }
        
        // Revert stocks
        if (store.products && store.setProducts && inv.items?.length > 0) {
           let currentProducts = [...store.products];
           inv.items.forEach((item: any) => {
               const existingProductIndex = currentProducts.findIndex(p => 
                  (item.productId && p.id === item.productId) || 
                  (!item.productId && p.name === item.productName)
               );
               if (existingProductIndex >= 0) {
                   currentProducts[existingProductIndex] = {
                       ...currentProducts[existingProductIndex],
                       stock: Math.max(0, currentProducts[existingProductIndex].stock - (item.quantity || 1))
                   };
               }
           });
           store.setProducts(currentProducts);
        }
      }

      if (store.setEInvoices) {
        store.setEInvoices(store.eInvoices.filter((i) => String(i.id) !== String(inv.id)));
      }
    }
  };

  const handleEditInvoiceSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;
    if (store.setEInvoices) {
      store.setEInvoices(
        store.eInvoices.map((inv) => (inv.id === editInvoice.id ? editInvoice : inv))
      );
    }
    setEditInvoice(null);
  };

  const [pendingIncomingInvoices, setPendingIncomingInvoices] = useState<any[]>([]);
  const [incomingFilter, setIncomingFilter] = useState<'Tümü' | 'İşlendi' | 'İşlenmedi'>('Tümü');

  const filtered = invoices.filter((inv) => {
    if (activeTab === "Taslak") return inv.status === "Taslak" && inv.type !== "Gelen Fatura";
    if (activeTab === "Giden") return inv.status !== "Taslak" && inv.type !== "Gelen Fatura";
    if (activeTab === "Gelen") {
       if (inv.type !== "Gelen Fatura") return false;
       if (incomingFilter === 'İşlendi') return !!inv.isProcessed;
       if (incomingFilter === 'İşlenmedi') return !inv.isProcessed;
       return true;
    }
    return true;
  });

  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const parsedInvoices: any[] = [];

    for (const file of files) {
      try {
        const xmlText = await file.text();
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
        const jsonObj = parser.parse(xmlText);
        
        let invoiceData = null;
        const rootKey = Object.keys(jsonObj).find(k => k.includes('Invoice'));
        if (rootKey) {
            invoiceData = jsonObj[rootKey];
        } else if (jsonObj.Invoice) {
            invoiceData = jsonObj.Invoice;
        }

        if (!invoiceData) {
            continue;
        }

        const getVal = (obj: any) => obj?.['#text'] || obj || '';
        
        const invId = getVal(invoiceData['cbc:ID']) || `GELEN-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        const issueDate = getVal(invoiceData['cbc:IssueDate']) || new Date().toISOString().split('T')[0];
        
        let dueDate = getVal(invoiceData['cbc:DueDate']);
        if (!dueDate) {
            const paymentMeans = invoiceData['cac:PaymentMeans'];
            if (paymentMeans && paymentMeans['cbc:PaymentDueDate']) {
                dueDate = getVal(paymentMeans['cbc:PaymentDueDate']);
            }
        }
        
        const uuid = getVal(invoiceData['cbc:UUID']) || '';

        const orderId = getVal(invoiceData['cac:OrderReference']?.['cbc:ID']) || '';
        const note = getVal(invoiceData['cbc:Note']) || '';
        const currency = getVal(invoiceData['cbc:DocumentCurrencyCode']) || 'TRY';
        
        const supplierNode = invoiceData['cac:AccountingSupplierParty']?.['cac:Party'];
        
        let supplierName = '';
        if (supplierNode?.['cac:PartyName']?.['cbc:Name']) {
            supplierName = getVal(supplierNode['cac:PartyName']['cbc:Name']);
        } 
        if (!supplierName && supplierNode?.['cac:PartyLegalEntity']?.['cbc:RegistrationName']) {
            supplierName = getVal(supplierNode['cac:PartyLegalEntity']['cbc:RegistrationName']);
        }
        if (!supplierName && supplierNode?.['cac:Person']) {
            const firstName = getVal(supplierNode['cac:Person']?.['cbc:FirstName']) || '';
            const familyName = getVal(supplierNode['cac:Person']?.['cbc:FamilyName']) || '';
            supplierName = `${firstName} ${familyName}`.trim();
        }
        if (!supplierName) {
            supplierName = 'Bilinmeyen Satıcı';
        }

        let supplierTaxNumber = '';
        const partyIdentifications = Array.isArray(supplierNode?.['cac:PartyIdentification']) 
            ? supplierNode?.['cac:PartyIdentification'] 
            : (supplierNode?.['cac:PartyIdentification'] ? [supplierNode?.['cac:PartyIdentification']] : []);
            
        for (const pid of partyIdentifications) {
            const idVal = getVal(pid?.['cbc:ID']);
            if (idVal && (idVal.length === 10 || idVal.length === 11)) {
                 supplierTaxNumber = idVal;
                 break;
            }
        }
        
        if (!supplierTaxNumber) {
            const partyTaxSchemes = Array.isArray(supplierNode?.['cac:PartyTaxScheme'])
                ? supplierNode?.['cac:PartyTaxScheme']
                : (supplierNode?.['cac:PartyTaxScheme'] ? [supplierNode?.['cac:PartyTaxScheme']] : []);
                
            for (const pts of partyTaxSchemes) {
                const cmpId = getVal(pts?.['cbc:CompanyID']);
                if (cmpId) {
                    supplierTaxNumber = cmpId;
                    break;
                }
            }
        }
        
        let supplierTaxOffice = '';
        const taxSchemesInfo = Array.isArray(supplierNode?.['cac:PartyTaxScheme']) 
            ? supplierNode?.['cac:PartyTaxScheme'] 
            : (supplierNode?.['cac:PartyTaxScheme'] ? [supplierNode?.['cac:PartyTaxScheme']] : []);
        for (const pts of taxSchemesInfo) {
             const tOffice = getVal(pts?.['cac:TaxScheme']?.['cbc:Name']);
             if (tOffice) {
                 supplierTaxOffice = tOffice;
                 break;
             }
        }
        
        const legalTotalNode = invoiceData['cac:LegalMonetaryTotal'];
        const payableAmount = Number(getVal(legalTotalNode?.['cbc:PayableAmount'])) || 0;
        const taxExclusiveAmount = Number(getVal(legalTotalNode?.['cbc:TaxExclusiveAmount'])) || 0;
        const taxInclusiveAmount = Number(getVal(legalTotalNode?.['cbc:TaxInclusiveAmount'])) || payableAmount;
        
        let taxTotal = 0;
        const taxTotalGlobal = invoiceData['cac:TaxTotal'];
        if (Array.isArray(taxTotalGlobal)) {
             taxTotal = Number(getVal(taxTotalGlobal[0]?.['cbc:TaxAmount'])) || 0;
        } else if (taxTotalGlobal) {
             taxTotal = Number(getVal(taxTotalGlobal['cbc:TaxAmount'])) || 0;
        }
        if (!taxTotal && taxInclusiveAmount && taxExclusiveAmount) {
             taxTotal = taxInclusiveAmount - taxExclusiveAmount;
        }
        
        let parsedItems: any[] = [];
        const invoiceLinesRaw = invoiceData['cac:InvoiceLine'];
        const invoiceLines = Array.isArray(invoiceLinesRaw) ? invoiceLinesRaw : (invoiceLinesRaw ? [invoiceLinesRaw] : []);
        
        parsedItems = invoiceLines.map((line: any) => {
            const item = line['cac:Item'];
            const name = getVal(item?.['cbc:Name']);
            const sellersItemIdentification = getVal(item?.['cac:SellersItemIdentification']?.['cbc:ID']);
            const buyersItemIdentification = getVal(item?.['cac:BuyersItemIdentification']?.['cbc:ID']);
            const standardItemIdentification = getVal(item?.['cac:StandardItemIdentification']?.['cbc:ID']);
            
            const unitObj = line['cbc:InvoicedQuantity'];
            const qty = Number(getVal(unitObj)) || 1;
            const unitCode = unitObj?.['@_unitCode'];
            let unit = unitCode || 'Adet';
            if (unit === 'C62' || unit === 'c62' || unit === 'NIU') unit = 'Adet';

            const priceNodeAmount = getVal(line['cac:Price']?.['cbc:PriceAmount']);
            // Fallback to line extension amount / qty if price is 0 or missing
            let itemPrice = Number(priceNodeAmount);
            if (!itemPrice && qty > 0) {
               const lineExtAmt = Number(getVal(line['cbc:LineExtensionAmount']));
               if (lineExtAmt) {
                  itemPrice = lineExtAmt / qty;
               }
            }
            
            let taxRate = 0;
            const lineTaxTotalNode = line['cac:TaxTotal'];
            const taxSubtotalArray = Array.isArray(lineTaxTotalNode?.['cac:TaxSubtotal']) 
                ? lineTaxTotalNode['cac:TaxSubtotal'] 
                : (lineTaxTotalNode?.['cac:TaxSubtotal'] ? [lineTaxTotalNode['cac:TaxSubtotal']] : []);
                
            for (const sub of taxSubtotalArray) {
               const percent = Number(getVal(sub['cac:TaxCategory']?.['cbc:Percent']));
               if (!isNaN(percent) && percent > 0) {
                  taxRate = percent;
                  break;
               }
            }
            
            let matchedProductId = undefined;
            
            if (store.products) {
              const matchedProduct = store.products.find(p => 
                (sellersItemIdentification && (p.code === sellersItemIdentification || p.barcode === sellersItemIdentification)) ||
                (buyersItemIdentification && (p.code === buyersItemIdentification || p.barcode === buyersItemIdentification)) ||
                (standardItemIdentification && (p.code === standardItemIdentification || p.barcode === standardItemIdentification)) ||
                (name && p.name.toLowerCase() === name.toLowerCase())
              );
              
              if (matchedProduct) {
                 matchedProductId = matchedProduct.id;
              }
            }

            return {
               productId: matchedProductId,
               productName: name || 'Bilinmeyen Ürün',
               quantity: qty,
               unit: unit,
               price: itemPrice * (1 + (taxRate / 100)), // store tax-inclusive price as item setting default
               taxRate: taxRate,
            };
        });

        const newIncoming: any = {
            id: invId,
            uuid: uuid,
            orderId: orderId,
            note: note,
            currency: currency,
            customerName: supplierName,
            supplierTaxNumber: supplierTaxNumber,
            supplierTaxOffice: supplierTaxOffice,
            amount: payableAmount || taxInclusiveAmount,
            type: 'Gelen Fatura',
            scenario: getVal(invoiceData['cbc:ProfileID']) || 'TEMELFATURA',
            invoiceType: getVal(invoiceData['cbc:InvoiceTypeCode']) || 'SATIS',
            date: issueDate,
            dueDate: dueDate,
            status: 'Onaylandı',
            xmlContent: xmlText,
            items: parsedItems,
            subTotal: taxExclusiveAmount,
            taxTotal: taxTotal,
            total: payableAmount || taxInclusiveAmount
        };
        parsedInvoices.push(newIncoming);
      } catch (err) {
        console.error(err);
      }
    }

    if (parsedInvoices.length > 0) {
      setPendingIncomingInvoices(parsedInvoices);
    } else {
      alert('Geçerli bir e-Fatura formatında XML dosyası bulunamadı.');
    }
    e.target.value = '';
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = itemsPerPage === -1 ? filtered : filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleSendToPortal = (invId: string) => {
    const updated = invoices.map((i) =>
      i.id === invId ? { ...i, status: "Gönderildi" } : i,
    );
    if (store.setEInvoices) store.setEInvoices(updated);
    alert("Fatura başarıyla e-Dönüşüm portalına iletildi.");
  };

  const handleBulkSend = () => {
    if (selectedIds.length === 0) return;
    const updated = invoices.map((i) =>
      selectedIds.includes(i.id) && i.status === "Taslak"
        ? { ...i, status: "Gönderildi" }
        : i,
    );
    if (store.setEInvoices) store.setEInvoices(updated);
    alert(`${selectedIds.length} adet fatura başarıyla portala iletildi.`);
    setSelectedIds([]);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    alert(`${selectedIds.length} adet faturanın PDF çıktıları hazırlanıyor...`);
    // Simulated PDF print delay
    setTimeout(() => {
      window.print();
    }, 500);
  };
  
  const handleProcessIncomingInvoice = async () => {
    if (!previewInvoice || previewInvoice.type !== 'Gelen Fatura' || previewInvoice.isProcessed) return;

    const confirmed = window.confirm(`${previewInvoice.customerName} faturasını işlemek istediğinize emin misiniz? (Cari hareketlere ve stoklara kayıt edilecektir.)`);
    if (!confirmed) return;

    let gelenFaturaWarehouseId = '';
    try {
        const warehouses = await api.getWarehouses();
        let targetWarehouse = warehouses.find(w => w.name === 'Gelen Fatura');
        if (!targetWarehouse) {
            targetWarehouse = await api.addWarehouse({ id: `WH-${Date.now()}`, name: 'Gelen Fatura' });
        }
        if (targetWarehouse) {
            gelenFaturaWarehouseId = targetWarehouse.name;
        }
    } catch (err) {
        console.error("Warehouse fetch/create error:", err);
    }

    let customerId = '';
    
    const existingCustomer = store.customers?.find(c => 
      (previewInvoice.supplierTaxNumber && c.taxNumber === previewInvoice.supplierTaxNumber) ||
      c.name === previewInvoice.customerName || 
      c.companyName === previewInvoice.customerName
    );

    let updatedCustomerBalanceVal = Number(previewInvoice.total) || Number(previewInvoice.amount);
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
      if (store.setCustomers && store.customers) {
         store.setCustomers(store.customers.map(c => 
            c.id === customerId ? { 
                ...c, 
                balance: (c.balance || 0) - updatedCustomerBalanceVal,
                taxNumber: c.taxNumber || previewInvoice.supplierTaxNumber || '',
                taxOffice: c.taxOffice || previewInvoice.supplierTaxOffice || ''
            } : c
         ));
      }
    } else {
      customerId = `CUS-${Date.now()}`;
      const newCustomer = {
         id: customerId,
         customerType: previewInvoice.supplierTaxNumber?.length === 11 ? 'Şahıs' as const : 'Tüzel' as const,
         name: previewInvoice.customerName,
         companyName: previewInvoice.customerName,
         email: '',
         phone: '',
         taxNumber: previewInvoice.supplierTaxNumber || '',
         taxOffice: previewInvoice.supplierTaxOffice || '',
         balance: -updatedCustomerBalanceVal,
         type: 'Satıcı' as const,
         status: 'Aktif' as const
      };
      if (store.setCustomers) {
         store.setCustomers([...(store.customers || []), newCustomer]);
      }
    }

    const newTransaction = {
       id: `TR-${Date.now()}`,
       customerId: customerId,
       date: previewInvoice.date,
       type: 'Alış' as const, 
       amount: -updatedCustomerBalanceVal,
       description: `Gelen e-Fatura İşlemi (${previewInvoice.id})`
    };
    if (store.setTransactions) {
       store.setTransactions([...(store.transactions || []), newTransaction]);
    }

    // Kasaya Ekleme İşlemi İPTAL EDİLDİ - Gider akışını borç olarak işleyeceğiz. 
    // Ödeme yapıldığında Gider olarak işlenmesi sağlanacak.


    let currentProducts = [...(store.products || [])];
    if ((previewInvoice as any).items?.length > 0) {
       (previewInvoice as any).items.forEach((item: any) => {
          const existingProductIndex = currentProducts.findIndex(p => 
            (item.productId && p.id === item.productId) || 
            (!item.productId && p.name && item.productName && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase())
          );
          if (existingProductIndex >= 0) {
             let p = currentProducts[existingProductIndex];
             let whStocks = p.warehouseStocks ? [...p.warehouseStocks] : [];
             if (gelenFaturaWarehouseId) {
                const whIndex = whStocks.findIndex(ws => ws.warehouseId === gelenFaturaWarehouseId);
                if (whIndex >= 0) {
                   whStocks[whIndex] = { ...whStocks[whIndex], stock: whStocks[whIndex].stock + (item.quantity || 1) };
                } else {
                   whStocks.push({ warehouseId: gelenFaturaWarehouseId, stock: (item.quantity || 1) });
                }
             }

             currentProducts[existingProductIndex] = {
                 ...p,
                 stock: p.stock + (item.quantity || 1),
                 purchasePrice: item.price,
                 warehouseStocks: whStocks
             };
          } else {
             const whStocks = gelenFaturaWarehouseId ? [{ warehouseId: gelenFaturaWarehouseId, stock: (item.quantity || 1) }] : [];
             const newProduct = {
               id: `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
               code: `PRD-${Date.now().toString().slice(-6)}`,
               name: item.productName,
               price: item.price * 1.5,
               purchasePrice: item.price,
               stock: (item.quantity || 1),
               category: 'Gelen Fatura',
               warehouse: 'Gelen Fatura',
               warehouseStocks: whStocks,
               taxRate: item.taxRate || 20
             };
             currentProducts.push(newProduct);
          }
       });
       if (store.setProducts) store.setProducts(currentProducts);
    }
    
    const updated = invoices.map((i: any) => i.id === previewInvoice.id ? { ...i, isProcessed: true } : i);
    if (store.setEInvoices) store.setEInvoices(updated);
    
    // Add reminder note for payment tracking
    let paymentDueDate = previewInvoice.dueDate;
    if (!paymentDueDate || paymentDueDate === previewInvoice.date) {
        const d = new Date(previewInvoice.date || new Date());
        d.setDate(d.getDate() + 7);
        paymentDueDate = d.toISOString().split('T')[0];
    }
    
    if (paymentDueDate) {
       // Optional: Add some warning days before due date, e.g. due date itself
       const newReminder = {
           id: `NOTE-${Date.now()}`,
           title: `Fatura Ödemesi: ${previewInvoice.customerName || previewInvoice.supplierTaxNumber}`,
           description: `İşlenen Gelen Fatura (No: ${previewInvoice.id}) için ödeme hatırlatması. Vade Tarihi: ${new Date(paymentDueDate).toLocaleDateString('tr-TR')}`,
           date: paymentDueDate,
           notificationTime: '09:00',
           type: 'Ödeme' as any,
           amount: Number(previewInvoice.total) || Number(previewInvoice.amount),
           isCompleted: false,
           relatedId: previewInvoice.id
       };
       if (store.setReminderNotes) {
           store.setReminderNotes([...(store.reminderNotes || []), newReminder]);
       }
    }
    
    setPreviewInvoice({...previewInvoice, isProcessed: true});
    alert('Fatura başarıyla işlendi. Cari hareket, stoklar ve ajanda güncellendi.');
  };

  const handleDownloadModalPDF = async () => {
    if (!previewInvoice) return;
    const element = document.getElementById(printType === 'A4' ? 'invoice-preview' : 'invoice-preview-80mm');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      let pdf;
      if (printType === 'A4') {
        pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      } else {
        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      pdf.save(`Fatura_${previewInvoice.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF oluşturulurken bir hata oluştu');
    }
  };

  const handleBulkJSONDownload = () => {
    if (selectedIds.length === 0) return;
    const selectedInvoices = invoices.filter((i) => selectedIds.includes(i.id));

    const gibJson = selectedInvoices.map((inv) => {
        const order = store.orders?.find((o) => o.id === inv.orderId);
        const customer = store.customers?.find((c) => c.name === inv.customerName || c.id === order?.customerId);
        
        return {
            "GIB_UBL_TR": {
                "Invoice": {
                    "ID": inv.id,
                    "IssueDate": new Date(inv.date).toISOString().split('T')[0],
                    "InvoiceTypeCode": inv.invoiceType || "SATIS",
                    "ProfileID": inv.scenario,
                    "DocumentCurrencyCode": order?.currency || "TRY",
                    ...(order?.currency && order.currency !== 'TRY' ? {
                        "PricingExchangeRate": {
                            "SourceCurrencyCode": order.currency,
                            "TargetCurrencyCode": "TRY",
                            "CalculationRate": order.exchangeRate || 1
                        }
                    } : {}),
                    "AccountingSupplierParty": {
                        "Party": {
                            "PartyName": { "Name": store.settings.companyName || "Şirket Adı" },
                            "PartyTaxScheme": { "TaxScheme": { "Name": "VD" }, "CompanyID": store.settings.taxNumber || "1111111111" }
                        }
                    },
                    "AccountingCustomerParty": {
                        "Party": {
                            "PartyName": { "Name": inv.customerName },
                            "PartyTaxScheme": { "TaxScheme": { "Name": customer?.taxOffice || "Müşteri VD" }, "CompanyID": customer?.taxNumber || "2222222222" }
                        }
                    },
                    "LegalMonetaryTotal": {
                        "LineExtensionAmount": ((inv as any).subTotal || inv.amount).toFixed(2),
                        "TaxExclusiveAmount": ((inv as any).subTotal || inv.amount).toFixed(2),
                        "TaxInclusiveAmount": ((inv as any).total || inv.amount).toFixed(2),
                        "PayableAmount": ((inv as any).total || inv.amount).toFixed(2)
                    },
                    "TaxTotal": {
                        "TaxAmount": ((inv as any).taxTotal || 0).toFixed(2),
                        "TaxSubtotal": {
                            "TaxableAmount": ((inv as any).subTotal || inv.amount).toFixed(2),
                            "TaxAmount": ((inv as any).taxTotal || 0).toFixed(2),
                            "TaxCategory": {
                                "TaxScheme": {
                                    "Name": "KDV",
                                    "TaxTypeCode": "0015"
                                },
                                ...((inv as any).exceptionCode ? {
                                    "TaxExemptionReasonCode": (inv as any).exceptionCode,
                                    "TaxExemptionReason": "Sistem tarafından tanımlanmış istisna"
                                } : {})
                            }
                        }
                    },
                    "InvoiceLine": order?.items.map((item, idx) => ({
                        "ID": (idx + 1).toString(),
                        "InvoicedQuantity": item.quantity,
                        "LineExtensionAmount": item.price * item.quantity,
                        "Item": { "Name": item.productName }
                    })) || []
                }
            }
        };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gibJson, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `gib_efatura_export_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const invoiceOrder = previewInvoice
    ? store.orders?.find((o) => o.id === previewInvoice.orderId)
    : null;
  const invoiceCustomer = previewInvoice
    ? store.customers?.find(
        (c) =>
          (previewInvoice.supplierTaxNumber && c.taxNumber === previewInvoice.supplierTaxNumber) ||
          c.name === previewInvoice.customerName ||
          c.companyName === previewInvoice.customerName ||
          (invoiceOrder && c.id === invoiceOrder.customerId),
      )
    : null;

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>E-Fatura modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center sm:flex-row flex-col">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            E-Fatura & E-Arşiv
          </h2>
          <p className="text-gray-500 text-sm">
            Düzenlenen ve taslak aşamasındaki e-Fatura/e-Arşiv belgelerinizi
            yönetin
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab("Taslak")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Taslak" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Taslaklar
          </button>
          <button
            onClick={() => setActiveTab("Giden")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Giden" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Giden Kutusu
          </button>
          <button
            onClick={() => setActiveTab("Gelen")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Gelen" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Gelen Faturalar
          </button>
          <button
            onClick={() => setActiveTab("Şablon")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Şablon" ? "bg-white shadow text-blue-600" : "text-gray-600"}`}
          >
            Şablon Düzenleyici
          </button>
        </div>
        {activeTab === "Giden" && (
            <div className="flex ml-4 mt-4 sm:mt-0 items-center justify-end">
              <button
                onClick={() => handleQueryStatus(false)}
                disabled={isQuerying}
                className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <Clock size={16} /> {isQuerying ? 'GİB Sorgulanıyor...' : 'GİB Durum Sorgula'}
              </button>
            </div>
        )}
        {activeTab === "Gelen" && (
             <div className="flex ml-4 mt-4 sm:mt-0 items-center justify-end gap-2">
                <select 
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={incomingFilter}
                  onChange={(e) => setIncomingFilter(e.target.value as any)}
                >
                  <option value="Tümü">Tümü</option>
                  <option value="İşlenmedi">İşlenmeyenler</option>
                  <option value="İşlendi">İşlenenler</option>
                </select>
                <label className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer border border-blue-600">
                  <Upload size={16} /> Toplu XML Yükle
                  <input type="file" accept=".xml" multiple className="hidden" onChange={handleXmlUpload} />
                </label>
             </div>
        )}
      </div>

      {activeTab === "Şablon" ? (
        <InvoiceTemplateEditor />
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 flex-1 overflow-hidden flex flex-col">
          {selectedIds.length > 0 && (
            <div className="bg-blue-50/50 border-b border-blue-100 p-3 flex justify-between items-center px-4 animate-fade-in no-print">
              <div className="text-sm font-medium text-blue-800">
                <span className="font-bold">{selectedIds.length}</span> fatura
                seçildi
              </div>
              <div className="flex gap-2">
                {activeTab === "Taslak" && (
                  <button
                    onClick={handleBulkSend}
                    className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Send size={14} /> Toplu GİB'e Gönder
                  </button>
                )}
                <button
                  onClick={handleBulkPrint}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Printer size={14} /> Toplu PDF İndir
                </button>
                <button
                  onClick={handleBulkJSONDownload}
                  className="px-3 py-1.5 bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                >
                  <FileJson size={14} /> GİB JSON İndir
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      checked={
                        selectedIds.length === filtered.length &&
                        filtered.length > 0
                      }
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? filtered.map((i) => i.id) : [],
                        )
                      }
                    />
                  </th>
                  <th className="p-4 font-medium">Tarih</th>
                  <th className="p-4 font-medium">Belge No / Ref</th>
                  <th className="p-4 font-medium">Müşteri / Satıcı</th>
                  <th className="p-4 font-medium">Senaryo / Tür</th>
                  <th className="p-4 font-medium text-right">Tutar</th>
                  <th className="p-4 font-medium text-center">Durum</th>
                  <th className="p-4 font-medium text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Bu sekmede gösterilecek bir fatura bulunamadı.
                    </td>
                  </tr>
                ) : (
                  paginated.map((inv, idx) => (
                    <tr
                      key={`${inv.id}-${idx}`}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          checked={selectedIds.includes(inv.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, inv.id]
                                : prev.filter((id) => id !== inv.id),
                            )
                          }
                        />
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(inv.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {inv.id}
                        <div className="text-xs font-normal text-gray-500">
                          Sipariş: {inv.orderId}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {inv.customerName}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="font-medium text-gray-700">
                          {inv.type}
                        </span>
                        <div className="text-xs text-gray-500">
                          {inv.scenario} - {inv.invoiceType || 'SATIS'}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-gray-800">
                        {Number(inv.amount || 0).toLocaleString("tr-TR", {
                          style: "currency",
                          currency: store.orders?.find(o => o.id === inv.orderId)?.currency || "TRY",
                        })}
                      </td>
                      <td className="p-4 text-center">
                        {inv.status === "Taslak" && (
                          <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium border border-yellow-200">
                            <Clock size={12} /> Taslak
                          </span>
                        )}
                        {(inv.status === "Gönderildi" || inv.status === "Bekliyor") && (
                          <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium border border-orange-200">
                            <Clock size={12} /> GİB'de Bekliyor
                          </span>
                        )}
                        {inv.status === "Onaylandı" && (
                          <div className="flex flex-col gap-1 items-center">
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-200">
                              <CheckCircle size={12} /> GİB Onaylı
                            </span>
                            {(inv as any).isProcessed && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
                                İşlendi
                              </span>
                            )}
                          </div>
                        )}
                        {inv.status === "Reddedildi" && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium border border-red-200">
                            <X size={12} /> Reddedildi
                          </span>
                        )}
                        {inv.status === "Hatalı" && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium border border-red-200">
                            <X size={12} /> Hatalı
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="px-2 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                            title="Önizleme"
                          >
                            <Eye size={16} />
                          </button>
                          {inv.status === "Taslak" ? (
                            <>
                              {canEdit && (
                                <button
                                  onClick={() => setEditInvoice(inv)}
                                  className="px-2 py-1.5 bg-gray-50 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                                  title="Düzenle"
                                >
                                  <Edit size={16} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={(e) => handleDeleteInvoice(inv, e)}
                                  className="px-2 py-1.5 bg-gray-50 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                                  title="Sil"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleSendToPortal(inv.id)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                              >
                                <Send size={14} /> GİB'e Gönder
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-1 items-center">
                              <button 
                                onClick={() => {
                                  setSelectedIds([inv.id]);
                                  setTimeout(handleBulkJSONDownload, 50);
                                }}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="GİB JSON İndir">
                                <FileJson size={16} />
                              </button>
                              {(inv as any).xmlContent && (
                                <button 
                                  onClick={() => {
                                      const element = document.createElement("a");
                                      const file = new Blob([(inv as any).xmlContent], {type: 'application/xml'});
                                      element.href = URL.createObjectURL(file);
                                      element.download = `${inv.id}.xml`;
                                      document.body.appendChild(element);
                                      element.click();
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Orijinal XML İndir">
                                  <FileText size={16} />
                                </button>
                              )}
                              {canDelete && inv.type === 'Gelen Fatura' && (
                                <button
                                  onClick={(e) => handleDeleteInvoice(inv, e)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded inline-flex items-center gap-1"
                                  title="Sil"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                                <MoreHorizontal size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filtered.length}
          />
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Taslak Fatura Düzenle</h3>
              <button
                onClick={() => setEditInvoice(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditInvoiceSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fatura Tipi / Türü</label>
                <select
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none"
                  value={editInvoice.type}
                  onChange={(e) => setEditInvoice({ ...editInvoice, type: e.target.value })}
                >
                  <option value="e-Fatura">e-Fatura</option>
                  <option value="e-Arşiv Fatura">e-Arşiv Fatura</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senaryo</label>
                <select
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none"
                  value={editInvoice.scenario}
                  onChange={(e) => setEditInvoice({ ...editInvoice, scenario: e.target.value })}
                >
                  <option value="Temel Fatura">Temel Fatura</option>
                  <option value="Ticari Fatura">Ticari Fatura</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İstisna Kodu (Sadece İstisna ise)</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none"
                  value={editInvoice.exceptionCode || ""}
                  onChange={(e) => setEditInvoice({ ...editInvoice, exceptionCode: e.target.value })}
                  placeholder="Örn: 221"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditInvoice(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Önizleme Modalı */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 print:hidden">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  E-Fatura Önizlemesi
                </h3>
                <p className="text-sm text-gray-500">
                  Belge No: {previewInvoice.id}
                </p>
              </div>
              
              {/* Optional: Layout Type Toggle if you want to switch between A4 and 80mm */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPrintType('A4')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${printType === 'A4' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  A4
                </button>
                <button
                  onClick={() => setPrintType('80mm')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${printType === '80mm' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  80mm
                </button>
                {previewInvoice?.xmlContent && (
                  <button
                    onClick={() => setPrintType('XML')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${printType === 'XML' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Orijinal Görünüm
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {previewInvoice.type === 'Gelen Fatura' && !previewInvoice.isProcessed && (
                  <button
                    onClick={handleProcessIncomingInvoice}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    Faturalaştır
                  </button>
                )}
                {previewInvoice.type === 'Gelen Fatura' && previewInvoice.isProcessed && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium flex items-center gap-2">
                    İşlendi
                  </span>
                )}
                <button
                  onClick={handleDownloadModalPDF}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={16} /> PDF İndir
                </button>
                <button
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Printer size={16} /> Yazdır
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {previewInvoice.type === 'Gelen Fatura' && !invoiceCustomer && (
              <div className="mx-4 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between no-print shadow-sm">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-orange-800">Cari Eşleşmesi Bulunamadı</h3>
                  <p className="text-xs text-orange-700"> Sisteminizde VKN/TCKN ({previewInvoice.supplierTaxNumber || 'Belirtilmemiş'}) veya ünvan ({previewInvoice.customerName}) ile eşleşen bir cari kart bulunmuyor. </p>
                </div>
                <button
                  onClick={() => {
                    const newCustomer = {
                       id: `CUS-${Date.now()}`,
                       customerType: previewInvoice.supplierTaxNumber?.length === 11 ? 'Şahıs' as const : 'Tüzel' as const,
                       name: previewInvoice.customerName,
                       companyName: previewInvoice.customerName,
                       email: '',
                       phone: '',
                       taxNumber: previewInvoice.supplierTaxNumber || '',
                       taxOffice: previewInvoice.supplierTaxOffice || ''
                    };
                    if (store.setCustomers) {
                       store.setCustomers([...(store.customers || []), newCustomer]);
                    }
                    alert("Cari kart başarıyla oluşturuldu ve eşleştirildi.");
                  }}
                  className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
                >
                  Hızlı Cari Kart Oluştur
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 print:p-0 print:bg-white flex justify-center">
              {printType === 'XML' && previewInvoice?.xmlContent ? (
                  <iframe 
                      src={URL.createObjectURL(new Blob([previewInvoice.xmlContent], { type: 'application/xml' }))} 
                      className="w-full bg-white border border-gray-200 shadow-sm mx-auto min-h-[297mm] max-w-5xl" 
                      title="XML Preview"
                  />
              ) : printType === 'A4' ? (
                <div
                  className="bg-white p-8 border border-gray-200 shadow-sm mx-auto max-w-[210mm] w-[210mm] min-h-[297mm] text-[11px] font-sans text-black print:border-none print:shadow-none print:m-0 print-target"
                  id="invoice-preview"
                >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  {(
                    store.settings?.invoiceTemplate_layoutOrder || [
                      "info",
                      "gib",
                      "logo",
                    ]
                  ).map((blockKey, idx) => {
                    const alignmentClass =
                      idx === 0
                        ? "items-start text-left"
                        : idx === 1
                          ? "items-center text-center justify-center"
                          : "items-end text-right";

                    if (blockKey === "info") {
                      return (
                        <div
                          key="info"
                          className={`w-[33%] flex flex-col ${alignmentClass}`}
                        >
                          <div
                            className="font-bold mb-1"
                            style={{
                              color:
                                store.settings?.invoiceTemplate_color ||
                                "#059669",
                            }}
                          >
                            {store.settings?.companyName ||
                              "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}
                          </div>
                          <div className="mb-1">
                            {store.settings?.address ||
                              "YENİŞEHİR MAHALLESİ KARDEŞLER CADDE DIŞ KAPI NO: TEKNO KENT ARGE 7 /2 İÇ KAPI NO: B06 MERKEZ / SİVAS"}
                          </div>
                          <div className="mb-1">58100 Sivas Merkez/ Sivas</div>
                          <div className="mb-1">
                            Tel: {store.settings?.phone || "+908506060724"}
                          </div>
                          <div className="mb-1">
                            Web Sitesi: www.esilateknoloji.com.tr
                          </div>
                          <div className="mb-1">
                            E-Posta:{" "}
                            {store.settings?.email || "bilgi@e-esila.com"}
                          </div>
                          <div className="mb-1">
                            Vergi Dairesi: SİTE VERGİ DAİRESİ MÜDÜRLÜĞÜ
                          </div>
                          <div>VKN: 3790894905</div>
                        </div>
                      );
                    }
                    if (blockKey === "gib") {
                      return (
                        <div
                          key="gib"
                          className={`w-[33%] flex flex-col ${alignmentClass} items-center`}
                        >
                          <img 
                            src="/gib-logo.png" 
                            alt="GİB Logo" 
                            className="w-24 object-contain mix-blend-multiply flex-shrink-0" 
                          />
                          <div className="font-bold text-base mt-2 flex justify-center w-full uppercase">
                            {previewInvoice?.scenario === 'TEMELFATURA' || previewInvoice?.scenario === 'TICARIFATURA' ? 'e-Fatura' : 'e-Arşiv Fatura'}
                          </div>
                        </div>
                      );
                    }
                    if (blockKey === "logo") {
                      return (
                        <div
                          key="logo"
                          className={`w-[33%] flex flex-col ${alignmentClass}`}
                        >
                          {store.settings?.invoiceTemplate_showQR !== false && (
                            <div className="mb-2">
                              {(() => {
                                let qrDate = "2026-01-03";
                                try {
                                  qrDate = new Date(previewInvoice.date).toISOString().split('T')[0];
                                } catch(e) {}
                                
                                const subAmount = (previewInvoice as any).subTotal || (invoiceOrder?.subTotal || (previewInvoice.amount / 1.2));
                                const taxAmount = (previewInvoice as any).taxTotal || (invoiceOrder?.taxTotal || (previewInvoice.amount - previewInvoice.amount / 1.2));
                                const totalAmount = (previewInvoice as any).total || (invoiceOrder?.total || previewInvoice.amount);

                                const qrDataObj = {
                                  vkntckn: store.settings?.taxNumber || "3790894905",
                                  avkntckn: invoiceCustomer?.taxNumber || "0100359315",
                                  senaryo: previewInvoice.scenario || "EARSIVFATURA",
                                  tip: previewInvoice.invoiceType || "SATIS",
                                  tarih: qrDate,
                                  no: previewInvoice.id || "ESI2026000002001",
                                  ettn: previewInvoice.id ? `${previewInvoice.id.toLowerCase()}-e-fatura-ettn` : "e9baec5d-f923-4f06-894b-e3de911a16c2",
                                  parabirimi: invoiceOrder?.currency || "TRY",
                                  "malhizmettoplam": subAmount.toFixed(2),
                                  "kdvmatrah(20)": subAmount.toFixed(2),
                                  "hesaplanankdv(20)": taxAmount.toFixed(2),
                                  vergidahil: totalAmount.toFixed(2),
                                  odenecek: totalAmount.toFixed(2)
                                };
                                return <QRCodeSVG value={JSON.stringify(qrDataObj)} size={96} />;
                              })()}
                            </div>
                          )}
                          {store.settings?.invoiceTemplate_showLogo !==
                            false && (
                            <div
                              className={`w-full ${idx === 0 ? "border-t pt-2 mt-2 text-left" : idx === 1 ? "border-t pt-2 mt-2 text-center" : "border-t pt-2 mt-2 text-right"}`}
                              style={{
                                borderColor:
                                  (store.settings?.invoiceTemplate_color ||
                                    "#059669") + "40",
                              }}
                            >
                              {store.settings?.invoiceTemplate_logoUrl ? (
                                <img
                                  src={store.settings?.invoiceTemplate_logoUrl}
                                  alt="Logo"
                                  className={`h-10 mb-1 ${idx === 0 ? "mr-auto" : idx === 1 ? "mx-auto" : "ml-auto"}`}
                                />
                              ) : store.settings?.companyLogo ? (
                                <img
                                  src={store.settings?.companyLogo}
                                  alt="Logo"
                                  className={`h-10 mb-1 ${idx === 0 ? "mr-auto" : idx === 1 ? "mx-auto" : "ml-auto"}`}
                                />
                              ) : (
                                <div
                                  className={`font-serif italic text-2xl font-bold mb-1 ${idx === 0 ? "text-left" : idx === 1 ? "text-center" : "text-right"}`}
                                  style={{
                                    color:
                                      store.settings?.invoiceTemplate_color ||
                                      "#059669",
                                  }}
                                >
                                  esila
                                </div>
                              )}
                              <div
                                className="mb-1"
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                &quot;Ticaretin Bulut Hali&quot;
                              </div>
                              <div
                                className="font-bold"
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                www.esila.tr
                              </div>
                              <div
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                +90 850 606 0724
                              </div>
                              <div
                                className="font-bold text-[9px]"
                                style={{
                                  color:
                                    store.settings?.invoiceTemplate_color ||
                                    "#059669",
                                }}
                              >
                                WhatsApp Destek Hattı : +90 542 66 37452
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                {/* Customer & Invoice Details Row */}
                <div className="flex justify-between items-start mb-2">
                  {/* Customer Info Box */}
                  <div className="w-[48%] border border-black p-2">
                    <div className="font-bold border-b border-black pb-1 mb-1">
                      SAYIN
                    </div>
                    <div className="font-bold mb-2">
                      {previewInvoice.customerName}
                    </div>
                    <div className="mb-1">
                      {invoiceCustomer?.city
                        ? `${invoiceCustomer.district || ""} / ${invoiceCustomer.city}`
                        : "Merkez / Yozgat"}
                    </div>
                    <div className="mb-1">Türkiye</div>
                    <div className="mb-1">
                      Vergi Dairesi:{" "}
                      {invoiceCustomer?.taxOffice ||
                        "YOZGAT VERGİ DAİRESİ MÜD."}
                    </div>
                    <div>
                      TCKN/VKN:{" "}
                      {invoiceCustomer?.taxNumber ||
                        invoiceCustomer?.taxNumber ||
                        "11111111111"}
                    </div>
                  </div>

                  {/* Invoice Details Box */}
                  <div className="w-[48%] border border-black p-0">
                    <table className="w-full text-left">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold w-1/3 border-r border-black">
                            Özelleştirme No:
                          </td>
                          <td className="p-1">TR1.2</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Senaryo:
                          </td>
                          <td className="p-1">
                            {previewInvoice.scenario || "TICARIFATURA"}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Fatura Tipi:
                          </td>
                          <td className="p-1">
                            {previewInvoice.invoiceType || "SATIS"}
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Fatura No:
                          </td>
                          <td className="p-1">{previewInvoice.id}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Fatura Tarihi:
                          </td>
                          <td className="p-1">
                            {new Date(previewInvoice.date).toLocaleDateString(
                              "tr-TR",
                            )}{" "}
                            {new Date(previewInvoice.date).toLocaleTimeString(
                              "tr-TR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </td>
                        </tr>
                        {(previewInvoice.orderId || invoiceOrder?.id) && (
                          <tr className="border-b border-black">
                            <td className="p-1 font-bold border-r border-black">
                              Sipariş No:
                            </td>
                            <td className="p-1">{previewInvoice.orderId || invoiceOrder?.id}</td>
                          </tr>
                        )}
                        {(previewInvoice.proposalId || invoiceOrder?.proposalId) && (
                          <tr>
                            <td className="p-1 font-bold border-r border-black">
                              Teklif No:
                            </td>
                            <td className="p-1">{previewInvoice.proposalId || invoiceOrder?.proposalId}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* ETTN Row */}
                <div className="font-bold mb-2">
                  ETTN:{" "}
                  <span className="font-normal text-gray-700">
                    {previewInvoice.id.toLowerCase()}-e-fatura-ettn
                  </span>
                </div>
                {/* Items Table */}
                <table className="w-full text-left border-collapse border border-black mb-4">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="p-1 border-r border-black w-8">
                        Sıra
                        <br />
                        No
                      </th>
                      <th className="p-1 border-r border-black w-12">
                        Ürün
                        <br />
                        Kodu
                      </th>
                      <th className="p-1 border-r border-black">Mal Hizmet</th>
                      <th className="p-1 border-r border-black text-right w-16">
                        Miktar
                      </th>
                      <th className="p-1 border-r border-black text-right w-24">
                        Birim Fiyat
                      </th>
                      <th className="p-1 border-r border-black text-right w-16">
                        KDV Oranı
                      </th>
                      <th className="p-1 border-r border-black text-right w-20">
                        KDV Tutarı
                      </th>
                      <th className="p-1 border-r border-black text-right w-20">
                        Diğer Vergiler
                      </th>
                      <th className="p-1 text-right w-24">
                        Mal Hizmet
                        <br />
                        Tutarı
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {((previewInvoice as any).items && (previewInvoice as any).items.length > 0) ? (
                      (previewInvoice as any).items.map((item: any, idx: number) => {
                        const taxRate = item.taxRate || 0;
                        const priceWithoutTax = item.price / (1 + taxRate / 100);
                        const taxAmount = item.price - priceWithoutTax;
                        const totalItemWithoutTax = priceWithoutTax * item.quantity;

                        return (
                          <tr
                            key={idx}
                            className="border-b border-black last:border-b-0"
                          >
                            <td className="p-1 border-r border-black text-center">
                              {idx + 1}
                            </td>
                            <td className="p-1 border-r border-black">
                              {store.products?.find(p => p.id === item.productId)?.code || ""}
                            </td>
                            <td className="p-1 border-r border-black">
                              {item.productName}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {item.quantity} {item.unit || "Adet"}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {Number(priceWithoutTax || 0).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}{" "}
                              TL
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              %{taxRate}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {Number((taxAmount * item.quantity) || 0).toLocaleString(
                                "tr-TR",
                                { minimumFractionDigits: 2 },
                              )}{" "}
                              TL
                            </td>
                            <td className="p-1 border-r border-black text-right"></td>
                            <td className="p-1 text-right">
                              {Number(totalItemWithoutTax || 0).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              TL
                            </td>
                          </tr>
                        );
                      })
                    ) : invoiceOrder &&
                    invoiceOrder.items &&
                    invoiceOrder.items.length > 0 ? (
                      invoiceOrder.items.map((item: any, idx: number) => {
                        const taxRate = item.taxRate || 20;
                        const priceWithoutTax =
                          item.price / (1 + taxRate / 100);
                        const taxAmount = item.price - priceWithoutTax;
                        const totalItemWithoutTax =
                          priceWithoutTax * item.quantity;

                        return (
                          <tr
                            key={idx}
                            className="border-b border-black last:border-b-0"
                          >
                            <td className="p-1 border-r border-black text-center">
                              {idx + 1}
                            </td>
                            <td className="p-1 border-r border-black">
                              {store.products?.find(p => p.id === item.productId)?.code || ""}
                            </td>
                            <td className="p-1 border-r border-black">
                              {item.productName}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {item.quantity} {item.unit || "Adet"}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {Number(priceWithoutTax || 0).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}{" "}
                              TL
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              %{taxRate}
                            </td>
                            <td className="p-1 border-r border-black text-right">
                              {Number((taxAmount * item.quantity) || 0).toLocaleString(
                                "tr-TR",
                                { minimumFractionDigits: 2 },
                              )}{" "}
                              TL
                            </td>
                            <td className="p-1 border-r border-black text-right"></td>
                            <td className="p-1 text-right">
                              {Number(totalItemWithoutTax || 0).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              TL
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-b border-black">
                        <td className="p-1 border-r border-black text-center">
                          1
                        </td>
                        <td className="p-1 border-r border-black">1K</td>
                        <td className="p-1 border-r border-black">
                          Muhtelif Ürün / Hizmet Satışı
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          1 Adet
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          {Number((previewInvoice.amount || 0) / 1.2).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 8,
                            },
                          )}{" "}
                          TL
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          %20,00
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          {(
                            (previewInvoice.amount || 0) -
                            (previewInvoice.amount || 0) / 1.2
                          ).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          TL
                        </td>
                        <td className="p-1 border-r border-black text-right"></td>
                        <td className="p-1 text-right">
                          {Number((previewInvoice.amount || 0) / 1.2).toLocaleString(
                            "tr-TR",
                            { minimumFractionDigits: 2 },
                          )}{" "}
                          TL
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Totals Box */}
                <div className="flex justify-end mb-4">
                  <div className="w-[45%]">
                    <table className="w-full text-right border-collapse border border-black">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Mal Hizmet Toplam Tutarı
                          </td>
                          <td className="p-1 w-32 border-l-2 border-black border-l-gray-300">
                            {Number(
                              (previewInvoice as any).subTotal || invoiceOrder?.subTotal ||
                              (previewInvoice.amount || 0) / 1.2 || 0
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Toplam İskonto
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(
                              (invoiceOrder as any)?.discountTotal || 0
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Hesaplanan KDV Toplamı
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {Number(
                              (previewInvoice as any).taxTotal || invoiceOrder?.taxTotal ||
                              (previewInvoice.amount || 0) -
                                (previewInvoice.amount || 0) / 1.2 || 0
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black bg-gray-50">
                          <td className="p-1 font-bold border-r border-black">
                            Vergiler Dahil Toplam Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {Number(
                              (previewInvoice as any).total || invoiceOrder?.total || previewInvoice.amount || 0
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black font-bold">
                          <td className="p-1 border-r border-black">
                            Ödenecek Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {Number(
                              (previewInvoice as any).total || invoiceOrder?.total || previewInvoice.amount || 0
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Notes */}
                <div className="border border-black p-2 mb-4 text-[10px] whitespace-pre-wrap">
                  {store.settings?.invoiceTemplate_notes ? (
                    store.settings.invoiceTemplate_notes
                      .split("\n")
                      .map((line, i) => (
                        <div key={i} className="font-bold">
                          {line ? `Not: ${line}` : ""}
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="font-bold">
                        Not: "Bu fatura, düzenleme tarihinden itibaren 7 gün
                        içerisinde ödenmelidir. Süresinde ödenmeyen tutarlar
                        için 6102 sayılı TTK ve 6098 sayılı TBK kapsamında yasal
                        faiz işletilecektir."
                      </div>
                      <div className="font-bold">
                        Not: 4000 TL HAVALE YAPILMIŞTIR. KALAN BAKİYE 2940TL'DİR
                      </div>
                      <div className="font-bold">Not: Yalnız #--- TL#</div>
                    </>
                  )}
                  {store.settings?.invoiceTemplate_banks &&
                    store.settings.invoiceTemplate_banks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-black border-dashed">
                        <div className="font-bold mb-1 underline mt-1">
                          BANKA HESAP BİLGİLERİMİZ
                        </div>
                        {store.settings.invoiceTemplate_banks.map((b, i) => (
                          <div key={i} className="font-bold">
                            Banka: {b.bankName} | Alıcı: {b.accountName} | IBAN:{" "}
                            {b.iban}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                \n\n {/* Footer */}
                <div className="border border-black p-2 flex font-bold text-[10px]">
                  <div
                    className="w-1/2 border-r border-black pr-2"
                    style={{
                      color: store.settings?.invoiceTemplate_color || "#059669",
                    }}
                  >
                    {store.settings?.companyName ||
                      "ESİLA YAZILIM TEKNOLOJİLERİ LİMİTED ŞİRKETİ"}
                  </div>
                  <div className="w-1/2 pl-2">
                    {store.settings?.invoiceTemplate_notes?.includes("IBAN")
                      ? ""
                      : "IBAN: TR50 0021 0000 0013 4303 2000 01"}
                  </div>
                </div>
              </div>
              ) : (
                <ThermalEArsiv previewInvoice={previewInvoice} invoiceOrder={invoiceOrder} store={store} invoiceCustomer={invoiceCustomer} />
              )}
            </div>
          </div>
        </div>
      )}

      {pendingIncomingInvoices.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Toplu XML Yükleme Onayı</h2>
              <button
                onClick={() => setPendingIncomingInvoices([])}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="p-3">Fatura No</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">VKN/TCKN</th>
                    <th className="p-3">Unvan</th>
                    <th className="p-3">KDV</th>
                    <th className="p-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingIncomingInvoices.map((inv, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 border-gray-100">
                      <td className="p-3 font-medium text-gray-900">{inv.id}</td>
                      <td className="p-3 text-gray-600">{new Date(inv.date).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3 text-gray-600">{inv.supplierTaxNumber}</td>
                      <td className="p-3 text-gray-600">{inv.customerName}</td>
                      <td className="p-3 text-gray-600">{Number(inv.taxTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                      <td className="p-3 text-right font-medium text-emerald-600">
                        {Number(inv.total || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
               <button
                 onClick={() => setPendingIncomingInvoices([])}
                 className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
               >
                 İptal
               </button>
               <button
                 onClick={() => {
                    const updated = [...invoices, ...pendingIncomingInvoices];
                    if (store.setEInvoices) {
                        store.setEInvoices(updated);
                        setPendingIncomingInvoices([]);
                        alert(`${pendingIncomingInvoices.length} adet faturayı başarıyla eklediniz.`);
                    }
                 }}
                 className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
               >
                 <Check size={16} /> Onayla ve Ekle
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
