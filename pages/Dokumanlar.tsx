import React, { useState, useRef } from 'react';
import { 
  Folder, FileText, UploadCloud, Search, Filter, 
  MoreVertical, Download, Trash2, Edit2, Plus, 
  Tag as TagIcon, X, Check, FileCheck, FileArchive, File, Share2, Mail
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Document } from '../types';
import toast from 'react-hot-toast';
import { hasPermission } from '../lib/permissions';

export const Dokumanlar: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'dokumanlar', 'view');
  const canCreate = hasPermission(currentUser, 'dokumanlar', 'create');
  const canEdit = hasPermission(currentUser, 'dokumanlar', 'edit');
  const canDelete = hasPermission(currentUser, 'dokumanlar', 'delete');

  const { documents, setDocuments } = store;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tümü');
  const [tagFilter, setTagFilter] = useState<string>('Tümü');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Document>>({
    name: '',
    category: 'Diğer',
    tags: []
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');

  if (!canView) return <div className="p-8 text-center text-red-600">Bu sayfayı görüntüleme yetkiniz yok.</div>;

  const categories = ['Tümü', 'Fatura', 'Teklif', 'İrsaliye', 'Sözleşme', 'Diğer'];
  
  // Extract all unique tags
  const allTags = Array.from(new Set(documents.flatMap(d => d.tags || [])));

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Tümü' || doc.category === categoryFilter;
    const matchesTag = tagFilter === 'Tümü' || (doc.tags && doc.tags.includes(tagFilter));
    return matchesSearch && matchesCategory && matchesTag;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }
    
    if (!formData.name) {
      toast.error('Lütfen dosya adını girin');
      return;
    }

    const newDoc: Document = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category as any,
      tags: formData.tags || [],
      uploadDate: new Date().toISOString(),
      size: selectedFile.size,
      type: selectedFile.type,
      uploadedBy: currentUser?.name || 'Bilinmeyen Kullanıcı'
    };

    setDocuments([...documents, newDoc]);
    toast.success('Döküman başarıyla yüklendi');
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setFormData({ name: '', category: 'Diğer', tags: [] });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu dökümanı silmek istediğinizden emin misiniz?')) {
      setDocuments(documents.filter(d => d.id !== id));
      toast.success('Döküman silindi');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !(formData.tags || []).includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fatura': return <FileCheck className="text-blue-500" />;
      case 'Teklif': return <FileText className="text-emerald-500" />;
      case 'İrsaliye': return <FileArchive className="text-orange-500" />;
      case 'Sözleşme': return <FileCheck className="text-purple-500" />;
      default: return <File className="text-gray-500" />;
    }
  };

  return (
    <div className="animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Folder className="text-blue-600" />
            Döküman Yönetimi
          </h2>
          <p className="text-sm text-gray-500 mt-1">Fatura, teklif, sözleşme ve diğer belgelerinizi dijital olarak saklayın.</p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UploadCloud size={18} />
            Döküman Yükle
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Dökümanlarda ara..."
              value={searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter || ""}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map(c => <option key={c} value={c || ""}>{c}</option>)}
            </select>
            
            <select
              value={tagFilter || ""}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Tümü">Tüm Etiketler</option>
              {allTags.map(t => <option key={t} value={t || ""}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Dosya Adı</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Etiketler</th>
                <th className="px-6 py-3">Boyut</th>
                <th className="px-6 py-3">Yüklenme Tarihi</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(doc.category)}
                        <div>
                          <p className="font-medium text-gray-800">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(doc.uploadDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          title="WhatsApp İle Gönder"
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          onClick={() => {
                            const message = encodeURIComponent(`Merhaba, ${doc.name} adlı belgeyi sizinle paylaşıyorum.`);
                            window.open(`https://wa.me/?text=${message}`, '_blank');
                          }}
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          title="E-Posta İle Gönder"
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => {
                            const subject = encodeURIComponent(`${doc.name} Belgesi`);
                            const body = encodeURIComponent(`Ekte ${doc.name} adlı belgeyi bulabilirsiniz.`);
                            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                          }}
                        >
                          <Mail size={18} />
                        </button>
                        <button 
                          title="İndir"
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => {
                            if (doc.url) {
                              window.open(doc.url, '_blank');
                            } else {
                              toast.success('İndirme simülasyonu başlatıldı');
                            }
                          }}
                        >
                          <Download size={18} />
                        </button>
                        {canDelete && (
                          <button 
                            title="Sil"
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Henüz döküman yüklenmemiş veya arama kriterlerine uyan döküman bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Döküman Yükle</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Seçin</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <UploadCloud size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">
                    {selectedFile ? selectedFile.name : 'Dosya seçmek için tıklayın'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, Excel, Word veya Resim dosyaları</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Döküman Adı / Açıklama</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Örn: Ekim Ayı Faturası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.category || ""}
                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Fatura">Fatura</option>
                  <option value="Teklif">Teklif</option>
                  <option value="İrsaliye">İrsaliye</option>
                  <option value="Sözleşme">Sözleşme</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag || ""}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Etiket yazıp Ekle'ye basın"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({...prev, tags: prev.tags?.filter(t => t !== tag)}))}
                        className="hover:text-blue-900"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
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
