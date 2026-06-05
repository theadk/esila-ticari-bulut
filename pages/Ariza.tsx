import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Wrench,
  Settings,
  User,
  FileText,
  ChevronRight,
  Printer,
  QrCode,
  Mail,
  Download,
  Send,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Pagination } from "../components/Pagination";
import {
  ServiceTicket,
  ServiceTicketStatus,
  ServiceMaterial,
  Customer,
  Product,
  Personnel,
  CustomerTransaction,
  CashTransaction,
} from "../types";
import { useAppStore } from "../lib/store";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import { defaultTemplates, parseEmailTemplate } from "../lib/emailUtils";

const INITIAL_FORM: Partial<ServiceTicket> = {
  customerId: "",
  deviceType: "",
  serialNumber: "",
  issueDescription: "",
  personnelId: "",
  materialsUsed: [],
  laborFee: 0,
  taxRate: 20,
  maintenancePeriodMonths: undefined,
};

export const Ariza: React.FC = () => {
  const store = useAppStore();
  const serviceTickets = store.serviceTickets;
  const customers = store.customers;
  const products = store.products;
  const personnel = store.personnel;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(
    new Set(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "maintenance" | "checklist"
  >("all");

  const [formData, setFormData] =
    useState<Partial<ServiceTicket>>(INITIAL_FORM);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null,
  );

  // Detail / Edits
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [isPaid, setIsPaid] = useState(true);
  const [maintenancePeriod, setMaintenancePeriod] = useState<number | "">("");

  useEffect(() => {
    // Automatically schedule and send follow-up maintenance notifications
    const dueMaintenance = serviceTickets.filter((ticket) => {
      if (
        ticket.status === "Tamamlandı" &&
        ticket.nextMaintenanceDate &&
        !ticket.maintenanceReminderSent
      ) {
        const nextDate = new Date(ticket.nextMaintenanceDate).getTime();
        const now = Date.now();
        return nextDate <= now; // if due or past due
      }
      return false;
    });

    if (dueMaintenance.length > 0) {
      let updatedTickets = [...serviceTickets];
      let hasUpdates = false;

      const templateRaw =
        store.settings.email_template_maintenance ||
        defaultTemplates.maintenance_reminder;

      Promise.all(
        dueMaintenance.map(async (ticket) => {
          const customer = customers.find(
            (c) => String(c.id) === String(ticket.customerId),
          );
          if (!customer || !customer.email) return;

          const body = parseEmailTemplate(templateRaw, {
            MUSTERI_ADI: customer.companyName || customer.name || "",
            CIHAZ: ticket.deviceType,
            FIRMA_ADI: store.settings.companyName || "",
            FIRMA_TELEFON: store.settings.phone || "",
            FIRMA_MAIL: store.settings.email || "",
            FIRMA_ADRES: store.settings.address || "",
            FIRMA_VERGI_DAIRESI: store.settings.taxOffice || "",
            FIRMA_VKN: store.settings.taxNumber || "",
            TARIH: new Date(
              ticket.dateCompleted || ticket.dateCreated,
            ).toLocaleDateString("tr-TR"),
          });

          try {
            const res = await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: customer.email,
                subject: `Periyodik Bakım Hatırlatması - ${ticket.deviceType}`,
                html: body,
              }),
            });

            if (res.ok) {
              const idx = updatedTickets.findIndex((t) => t.id === ticket.id);
              if (idx > -1) {
                updatedTickets[idx] = {
                  ...updatedTickets[idx],
                  maintenanceReminderSent: true,
                };
                hasUpdates = true;
              }
            }
          } catch (err) {
            console.error(err);
          }
        }),
      ).then(() => {
        if (hasUpdates) {
          store.setServiceTickets(updatedTickets);
          toast.success(
            `${dueMaintenance.length} adet otomatik bakım hatırlatma e-postası gönderildi`,
          );
        }
      });
    }
  }, [serviceTickets, customers, store]);

  const [maintenanceMonthStr, setMaintenanceMonthStr] = useState<string>(""); // e.g., '2023-10'

  const filteredTickets = serviceTickets
    .filter((ticket) => {
      const searchMatch =
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      if (activeTab === "maintenance") {
        if (!ticket.maintenancePeriodMonths) return false;
        if (maintenanceMonthStr && ticket.nextMaintenanceDate) {
          const d = new Date(ticket.nextMaintenanceDate);
          const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (mStr !== maintenanceMonthStr) return false;
        }
        return true;
      }

      return true;
    })
    .sort((a, b) => {
      if (activeTab === "maintenance") {
        if (!a.nextMaintenanceDate) return 1;
        if (!b.nextMaintenanceDate) return -1;
        return (
          new Date(a.nextMaintenanceDate).getTime() -
          new Date(b.nextMaintenanceDate).getTime()
        );
      }
      return (
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      );
    });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = itemsPerPage === -1 ? filteredTickets : filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, maintenanceMonthStr]);

  const toggleTicketSelection = (id: string) => {
    const newSelection = new Set(selectedTicketIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTicketIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (
      selectedTicketIds.size === filteredTickets.length &&
      filteredTickets.length > 0
    ) {
      setSelectedTicketIds(new Set());
    } else {
      setSelectedTicketIds(new Set(filteredTickets.map((t) => t.id)));
    }
  };

  const handleSaveTicket = () => {
    if (
      !formData.customerId ||
      !formData.deviceType ||
      !formData.issueDescription
    )
      return;

    const customer = customers.find(
      (c) => String(c.id) === String(formData.customerId),
    );
    const assignedPersonnel = personnel.find(
      (p) => String(p.id) === String(formData.personnelId),
    );

    if (formData.id) {
      const updatedTickets = serviceTickets.map((t) => {
        if (t.id === formData.id) {
          let nextMaintenanceDate = t.nextMaintenanceDate;
          if (
            formData.maintenancePeriodMonths &&
            formData.maintenancePeriodMonths > 0
          ) {
            const d = t.dateCompleted
              ? new Date(t.dateCompleted)
              : new Date(t.dateCreated);
            d.setMonth(d.getMonth() + formData.maintenancePeriodMonths);
            nextMaintenanceDate = d.toISOString();
          } else {
            nextMaintenanceDate = undefined;
          }

          return {
            ...t,
            customerId: customer!.id,
            customerName: customer!.name,
            personnelId: formData.personnelId || "",
            personnelName: assignedPersonnel
              ? `${assignedPersonnel.firstName} ${assignedPersonnel.lastName}`
              : "",
            deviceType: formData.deviceType || "",
            serialNumber: formData.serialNumber,
            issueDescription: formData.issueDescription || "",
            maintenancePeriodMonths: formData.maintenancePeriodMonths,
            nextMaintenanceDate,
          };
        }
        return t;
      });
      store.setServiceTickets(updatedTickets);
      toast.success("Kayıt başarıyla güncellendi.");
    } else {
      const dateCreated = new Date();
      let nextMaintenanceDate: string | undefined = undefined;
      if (
        formData.maintenancePeriodMonths &&
        formData.maintenancePeriodMonths > 0
      ) {
        const d = new Date(dateCreated);
        d.setMonth(d.getMonth() + formData.maintenancePeriodMonths);
        nextMaintenanceDate = d.toISOString();
      }

      const newTicket: ServiceTicket = {
        id: crypto.randomUUID(),
        customerId: customer!.id,
        customerName: customer!.name,
        personnelId: formData.personnelId,
        personnelName: assignedPersonnel
          ? `${assignedPersonnel.firstName} ${assignedPersonnel.lastName}`
          : "",
        deviceType: formData.deviceType,
        serialNumber: formData.serialNumber,
        issueDescription: formData.issueDescription,
        maintenancePeriodMonths: formData.maintenancePeriodMonths,
        nextMaintenanceDate,
        status: ServiceTicketStatus.PENDING,
        dateCreated: dateCreated.toISOString(),
        materialsUsed: [],
        laborFee: 0,
        taxRate: 20,
        totalCost: 0,
        plumbingChecklist: (store.settings.plumbingChecklistTemplate || []).map(
          (item) => ({
            itemName: item,
            isChecked: false,
          }),
        ),
      };
      store.setServiceTickets([...serviceTickets, newTicket]);
      toast.success("Yeni kayıt oluşturuldu.");
    }
    setIsModalOpen(false);
  };

  const getStatusColor = (status: ServiceTicketStatus) => {
    switch (status) {
      case ServiceTicketStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case ServiceTicketStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case ServiceTicketStatus.COMPLETED:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case ServiceTicketStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 py-1 px-3 border border-gray-200";
    }
  };

  const openDetail = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
    setMaintenancePeriod(ticket.maintenancePeriodMonths || "");
  };

  const openEditTicket = (ticket: ServiceTicket) => {
    setFormData({
      id: ticket.id,
      customerId: ticket.customerId,
      deviceType: ticket.deviceType,
      serialNumber: ticket.serialNumber || "",
      issueDescription: ticket.issueDescription,
      personnelId: ticket.personnelId || "",
      maintenancePeriodMonths: ticket.maintenancePeriodMonths,
    });
    setIsModalOpen(true);
  };

  const handleDeleteTicket = (ticketId: string) => {
    store.setServiceTickets(serviceTickets.filter((t) => t.id !== ticketId));
    toast.success("Kayıt başarıyla silindi.");
  };

  const addMaterialToTicket = () => {
    if (!selectedTicket || !selectedProductToAdd || quantityToAdd <= 0) return;
    const isZimmet = selectedProductToAdd.startsWith('zimmet_');
    const id = selectedProductToAdd.replace('zimmet_', '').replace('depo_', '');
    let material: ServiceMaterial;

    if (isZimmet) {
       const techPerson = store.personnel.find(p => p.id === selectedTicket.personnelId);
       if (!techPerson) return;
       const fixture = techPerson.fixtures?.find(f => String(f.id) === id);
       if (!fixture) return;
       if (fixture.quantity < quantityToAdd) {
           toast.error('Zimmetinizde bu üründen yeterli miktarda yok.');
           return;
       }
       const baseProduct = products.find(p => p.id === fixture.productId);
       
       material = {
         productId: fixture.productId,
         productName: fixture.productName,
         quantity: quantityToAdd,
         unitPrice: baseProduct?.price || 0,
         source: 'Zimmet',
         fixtureId: fixture.id
       };
    } else {
       const product = products.find(
         (p) => String(p.id) === String(id),
       );
       if (!product) return;

       material = {
         productId: product.id,
         productName: product.name,
         quantity: quantityToAdd,
         unitPrice: product.price,
         source: 'Depo'
       };
    }

    const updatedTicket = {
      ...selectedTicket,
      materialsUsed: [...selectedTicket.materialsUsed, material],
    };

    // Recalculate total
    const materialsTotal = updatedTicket.materialsUsed.reduce(
      (acc, m) => acc + m.quantity * m.unitPrice,
      0,
    );
    const subtotal = materialsTotal + (updatedTicket.laborFee || 0);
    updatedTicket.totalCost =
      subtotal + subtotal * (updatedTicket.taxRate / 100);

    store.setServiceTickets(
      serviceTickets.map((t) =>
        t.id === selectedTicket.id ? updatedTicket : t,
      ),
    );
    setSelectedTicket(updatedTicket);
    setSelectedProductToAdd("");
    setQuantityToAdd(1);
  };

  const removeMaterial = (index: number) => {
    if (!selectedTicket) return;
    const newMaterials = [...selectedTicket.materialsUsed];
    newMaterials.splice(index, 1);

    const updatedTicket = {
      ...selectedTicket,
      materialsUsed: newMaterials,
    };

    const materialsTotal = updatedTicket.materialsUsed.reduce(
      (acc, m) => acc + m.quantity * m.unitPrice,
      0,
    );
    const subtotal = materialsTotal + (updatedTicket.laborFee || 0);
    updatedTicket.totalCost =
      subtotal + subtotal * (updatedTicket.taxRate / 100);

    store.setServiceTickets(
      serviceTickets.map((t) =>
        t.id === selectedTicket.id ? updatedTicket : t,
      ),
    );
    setSelectedTicket(updatedTicket);
  };

  const toggleChecklistItem = (index: number) => {
    if (!selectedTicket || !selectedTicket.plumbingChecklist) return;
    const newList = [...selectedTicket.plumbingChecklist];
    newList[index].isChecked = !newList[index].isChecked;
    const updatedTicket = { ...selectedTicket, plumbingChecklist: newList };
    store.setServiceTickets(
      serviceTickets.map((t) =>
        t.id === selectedTicket.id ? updatedTicket : t,
      ),
    );
    setSelectedTicket(updatedTicket);
  };

  const completeTicket = () => {
    if (!selectedTicket) return;

    // Check stock for materials and reduce them
    const newProducts = [...products];
    const newPersonnelList = [...store.personnel];
    let personnelUpdated = false;

    for (const material of selectedTicket.materialsUsed) {
      if (material.source === 'Zimmet') {
        const pIndex = newPersonnelList.findIndex(p => String(p.id) === String(selectedTicket.personnelId));
        if (pIndex > -1 && newPersonnelList[pIndex].fixtures) {
           const fIndex = newPersonnelList[pIndex].fixtures!.findIndex(f => String(f.id) === String(material.fixtureId));
           if (fIndex > -1) {
              const updatedFixtures = [...newPersonnelList[pIndex].fixtures!];
              updatedFixtures[fIndex] = {
                 ...updatedFixtures[fIndex],
                 quantity: Math.max(0, updatedFixtures[fIndex].quantity - material.quantity)
              };
              newPersonnelList[pIndex] = { ...newPersonnelList[pIndex], fixtures: updatedFixtures };
              personnelUpdated = true;
           }
        }
      } else {
        const pIndex = newProducts.findIndex((p) => String(p.id) === String(material.productId));
        if (pIndex > -1) {
          let p = newProducts[pIndex];
          let remainingQuantity = material.quantity;
          let newWarehouseStocks = [...(p.warehouseStocks || [])];
  
          for (let i = 0; i < newWarehouseStocks.length; i++) {
            if (remainingQuantity <= 0) break;
            if (newWarehouseStocks[i].stock > 0) {
              const deduct = Math.min(
                newWarehouseStocks[i].stock,
                remainingQuantity,
              );
              newWarehouseStocks[i] = {
                ...newWarehouseStocks[i],
                stock: newWarehouseStocks[i].stock - deduct,
              };
              remainingQuantity -= deduct;
            }
          }
  
          newProducts[pIndex] = {
            ...p,
            stock: Math.max(0, p.stock - material.quantity),
            warehouseStocks: newWarehouseStocks,
          };
        }
      }
    }
    
    store.setProducts(newProducts);
    if (personnelUpdated) {
       store.setPersonnel(newPersonnelList);
    }

    // Apply financial changes
    if (selectedTicket.totalCost > 0) {
      if (isPaid) {
        const cashTrx: CashTransaction = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: "Gelir",
          category: "Satış",
          amount: selectedTicket.totalCost,
          description: `Servis Formu: ${selectedTicket.deviceType} onarımı peşin tahsilat`,
          customerId: selectedTicket.customerId,
        };
        store.setCashTransactions([...store.cashTransactions, cashTrx]);
      } else {
        const customerTrx: CustomerTransaction = {
          id: crypto.randomUUID(),
          customerId: selectedTicket.customerId,
          date: new Date().toISOString(),
          type: "Satış",
          amount: selectedTicket.totalCost,
          description: `Servis Formu: ${selectedTicket.deviceType} onarımı`,
        };
        store.setTransactions([...store.transactions, customerTrx]);

        // Update customer balance (Buyer goes positive balance normally or we subtract)
        const cIndex = customers.findIndex(
          (c) => String(c.id) === String(selectedTicket.customerId),
        );
        if (cIndex > -1) {
          const newCustomers = [...customers];
          newCustomers[cIndex] = {
            ...newCustomers[cIndex],
            balance: newCustomers[cIndex].balance + selectedTicket.totalCost,
          };
          store.setCustomers(newCustomers);
        }
      }
    }

    let nextMaintenanceDate: string | undefined = undefined;
    if (maintenancePeriod && maintenancePeriod > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + maintenancePeriod);
      nextMaintenanceDate = d.toISOString();
    }

    const updatedTicket = {
      ...selectedTicket,
      status: ServiceTicketStatus.COMPLETED,
      dateCompleted: new Date().toISOString(),
      maintenancePeriodMonths: maintenancePeriod || undefined,
      nextMaintenanceDate,
    };

    store.setServiceTickets(
      serviceTickets.map((t) =>
        t.id === selectedTicket.id ? updatedTicket : t,
      ),
    );
    setSelectedTicket(updatedTicket);
  };

  const generateHTML = (format: "a4" | "thermal") => {
    if (!selectedTicket) return "";
    const isA4 = format === "a4";

    const taxRate = selectedTicket.taxRate || 20;
    const materialsTotal = selectedTicket.materialsUsed.reduce(
      (acc, m) => acc + m.quantity * m.unitPrice,
      0,
    );
    const subtotal = materialsTotal + (selectedTicket.laborFee || 0);
    const vatAmount = subtotal * (taxRate / 100);

    const materialsHtml = selectedTicket.materialsUsed
      .map(
        (m) => `
      <tr>
        <td style="padding: 4px 0">${m.productName}</td>
        <td style="padding: 4px 0; text-align: center;">${m.quantity}</td>
        ${isA4 ? `<td style="padding: 4px 0; text-align: right;">${m.unitPrice.toLocaleString("tr-TR")} ₺</td>` : ""}
        <td style="padding: 4px 0; text-align: right;">${(m.quantity * m.unitPrice).toLocaleString("tr-TR")} ₺</td>
      </tr>
    `,
      )
      .join("");

    const laborHtml =
      selectedTicket.laborFee > 0
        ? `
      <tr>
        <td colspan="${isA4 ? "3" : "2"}" style="padding: 4px 0; border-top: 1px dashed #ccc; font-weight: bold;">İşçilik Ücreti</td>
        <td style="padding: 4px 0; text-align: right; border-top: 1px dashed #ccc; font-weight: bold;">${selectedTicket.laborFee.toLocaleString("tr-TR")} ₺</td>
      </tr>
    `
        : "";

    const checklistHtml =
      selectedTicket.plumbingChecklist &&
      selectedTicket.plumbingChecklist.length > 0
        ? `
      <div class="desc">
        <div class="desc-title">Bakım / Kontrol Listesi:</div>
        <div style="margin-top: 5px;">
          ${selectedTicket.plumbingChecklist
            .map(
              (item) => `
            <div style="margin-bottom: 3px;">
              <span style="font-family: monospace; font-size: ${isA4 ? "14px" : "12px"};">${item.isChecked ? "[ X ]" : "[   ]"}</span> ${item.itemName}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `
        : "";

    const resolutionHtml = selectedTicket.resolutionNotes
      ? `
      <div class="desc">
        <div class="desc-title">Yapılan İşlemler / Çözüm Detayı:</div>
        <div class="desc-text">${selectedTicket.resolutionNotes}</div>
      </div>
    `
      : "";

    const qrUrl = encodeURIComponent(
      `${window.location.origin}/ticket/${selectedTicket.id}`,
    );
    const qrCodeHtml = `
      <div style="text-align: center; margin-top: 20px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrUrl}" alt="QR Kod" style="width: 100px; height: 100px;" />
        <div style="font-size: 10px; margin-top: 5px; color: #6b7280;">Formu Görüntüle</div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Servis Formu - ${selectedTicket.id}</title>
          <style>
            @page { size: ${isA4 ? "A4 portrait" : "80mm auto"}; margin: ${isA4 ? "10mm" : "0"}; }
            body { 
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0 auto; 
              padding: ${isA4 ? "0" : "4mm"}; 
              width: ${isA4 ? "190mm" : "72mm"};
              box-sizing: border-box;
              color: #111827;
              font-size: ${isA4 ? "12px" : "12px"};
              line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: ${isA4 ? "20px" : "15px"}; border-bottom: ${isA4 ? "2px solid #10b981" : "1px solid #000"}; padding-bottom: ${isA4 ? "10px" : "10px"}; }
            .header h1 { margin: 0; padding: 0; font-size: ${isA4 ? "24px" : "18px"}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${isA4 ? "#065f46" : "#000"}; }
            .header-info { font-size: ${isA4 ? "11px" : "10px"}; margin-top: 5px; color: #4b5563; }
            
            .info-grid { display: ${isA4 ? "grid" : "block"}; grid-template-columns: 1fr 1fr; gap: ${isA4 ? "15px" : "0"}; margin-bottom: ${isA4 ? "15px" : "15px"}; }
            .info-card { background: ${isA4 ? "#f9fafb" : "transparent"}; padding: ${isA4 ? "10px" : "0"}; border-radius: ${isA4 ? "8px" : "0"}; border: ${isA4 ? "1px solid #e5e7eb" : "none"}; margin-bottom: ${isA4 ? "0" : "10px"}; }
            
            .info-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: ${isA4 ? "4px 0" : "2px 0"}; }
            .info-row:last-child { border-bottom: none; }
            .info-row strong { text-align: left; color: #374151; font-size: 12px; }
            .info-row span { text-align: right; font-weight: 500; font-size: 12px; }
            
            .desc { margin-top: 10px; background: ${isA4 ? "#f9fafb" : "transparent"}; padding: ${isA4 ? "10px" : "10px 0"}; border-radius: ${isA4 ? "8px" : "0"}; border: ${isA4 ? "1px solid #e5e7eb" : "none"}; border-top: ${isA4 ? "1px solid #e5e7eb" : "1px dashed #ccc"}; }
            .desc-title { font-weight: bold; margin-bottom: 6px; text-transform: uppercase; font-size: ${isA4 ? "11px" : "11px"}; color: #4b5563; letter-spacing: 0.5px; }
            .desc-text { white-space: pre-wrap; font-size: ${isA4 ? "12px" : "12px"}; color: #111827; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: ${isA4 ? "12px" : "11px"}; }
            th { text-align: left; border-bottom: 2px solid #000; padding: ${isA4 ? "6px" : "4px"} 4px; font-weight: bold; color: #374151; }
            td { padding: ${isA4 ? "6px" : "4px"} 4px; border-bottom: 1px solid #e5e7eb; }
            
            .total-section { text-align: right; font-weight: bold; font-size: ${isA4 ? "16px" : "14px"}; padding-top: 10px; margin-top: 10px; border-top: 2px solid #000; color: #111827; }
            
            .signatures { display: ${isA4 ? "flex" : "block"}; justify-content: space-between; margin-top: ${isA4 ? "20px" : "20px"}; padding: ${isA4 ? "0 20px" : "0"}; font-size: ${isA4 ? "12px" : "12px"}; page-break-inside: avoid; align-items: flex-end; }
            .signature-box { text-align: center; color: #374151; margin-bottom: ${isA4 ? "0" : "20px"}; width: ${isA4 ? "30%" : "100%"}; }
            .signature-line { margin-top: ${isA4 ? "40px" : "40px"}; border-bottom: 1px solid #000; width: ${isA4 ? "100%" : "100%"}; margin-bottom: 6px; display: inline-block; }
            
            .footer { text-align: center; margin-top: ${isA4 ? "20px" : "20px"}; font-size: ${isA4 ? "10px" : "10px"}; color: #6b7280; border-top: 1px dashed #ccc; padding-top: 10px; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ARIZA / SERVİS FORMU</h1>
            <div class="header-info">Kayıt No: ${selectedTicket.id.split("-")[0]} &nbsp;|&nbsp; Tarih: ${new Date(selectedTicket.dateCreated).toLocaleDateString("tr-TR")}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-card">
              <div class="desc-title" style="margin-bottom: 10px; ${isA4 ? "" : "display:none;"}">Müşteri Bilgileri</div>
              <div class="info-row"><strong>Müşteri:</strong> <span>${selectedTicket.customerName}</span></div>
              <div class="info-row"><strong>Personel:</strong> <span>${selectedTicket.personnelName || "-"}</span></div>
              <div class="info-row"><strong>Durum:</strong> <span>${selectedTicket.status}</span></div>
            </div>
            
            <div class="info-card">
              <div class="desc-title" style="margin-bottom: 10px; ${isA4 ? "" : "display:none;"}">Cihaz Bilgileri</div>
              <div class="info-row"><strong>Cihaz:</strong> <span>${selectedTicket.deviceType}</span></div>
              ${selectedTicket.serialNumber ? `<div class="info-row"><strong>Seri No:</strong> <span>${selectedTicket.serialNumber}</span></div>` : ""}
              ${
                selectedTicket.maintenancePeriodMonths
                  ? `
                 <div class="info-row"><strong>Pr. Bakım:</strong> <span>${selectedTicket.maintenancePeriodMonths} Ay</span></div>
                 ${selectedTicket.nextMaintenanceDate ? `<div class="info-row"><strong>Snr. Bakım:</strong> <span>${new Date(selectedTicket.nextMaintenanceDate).toLocaleDateString("tr-TR")}</span></div>` : ""}
              `
                  : ""
              }
            </div>
          </div>

          <div class="desc">
            <div class="desc-title">Şikayet / Arıza Detayı:</div>
            <div class="desc-text">${selectedTicket.issueDescription}</div>
          </div>
          ${checklistHtml}
          ${resolutionHtml}
          
          ${
            selectedTicket.materialsUsed.length > 0 ||
            selectedTicket.laborFee > 0
              ? `
          <table>
            <thead>
              <tr>
                <th>İşlem/Parça</th>
                <th style="text-align: center;">Ad.</th>
                ${isA4 ? `<th style="text-align: right;">Br.</th>` : ""}
                <th style="text-align: right;">Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${materialsHtml}
              ${laborHtml}
            </tbody>
          </table>
          <div class="total-section">
            <div style="display: flex; justify-content: flex-end; gap: 15px; font-size: ${isA4 ? "14px" : "12px"}; font-weight: normal; margin-bottom: 5px;">
              <span style="color: #4b5563;">Ara Toplam:</span>
              <span>${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 15px; font-size: ${isA4 ? "14px" : "12px"}; font-weight: normal; margin-bottom: 8px;">
              <span style="color: #4b5563;">KDV (%${taxRate}):</span>
              <span>${vatAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 5px; border-top: 1px dotted #ccc; padding-top: 8px;">
              <span style="color: #111827;">Genel Toplam:</span>
              <span style="color: #111827;">${selectedTicket.totalCost.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
            </div>
          </div>
          `
              : ""
          }
          
          <div class="signatures">
            <div class="signature-box">
              <strong>Müşteri</strong>
              <div class="signature-line"></div>
              <span>Ad Soyad / İmza</span>
            </div>
            ${isA4 ? qrCodeHtml : ""}
            <div class="signature-box">
              <strong>Firma Yetkilisi</strong>
              <div class="signature-line"></div>
              <span>Ad Soyad / İmza</span>
            </div>
          </div>
          
          ${!isA4 ? qrCodeHtml : ""}
          
          <div class="footer">
            Bu belge bilgilendirme amaçlıdır. Mali değeri yoktur. <br/>
            Bizi tercih ettiğiniz için teşekkür ederiz.
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = (format: "a4" | "thermal") => {
    if (!selectedTicket) return;
    const html = generateHTML(format);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const handleDownloadPdf = () => {
    if (!selectedTicket) return;
    const html = generateHTML("a4");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Servis_Formu_${selectedTicket.id.split("-")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(wrapper).save();
    toast.success("PDF indirme başladı.");
  };

  const handleSendEmail = async () => {
    if (!selectedTicket) return;
    const customer = customers.find((c) => c.id === selectedTicket.customerId);
    if (!customer?.email) {
      toast.error("Müşterinin e-posta adresi bulunmuyor.");
      return;
    }

    const templateRaw =
      store.settings.email_template_service_ticket ||
      defaultTemplates.service_ticket;

    const emailContent = parseEmailTemplate(templateRaw, {
      FIRMA_ADI: store.settings.company_name || "Şirket Adı",
      MUSTERI_ADI: selectedTicket.customerName,
      TARIH: new Date().toLocaleDateString("tr-TR"),
      KAYIT_NO: selectedTicket.id.split("-")[0],
      CIHAZ: selectedTicket.deviceType,
      DURUM: selectedTicket.status,
      SIKAYET: selectedTicket.issueDescription || "-",
      TUTAR: selectedTicket.totalCost
        ? selectedTicket.totalCost.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
          })
        : "0,00 ₺",
      FIRMA_ADRES: store.settings.company_address || "-",
      FIRMA_TELEFON: store.settings.company_phone || "-",
      FIRMA_MAIL: store.settings.company_email || "-",
    });

    const loadingToast = toast.loading("E-posta gönderiliyor...");

    try {
      const html = generateHTML("a4");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Servis_Formu_${selectedTicket.id.split("-")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const pdfBase64DataUri = await html2pdf()
        .set(opt)
        .from(wrapper)
        .outputPdf("datauristring");

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id":
            localStorage.getItem("esila_tenant_id") || "1111111111",
        },
        body: JSON.stringify({
          to: customer.email,
          subject: `Servis Kayıt Formu - ${selectedTicket.id.split("-")[0]}`,
          html: emailContent,
          wrapped: true,
          attachments: [
            {
              filename: `Servis_Formu_${selectedTicket.id.split("-")[0]}.pdf`,
              path: pdfBase64DataUri,
            },
          ],
        }),
      });

      if (res.ok) {
        toast.success(
          `${customer.email} adresine servis formu başarıyla gönderildi.`,
          { id: loadingToast },
        );
      } else {
        const err = await res.json();
        toast.error(
          "E-posta gönderilemedi: " + (err.error || "Bilinmeyen hata"),
          { id: loadingToast },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Göderim sırasında bir hata oluştu.", { id: loadingToast });
    }
  };

  const handleBulkEmail = async () => {
    if (selectedTicketIds.size === 0) {
      toast.error("Lütfen mail gönderilecek kayıtları seçin.");
      return;
    }

    const ticketsToSend = filteredTickets.filter((t) =>
      selectedTicketIds.has(t.id),
    );

    if (ticketsToSend.length === 0) {
      toast.error("Toplu mail gönderilecek kayıt bulunamadı.");
      return;
    }

    const templateRaw =
      store.settings.email_template_service_ticket ||
      defaultTemplates.service_ticket;

    const loadingToast = toast.loading("Toplu e-posta gönderimi başlatıldı...");
    let successCount = 0;

    for (const ticket of ticketsToSend) {
      const customer = customers.find((c) => c.id === ticket.customerId);
      if (customer?.email) {
        const emailContent = parseEmailTemplate(templateRaw, {
          FIRMA_ADI: store.settings.company_name || "Şirket Adı",
          MUSTERI_ADI: ticket.customerName,
          TARIH: new Date().toLocaleDateString("tr-TR"),
          KAYIT_NO: ticket.id.split("-")[0],
          CIHAZ: ticket.deviceType,
          DURUM: ticket.status,
          SIKAYET: ticket.issueDescription || "-",
          TUTAR: ticket.totalCost
            ? ticket.totalCost.toLocaleString("tr-TR", {
                style: "currency",
                currency: "TRY",
              })
            : "0,00 ₺",
          FIRMA_ADRES: store.settings.company_address || "-",
          FIRMA_TELEFON: store.settings.company_phone || "-",
          FIRMA_MAIL: store.settings.company_email || "-",
        });

        try {
          const fakeTarget = { ...ticket };

          const taxRate = fakeTarget.taxRate || 20;
          const materialsTotal = fakeTarget.materialsUsed.reduce(
            (acc, m) => acc + m.quantity * m.unitPrice,
            0,
          );
          const subtotal = materialsTotal + (fakeTarget.laborFee || 0);
          const vatAmount = subtotal * (taxRate / 100);

          const isA4 = true;
          const materialsHtml = fakeTarget.materialsUsed
            .map(
              (m) => `
            <tr>
              <td style="padding: 4px 0">${m.productName}</td>
              <td style="padding: 4px 0; text-align: center;">${m.quantity}</td>
              <td style="padding: 4px 0; text-align: right;">${m.unitPrice.toLocaleString("tr-TR")} ₺</td>
              <td style="padding: 4px 0; text-align: right;">${(m.quantity * m.unitPrice).toLocaleString("tr-TR")} ₺</td>
            </tr>
          `,
            )
            .join("");

          const laborHtml =
            fakeTarget.laborFee > 0
              ? `
            <tr>
              <td colspan="3" style="padding: 4px 0; border-top: 1px dashed #ccc; font-weight: bold;">İşçilik Ücreti</td>
              <td style="padding: 4px 0; text-align: right; border-top: 1px dashed #ccc; font-weight: bold;">${fakeTarget.laborFee.toLocaleString("tr-TR")} ₺</td>
            </tr>
          `
              : "";

          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  @page { size: A4 portrait; margin: 10mm; }
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.4; width: 190mm; margin: 0 auto; }
                  table { width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left; font-size: 11px;}
                  th { border-bottom: 1px solid #000; padding-bottom: 5px; }
                  td { padding: 4px 0; border-bottom: 1px solid #eee; }
                </style>
              </head>
              <body>
                <h1 style="text-align:center;">Servis Formu</h1>
                <p><strong>Müşteri:</strong> ${fakeTarget.customerName}</p>
                <p><strong>Cihaz:</strong> ${fakeTarget.deviceType}</p>
                <table>
                  <thead><tr><th>Ürün</th><th style="text-align:center;">Miktar</th><th style="text-align:right;">Birim Fiyat</th><th style="text-align:right;">Toplam</th></tr></thead>
                  <tbody>${materialsHtml}${laborHtml}</tbody>
                </table>
                <div style="text-align: right; margin-top: 20px;">
                  <p>Ara Toplam: ${subtotal.toLocaleString("tr-TR")} ₺</p>
                  <p>KDV: ${vatAmount.toLocaleString("tr-TR")} ₺</p>
                  <h3>Genel Toplam: ${fakeTarget.totalCost.toLocaleString("tr-TR")} ₺</h3>
                </div>
              </body>
            </html>
          `;

          const wrapper = document.createElement("div");
          wrapper.innerHTML = html;
          const pdfBase64DataUri = await html2pdf()
            .set({
              margin: [5, 5, 5, 5],
              filename: "form.pdf",
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
              pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            })
            .from(wrapper)
            .outputPdf("datauristring");

          const res = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id":
                localStorage.getItem("esila_tenant_id") || "1111111111",
            },
            body: JSON.stringify({
              to: customer.email,
              subject: `Servis Bilgilendirmesi - ${ticket.id.split("-")[0]}`,
              html: emailContent,
              wrapped: true,
              attachments: [
                {
                  filename: `Servis_Formu_${ticket.id.split("-")[0]}.pdf`,
                  path: pdfBase64DataUri,
                },
              ],
            }),
          });
          
          if (res.ok) {
            successCount++;
          }
        } catch (e) {
          console.error("Mail gönderim hatası:", e);
        }
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} müşteriye toplu mail gönderildi.`, {
        id: loadingToast,
      });
      setSelectedTicketIds(new Set());
    } else {
      toast.error("Geçerli e-posta adresine sahip müşteri bulunamadı.", {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Arıza / Servis Formları
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Teknik servis ve onarım süreçlerini yönetin
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(INITIAL_FORM);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Yeni Arıza Kaydı
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "all" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Tüm Arızalar
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "maintenance" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Periyodik Bakımlar
            </button>
            <button
              onClick={() => setActiveTab("checklist")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "checklist" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Tesisat Kontrol Bakım Listesi
            </button>
          </nav>
        </div>
        {activeTab !== "checklist" && (
          <>
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full max-w-lg flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Müşteri, cihaz veya seri no ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                {activeTab === "maintenance" && (
                  <input
                    type="month"
                    value={maintenanceMonthStr}
                    onChange={(e) => setMaintenanceMonthStr(e.target.value)}
                    className="w-full sm:w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500"
                    title="Aylık Bakım Filtresi"
                  />
                )}
                <button
                  onClick={handleBulkEmail}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg font-medium transition-colors"
                  title="Filtrelenmiş Listeye Toplu Mail Gönder"
                >
                  <Send size={18} />
                  <span className="hidden sm:inline">Toplu Mail</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          filteredTickets.length > 0 &&
                          selectedTicketIds.size === filteredTickets.length
                        }
                        onChange={toggleAllSelection}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="p-4 font-semibold text-gray-600">Tarih</th>
                    <th className="p-4 font-semibold text-gray-600">Müşteri</th>
                    <th className="p-4 font-semibold text-gray-600">
                      Cihaz / Seri No
                    </th>
                    {activeTab === "maintenance" && (
                      <th className="p-4 font-semibold text-gray-600">
                        Sonraki Bakım
                      </th>
                    )}
                    <th className="p-4 font-semibold text-gray-600">
                      Atanan Personel
                    </th>
                    <th className="p-4 font-semibold text-gray-600">Durum</th>
                    <th className="p-4 font-semibold text-gray-600">Tutar</th>
                    <th className="p-4 font-semibold text-gray-600">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTab === "maintenance" ? 9 : 8}
                        className="p-8 text-center text-gray-500"
                      >
                        Henüz kayıtlı arıza formu bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedTicketIds.has(ticket.id)}
                            onChange={() => toggleTicketSelection(ticket.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(ticket.dateCreated).toLocaleDateString(
                            "tr-TR",
                          )}
                        </td>
                        <td className="p-4 font-medium text-gray-800">
                          {ticket.customerName}
                        </td>
                        <td className="p-4 text-gray-600">
                          <div>{ticket.deviceType}</div>
                          {ticket.serialNumber && (
                            <div className="text-xs text-gray-400 uppercase tracking-wider">
                              {ticket.serialNumber}
                            </div>
                          )}
                        </td>
                        {activeTab === "maintenance" && (
                          <td className="p-4 text-gray-600 font-medium">
                            {ticket.nextMaintenanceDate
                              ? new Date(
                                  ticket.nextMaintenanceDate,
                                ).toLocaleDateString("tr-TR")
                              : "-"}
                          </td>
                        )}
                        <td className="p-4 text-gray-600">
                          {ticket.personnelName || (
                            <span className="text-gray-400 italic">
                              Atanmamış
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-800">
                          {ticket.totalCost > 0
                            ? ticket.totalCost.toLocaleString("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                              })
                            : "-"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetail(ticket)}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                              Yönet <ChevronRight size={16} />
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <button
                              onClick={() => openEditTicket(ticket)}
                              className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
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
              totalItems={filteredTickets.length}
            />
          </>
        )}

        {activeTab === "checklist" && (
          <div className="p-6 md:p-8 animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Tesisat Bakım & Kontrol Listesi Şablonu
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Burada eklediğiniz maddeler, yeni oluşturduğunuz Arıza/Bakım
              formlarında kontrol listesi olarak yer alacaktır. Teknisyenler
              onarım sırasında bu maddeleri form üzerinden kontrol edebilir.
            </p>

            <div className="max-w-2xl bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 flex gap-2 border-b border-gray-200">
                <input
                  type="text"
                  id="new-checklist-item"
                  placeholder="Yeni kontrol maddesi ekle..."
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        const currentTemplate =
                          store.settings?.plumbingChecklistTemplate || [];
                        store.setSettings({
                          ...store.settings,
                          plumbingChecklistTemplate: [...currentTemplate, val],
                        });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(
                      "new-checklist-item",
                    ) as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const val = input.value.trim();
                      const currentTemplate =
                        store.settings?.plumbingChecklistTemplate || [];
                      store.setSettings({
                        ...store.settings,
                        plumbingChecklistTemplate: [...currentTemplate, val],
                      });
                      input.value = "";
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                >
                  Madde Ekle
                </button>
              </div>
              <ul className="divide-y divide-gray-100">
                {!store.settings?.plumbingChecklistTemplate ||
                store.settings.plumbingChecklistTemplate.length === 0 ? (
                  <li className="p-8 text-center text-sm text-gray-500">
                    Henüz madde eklenmemiş.
                  </li>
                ) : (
                  store.settings.plumbingChecklistTemplate.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-4 hover:bg-gray-50 group"
                      >
                        <span className="text-sm text-gray-700 font-medium">
                          {item}
                        </span>
                        <button
                          onClick={() => {
                            const newList = [
                              ...(store.settings?.plumbingChecklistTemplate ||
                                []),
                            ];
                            newList.splice(index, 1);
                            store.setSettings({
                              ...store.settings,
                              plumbingChecklistTemplate: newList,
                            });
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Listeden Kaldır"
                        >
                          <XCircle size={20} />
                        </button>
                      </li>
                    ),
                  )
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="text-emerald-600" size={24} />
                {formData.id ? "Arıza Kaydını Düzenle" : "Yeni Arıza Kaydı"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri Seçin *
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">Arama / Seçim Yapın</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atanacak Personel
                </label>
                <select
                  value={formData.personnelId}
                  onChange={(e) =>
                    setFormData({ ...formData, personnelId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Personel Seçin (Opsiyonel)</option>
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cihaz / Makine Türü *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                    value={formData.deviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceType: e.target.value })
                    }
                    placeholder="Örn: CNC Torna, Lazer Yazıcı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seri Numarası
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    placeholder="Seri veya Model No"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arıza / Şikayet Açıklaması *
                </label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none min-h-[100px]"
                  value={formData.issueDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      issueDescription: e.target.value,
                    })
                  }
                  placeholder="Müşterinin belirttiği arıza durumu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periyodik Bakım Süresi (Ay)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                  value={formData.maintenancePeriodMonths || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maintenancePeriodMonths:
                        Number(e.target.value) || undefined,
                    })
                  }
                  placeholder="Bakım Yok"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleSaveTicket}
                disabled={
                  !formData.customerId ||
                  !formData.deviceType ||
                  !formData.issueDescription
                }
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              >
                {formData.id ? "Güncelle" : "Kaydı Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-wrap gap-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-emerald-600" />
                Arıza Formu Detayı
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                  title="QR Kod oluştur"
                >
                  <QrCode size={16} />
                  QR Kod
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-emerald-200"
                  title="Müşteriye E-Posta Gönder"
                >
                  <Mail size={16} />
                  Mail Gönder
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                >
                  <Download size={16} />
                  PDF İndir
                </button>
                <button
                  onClick={() => handlePrint("thermal")}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                >
                  <Printer size={16} />
                  Fiş (80mm)
                </button>
                <button
                  onClick={() => handlePrint("a4")}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                >
                  <Printer size={16} />
                  A4 Yazdır
                </button>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}
                >
                  {selectedTicket.status}
                </span>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <XCircle size={28} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 border-r border-gray-100 pr-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">
                    Genel Bilgiler
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500">Müşteri</p>
                      <p className="font-medium text-gray-800">
                        {selectedTicket.customerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cihaz</p>
                      <p className="font-medium text-gray-800">
                        {selectedTicket.deviceType}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Seri No</p>
                      <p className="font-medium text-gray-800">
                        {selectedTicket.serialNumber || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Personel</p>
                      <p className="font-medium text-gray-800">
                        {selectedTicket.personnelName || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">
                    Şikayet Açıklaması
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTicket.issueDescription}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">
                    Tesisat Kontrol Bakım Listesi
                  </h4>

                  <div className="space-y-2">
                    {(!selectedTicket.plumbingChecklist ||
                      selectedTicket.plumbingChecklist.length === 0) && (
                      <p className="text-sm text-gray-500 italic">
                        Maddeler ayarlardan eklenebilir. Bu arızada kontrol
                        maddesi yok.
                      </p>
                    )}
                    {selectedTicket.plumbingChecklist?.map((item, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={item.isChecked}
                          onChange={() => toggleChecklistItem(i)}
                          disabled={
                            selectedTicket.status ===
                              ServiceTicketStatus.COMPLETED ||
                            selectedTicket.status ===
                              ServiceTicketStatus.CANCELLED
                          }
                          className="mt-1 flex-shrink-0 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <span
                          className={`text-sm flex-1 ${item.isChecked ? "text-gray-400 line-through" : "text-gray-700"}`}
                        >
                          {item.itemName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col h-full space-y-6">
                {/* Material Usage */}
                <div>
                  <h4 className="font-semibold text-gray-700 border-b pb-2 mb-4">
                    Kullanılan Malzemeler
                  </h4>

                  {selectedTicket.status !== ServiceTicketStatus.COMPLETED &&
                    selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                      <div className="flex gap-2 mb-4">
                        <select
                          className="flex-1 p-2 rounded-lg border border-gray-200 outline-none"
                          value={selectedProductToAdd}
                          onChange={(e) =>
                            setSelectedProductToAdd(e.target.value)
                          }
                        >
                          <option value="">Ürün Seçin</option>
                          <optgroup label="Merkez Depo (Stok)">
                              {products.map((p) => (
                                <option key={'depo_' + p.id} value={'depo_' + p.id}>
                                  {p.name} ({p.price} ₺) - Stok: {p.stock}
                                </option>
                              ))}
                          </optgroup>
                          {selectedTicket.personnelId && (store.personnel.find(p => p.id === selectedTicket.personnelId)?.fixtures?.length ?? 0) > 0 && (
                              <optgroup label="Personel Zimmeti">
                                  {store.personnel.find(p => p.id === selectedTicket.personnelId)?.fixtures?.map(f => {
                                      const basePrice = products.find(x => x.id === f.productId)?.price || 0;
                                      return (
                                          <option key={'zimmet_' + f.id} value={'zimmet_' + f.id}>
                                            {f.productName} ({basePrice} ₺) - Zimmet: {f.quantity}
                                          </option>
                                      );
                                  })}
                              </optgroup>
                          )}
                        </select>
                        <input
                          type="number"
                          className="w-20 p-2 rounded-lg border border-gray-200 outline-none text-center"
                          min="1"
                          value={quantityToAdd}
                          onChange={(e) =>
                            setQuantityToAdd(Number(e.target.value))
                          }
                        />
                        <button
                          onClick={addMaterialToTicket}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg font-medium transition-colors"
                        >
                          Ekle
                        </button>
                      </div>
                    )}

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 border-b text-gray-600">Ürün</th>
                          <th className="p-2 border-b text-gray-600">Miktar</th>
                          <th className="p-2 border-b text-gray-600">Fiyat</th>
                          <th className="p-2 border-b text-gray-600 text-right">
                            Toplam
                          </th>
                          {selectedTicket.status !==
                            ServiceTicketStatus.COMPLETED && (
                            <th className="p-2 border-b w-10"></th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTicket.materialsUsed.map((m, i) => (
                          <tr
                            key={i}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="p-2">{m.productName}</td>
                            <td className="p-2">{m.quantity}</td>
                            <td className="p-2">
                              {m.unitPrice.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              ₺
                            </td>
                            <td className="p-2 text-right font-medium">
                              {(m.quantity * m.unitPrice).toLocaleString(
                                "tr-TR",
                                { minimumFractionDigits: 2 },
                              )}{" "}
                              ₺
                            </td>
                            {selectedTicket.status !==
                              ServiceTicketStatus.COMPLETED && (
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => removeMaterial(i)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {selectedTicket.materialsUsed.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-4 text-center text-gray-500"
                            >
                              Henüz malzeme eklenmedi.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div className="mt-2 flex-1">
                  <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">
                    Yapılan İşlemler / Çözüm Detayları
                  </h4>
                  {selectedTicket.status !== ServiceTicketStatus.COMPLETED &&
                  selectedTicket.status !== ServiceTicketStatus.CANCELLED ? (
                    <textarea
                      className="w-full h-full min-h-[120px] p-3 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 text-sm resize-y"
                      placeholder="Yapılan işlemleri, kullanılan yöntemleri detaylıca açıklayınız..."
                      value={selectedTicket.resolutionNotes || ""}
                      onChange={(e) => {
                        const updated = {
                          ...selectedTicket,
                          resolutionNotes: e.target.value,
                        };
                        store.setServiceTickets(
                          serviceTickets.map((t) =>
                            t.id === selectedTicket.id ? updated : t,
                          ),
                        );
                        setSelectedTicket(updated);
                      }}
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">
                      {selectedTicket.resolutionNotes || (
                        <span className="text-gray-400 italic">
                          Açıklama girilmemiş.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Labor and Totals */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 mt-auto">
                  <div>
                    {selectedTicket.status !== ServiceTicketStatus.COMPLETED &&
                    selectedTicket.status !== ServiceTicketStatus.CANCELLED ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          İşçilik Ücreti
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500"
                          value={
                            selectedTicket.laborFee === 0
                              ? ""
                              : selectedTicket.laborFee
                          }
                          onChange={(e) => {
                            const fee = Number(e.target.value);
                            const materialsTotal =
                              selectedTicket.materialsUsed.reduce(
                                (acc, m) => acc + m.quantity * m.unitPrice,
                                0,
                              );
                            const subtotal = materialsTotal + fee;
                            const newTotal =
                              subtotal +
                              subtotal * (selectedTicket.taxRate / 100);
                            const updated = {
                              ...selectedTicket,
                              laborFee: fee,
                              totalCost: newTotal,
                            };
                            store.setServiceTickets(
                              serviceTickets.map((t) =>
                                t.id === selectedTicket.id ? updated : t,
                              ),
                            );
                            setSelectedTicket(updated);
                          }}
                          placeholder="0.00"
                        />
                      </>
                    ) : (
                      <div>
                        <p className="text-gray-500 text-sm">İşçilik Ücreti</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.laborFee.toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-emerald-800 font-medium">
                        Ara Toplam:
                      </span>
                      <span className="text-sm font-medium text-emerald-900">
                        {(() => {
                          const sub =
                            selectedTicket.materialsUsed.reduce(
                              (acc, m) => acc + m.quantity * m.unitPrice,
                              0,
                            ) + (selectedTicket.laborFee || 0);
                          return (
                            sub.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            }) + " ₺"
                          );
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-emerald-800 font-medium">
                        KDV (%{selectedTicket.taxRate || 20}):
                      </span>
                      <span className="text-sm font-medium text-emerald-900">
                        {(() => {
                          const sub =
                            selectedTicket.materialsUsed.reduce(
                              (acc, m) => acc + m.quantity * m.unitPrice,
                              0,
                            ) + (selectedTicket.laborFee || 0);
                          const tax =
                            sub * ((selectedTicket.taxRate || 20) / 100);
                          return (
                            tax.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            }) + " ₺"
                          );
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60">
                      <span className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
                        Genel Toplam
                      </span>
                      <span className="text-2xl font-bold text-emerald-900">
                        {selectedTicket.totalCost.toLocaleString("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {selectedTicket.status !== ServiceTicketStatus.COMPLETED &&
                  selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 bg-white p-2 px-3 border border-gray-200 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={(e) => setIsPaid(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Peşin Tahsil Edildi
                    </label>
                  )}
                {selectedTicket.status !== ServiceTicketStatus.COMPLETED &&
                selectedTicket.status !== ServiceTicketStatus.CANCELLED ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Periyodik Bakım (Ay):
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-20 p-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-emerald-500"
                      placeholder="Örn: 6"
                      value={maintenancePeriod}
                      onChange={(e) =>
                        setMaintenancePeriod(Number(e.target.value) || "")
                      }
                    />
                  </div>
                ) : selectedTicket.maintenancePeriodMonths ? (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Sonraki Bakım: </span>
                    {new Date(
                      selectedTicket.nextMaintenanceDate!,
                    ).toLocaleDateString("tr-TR")}{" "}
                    ({selectedTicket.maintenancePeriodMonths} Ay Sonra)
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Kapat
                </button>
                {selectedTicket.status !== ServiceTicketStatus.COMPLETED &&
                  selectedTicket.status !== ServiceTicketStatus.CANCELLED && (
                    <>
                      <button
                        onClick={() => {
                          const updated = {
                            ...selectedTicket,
                            status: ServiceTicketStatus.IN_PROGRESS,
                          };
                          store.setServiceTickets(
                            serviceTickets.map((t) =>
                              t.id === updated.id ? updated : t,
                            ),
                          );
                          setSelectedTicket(updated);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${selectedTicket.status === ServiceTicketStatus.IN_PROGRESS ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-700 hover:bg-blue-100"}`}
                      >
                        İşleme Al
                      </button>
                      <button
                        onClick={completeTicket}
                        disabled={
                          selectedTicket.maintenancePeriodMonths
                            ? !maintenancePeriod ||
                              selectedTicket.plumbingChecklist?.some(
                                (item) => !item.isChecked,
                              ) ||
                              false
                            : false
                        }
                        title={
                          selectedTicket.maintenancePeriodMonths &&
                          (!maintenancePeriod ||
                            selectedTicket.plumbingChecklist?.some(
                              (item) => !item.isChecked,
                            ))
                            ? "Lütfen tüm bakım maddelerini işaretleyin ve Periyodik Bakım Süresi'ni giriniz."
                            : ""
                        }
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                      >
                        <CheckCircle size={20} />
                        Formu Tamamla
                      </button>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isQRModalOpen && selectedTicket && (
        <div
          className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-[60] animate-fade-in"
          onClick={() => setIsQRModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <QrCode className="text-emerald-600" />
                Bakım Formu QR Code
              </h3>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-white">
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/ticket/${selectedTicket.id}`}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-gray-500 text-center font-medium">
                Müşteri bu kodu taratarak <br /> bakım formuna erişebilir.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
