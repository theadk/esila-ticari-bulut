import React, { useState } from "react";
import { useAppStore } from "../lib/store";
import { hasPermission } from "../lib/permissions";
import {
  Users,
  Filter,
  Plus,
  FileText,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Tag,
  Percent,
  X,
  Save,
  Edit2,
  Trash2,
} from "lucide-react";
import { Customer, MeetingNote, Campaign } from "../types";

export const CRM: React.FC = () => {
  const store = useAppStore();
  const { customers, meetingNotes, campaigns, setCampaigns } = store;

  const currentUser =
    store.users.find((u) => u.id === sessionStorage.getItem("esila_user_id")) ||
    store.users[0];
  const canView = hasPermission(currentUser, "crm", "view");

  const [activeTab, setActiveTab] = useState<"leads" | "campaigns">("leads");

  const leads = customers.filter((c) => c.isLead);

  // Basic states for UI interaction
  const [showAddLead, setShowAddLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Customer | null>(null);
  const [newMeetingNote, setNewMeetingNote] = useState<Partial<MeetingNote>>({
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [newLead, setNewLead] = useState<Partial<Customer>>({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    customerType: "Şahıs",
    type: "Alıcı",
    isLead: true,
    leadStatus: "Yeni",
  });
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    const leadToSave: Customer = {
      id: `C-${Math.random().toString(36).substr(2, 9)}`,
      name: newLead.name || "",
      companyName: newLead.companyName || "",
      phone: newLead.phone || "",
      email: newLead.email || "",
      customerType: newLead.customerType as "Şahıs" | "Tüzel",
      type: "Alıcı",
      balance: 0,
      status: "Aktif",
      address: "",
      isLead: true,
      leadStatus: "Yeni",
    };
    store.setCustomers((prev: any) => [...(prev || []), leadToSave]);
    setShowAddLead(false);
    setNewLead({
      name: "",
      companyName: "",
      phone: "",
      email: "",
      customerType: "Şahıs",
      type: "Alıcı",
      isLead: true,
      leadStatus: "Yeni",
    });
  };
  const [newCampaign, setNewCampaign] = useState<Campaign>({
    id: "",
    name: "",
    description: "",
    customerGroup: "",
    discountPercentage: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30))
      .toISOString()
      .split("T")[0],
    isActive: true,
  });

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const campaignToSave = {
      ...newCampaign,
      id: newCampaign.id || `CAMP-${Date.now()}`,
      discountPercentage: Number(newCampaign.discountPercentage),
    };

    if (newCampaign.id) {
      setCampaigns(
        campaigns.map((c) => (c.id === newCampaign.id ? campaignToSave : c)),
      );
    } else {
      setCampaigns([...campaigns, campaignToSave]);
    }
    setIsCampaignModalOpen(false);
  };

  const handleEditCampaign = (c: Campaign) => {
    setNewCampaign({
      ...c,
      startDate: new Date(c.startDate).toISOString().split("T")[0],
      endDate: new Date(c.endDate).toISOString().split("T")[0],
    });
    setIsCampaignModalOpen(true);
  };

  if (!canView) {
    return (
      <div className="p-8 text-center text-red-600">
        Bu sayfayı görüntüleme yetkiniz yok.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            CRM ve Kampanya Yönetimi
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Potansiyel müşteriler, görüşme notları ve kampanyalar.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === "leads" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} /> Potansiyel Müşteriler (Leads)
          </div>
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === "campaigns" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <div className="flex items-center gap-2">
            <Tag size={18} /> Kampanya ve İskonto
          </div>
        </button>
      </div>

      {activeTab === "leads" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Filter className="text-indigo-600" /> Lead Havuzu ve Görüşmeler
            </h3>
            <button
              onClick={() => setShowAddLead(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Yeni Lead Ekle
            </button>
          </div>

          {/* Add Lead Modal */}
          {showAddLead && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-indigo-600" />
                    Yeni Lead (Potansiyel Müşteri)
                  </h3>
                  <button
                    onClick={() => setShowAddLead(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSaveLead} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad Soyad / Yetkili{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newLead.name || ""}
                        onChange={(e) =>
                          setNewLead({ ...newLead, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ahmet Yılmaz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Firma Adı (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={newLead.companyName || ""}
                        onChange={(e) =>
                          setNewLead({
                            ...newLead,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Örn: Yılmaz Gıda Ltd."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newLead.phone || ""}
                          onChange={(e) =>
                            setNewLead({ ...newLead, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0555..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-posta
                        </label>
                        <input
                          type="email"
                          value={newLead.email || ""}
                          onChange={(e) =>
                            setNewLead({ ...newLead, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="ahmet@..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddLead(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save size={18} /> Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Lead Kanban Board Demo */}
            {["Yeni", "Görüşülüyor", "Teklif Verildi", "Kazanıldı"].map(
              (status) => (
                <div
                  key={status}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                >
                  <h4 className="font-bold text-gray-700 mb-4">{status}</h4>
                  <div className="space-y-3">
                    {leads
                      .filter((l) => l.leadStatus === status)
                      .map((lead) => {
                         const lastNote = meetingNotes.filter(n => n.customerId === lead.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                         return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-800">
                            {lead.companyName || lead.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone size={12} /> {lead.phone}
                          </p>
                          {lastNote ? (
                              <div className="mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                                Son Görüşme: {new Date(lastNote.date).toLocaleDateString('tr-TR')}
                              </div>
                          ) : (
                              <div className="mt-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                                Görüşme Yok
                              </div>
                          )}
                        </div>
                      )})}
                    {leads.filter((l) => l.leadStatus === status).length ===
                      0 && (
                      <p className="text-xs text-gray-400 italic">
                        Bu aşamada kayıt yok.
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          {selectedLead && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                 <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                   <div>
                     <h3 className="text-xl font-bold text-gray-800">{selectedLead.companyName || selectedLead.name}</h3>
                     <p className="text-sm text-gray-500">{selectedLead.phone} {selectedLead.email ? `• ${selectedLead.email}` : ''}</p>
                   </div>
                   <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                     <X size={24} />
                   </button>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <label className="font-medium text-gray-700">Aşama:</label>
                      <select
                        value={selectedLead.leadStatus || ""}
                        onChange={(e) => {
                           const updatedLead = { ...selectedLead, leadStatus: e.target.value as any };
                           store.setCustomers((prev: any) => (prev || []).map(c => c.id === selectedLead.id ? updatedLead : c));
                           setSelectedLead(updatedLead);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                         <option value="Yeni">Yeni</option>
                         <option value="Görüşülüyor">Görüşülüyor</option>
                         <option value="Teklif Verildi">Teklif Verildi</option>
                         <option value="Kazanıldı">Kazanıldı</option>
                      </select>
                    </div>

                    <div className="border-t pt-6">
                       <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Phone size={18} /> Görüşme Notları</h4>
                       
                       <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!newMeetingNote.notes) return;
                          const noteToSave: MeetingNote = {
                            id: `MN-${Date.now()}`,
                            customerId: selectedLead.id,
                            date: newMeetingNote.date || new Date().toISOString().split('T')[0],
                            notes: newMeetingNote.notes,
                            personnelId: currentUser.id
                          };
                          store.setMeetingNotes([...meetingNotes, noteToSave]);
                          setNewMeetingNote({ notes: '', date: new Date().toISOString().split('T')[0] });
                       }} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex gap-2">
                             <input type="date" required value={newMeetingNote.date || ""} onChange={e => setNewMeetingNote({...newMeetingNote, date: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                             <input type="text" required value={newMeetingNote.notes || ""} onChange={e => setNewMeetingNote({...newMeetingNote, notes: e.target.value})} placeholder="Görüşme özeti..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                             <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Ekle</button>
                          </div>
                       </form>

                       <div className="space-y-4">
                         {meetingNotes.filter(n => n.customerId === selectedLead.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(note => (
                            <div key={note.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm relative group">
                               <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{new Date(note.date).toLocaleDateString('tr-TR')}</span>
                                 <button onClick={() => {
                                    if(confirm('Bu notu silmek istediğinize emin misiniz?')) {
                                       store.setMeetingNotes(meetingNotes.filter(n => n.id !== note.id));
                                    }
                                 }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                               <p className="text-sm text-gray-700">{note.notes}</p>
                            </div>
                         ))}
                         {meetingNotes.filter(n => n.customerId === selectedLead.id).length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4">Henüz görüşme notu eklenmemiş.</p>
                         )}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {leads.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>
                Örnek data bulunamadı. Potansiyel müşteri eklendiğinde burada
                görünecektir.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Percent className="text-indigo-600" /> Aktif Kampanyalar ve
              İskontolar
            </h3>
            <button
              onClick={() => {
                setNewCampaign({
                  id: "",
                  name: "",
                  description: "",
                  customerGroup: "",
                  discountPercentage: 0,
                  startDate: new Date().toISOString().split("T")[0],
                  endDate: new Date(
                    new Date().setDate(new Date().getDate() + 30),
                  )
                    .toISOString()
                    .split("T")[0],
                  isActive: true,
                });
                setIsCampaignModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Yeni Kampanya Tanımla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative group"
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditCampaign(c)}
                    className="text-gray-400 hover:text-indigo-600 bg-white p-1 rounded-md shadow-sm border border-gray-100"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Bu kampanyayı silmek istediğinize emin misiniz?",
                        )
                      ) {
                        setCampaigns(
                          campaigns.filter((cam) => cam.id !== c.id),
                        );
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 bg-white p-1 rounded-md shadow-sm border border-gray-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-start mb-2 pr-16">
                  <h4 className="font-bold text-gray-800 text-lg">{c.name}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {c.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 h-10">
                  {c.description}
                </p>

                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold">
                    % {c.discountPercentage} İskonto
                  </div>
                  <div className="text-gray-500 flex items-center gap-1">
                    <Users size={14} /> {c.customerGroup || "Tüm Müşteriler"}
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center justify-between border-t pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Başlangıç:{" "}
                    {new Date(c.startDate).toLocaleDateString("tr-TR")}
                  </span>
                  <span className="flex items-center gap-1">
                    Bitiş: {new Date(c.endDate).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            ))}

            {campaigns.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                <Tag size={32} className="mx-auto mb-2 opacity-50" />
                <p>Tanımlanmış bir kampanya bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Tag className="text-indigo-600" />
                {newCampaign.id
                  ? "Kampanyayı Düzenle"
                  : "Yeni Kampanya Tanımla"}
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSaveCampaign}
              className="p-6 overflow-y-auto flex-1"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kampanya Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name || ""}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Örn: B2B Bahar İndirimi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    rows={2}
                    value={newCampaign.description || ""}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Kampanya detayları ve şartları..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Müşteri Grubu (Opsiyonel)
                    </label>
                    <select
                      value={newCampaign.customerGroup || ""}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          customerGroup: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Tüm Müşteriler</option>
                      <option value="B2B Bayi">B2B Bayi</option>
                      <option value="Perakende">Perakende</option>
                      <option value="Toptancı">Toptancı</option>
                      <option value="VIP">VIP Müşteriler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İskonto Oranı (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={newCampaign.discountPercentage || ""}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          discountPercentage: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Tarihi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newCampaign.startDate || ""}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Tarihi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newCampaign.endDate || ""}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newCampaign.isActive}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-800 cursor-pointer"
                  >
                    Kampanyayı Aktifleştir
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
