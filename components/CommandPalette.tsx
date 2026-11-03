import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, Users, Package, ShoppingCart, Settings, Box, FileText, ClipboardList } from 'lucide-react';
import { useKeyboardShortcuts } from '../lib/useKeyboardShortcuts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActivePage: (page: string) => void;
}

const pages = [
  { id: 'dashboard', name: 'Panel (Dashboard)', icon: Home, shortcut: 'D' },
  { id: 'hizlisatis', name: 'Hızlı Satış (POS)', icon: ShoppingCart, shortcut: 'H' },
  { id: 'cariler', name: 'Cariler', icon: Users, shortcut: 'C' },
  { id: 'urunler', name: 'Ürünler & Stok', icon: Package, shortcut: 'U' },
  { id: 'satislar', name: 'Satışlar', icon: ShoppingCart, shortcut: 'L' },
  { id: 'siparisler', name: 'Siparişler', icon: ShoppingCart, shortcut: 'S' },
  { id: 'satinalma', name: 'Satın Alma', icon: ShoppingCart, shortcut: 'M' },
  { id: 'uretim', name: 'Üretim & Reçete (BOM)', icon: Box, shortcut: 'B' },
  { id: 'efatura', name: 'E-Fatura / E-Arşiv', icon: FileText, shortcut: 'E' },
  { id: 'depo', name: 'Depo & Transfer', icon: Box, shortcut: 'W' },
  { id: 'sayim', name: 'Stok Sayım', icon: ClipboardList, shortcut: 'K' },
  { id: 'kasa', name: 'Kasa & Banka', icon: ClipboardList, shortcut: 'F' },
  { id: 'ceksenet', name: 'Çek & Senet', icon: FileText, shortcut: 'N' },
  { id: 'personel', name: 'Personel & İK', icon: Users, shortcut: 'P' },
  { id: 'crm', name: 'CRM & Kampanya', icon: Users, shortcut: 'G' },
  { id: 'mutabakat', name: 'Mutabakat', icon: FileText, shortcut: 'O' },
  { id: 'ariza', name: 'Arıza & Teknik Servis', icon: ClipboardList, shortcut: 'Z' },
  { id: 'ajanda', name: 'Ajanda & Notlar', icon: ClipboardList, shortcut: 'J' },
  { id: 'dokumanlar', name: 'Dökümanlar & Arşiv', icon: FileText, shortcut: 'V' },
  { id: 'teklif', name: 'Teklifler', icon: FileText, shortcut: 'T' },
  { id: 'raporlar', name: 'Raporlar', icon: ClipboardList, shortcut: 'R' },
  { id: 'ayarlar', name: 'Ayarlar', icon: Settings, shortcut: 'A' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, setActivePage }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPages = pages.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useKeyboardShortcuts({
    'escape': () => {
      if (isOpen) onClose();
    },
    'arrowdown': () => {
      if (isOpen) {
        setSelectedIndex(prev => (prev + 1) % (filteredPages.length || 1));
      }
    },
    'arrowup': () => {
      if (isOpen) {
        setSelectedIndex(prev => (prev - 1 + filteredPages.length) % (filteredPages.length || 1));
      }
    },
    'enter': () => {
      if (isOpen && filteredPages[selectedIndex]) {
        setActivePage(filteredPages[selectedIndex].id);
        onClose();
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg"
            placeholder="Nereye gitmek istersiniz? (Sayfa adı yazın...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500 font-mono">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filteredPages.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>Sonuç bulunamadı.</p>
            </div>
          ) : (
            <ul>
              {filteredPages.map((page, idx) => {
                const Icon = page.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <li key={page.id}>
                    <button
                      onClick={() => {
                        setActivePage(page.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center px-4 py-3 text-left transition-colors ${isSelected ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Icon className={`mr-3 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} size={18} />
                      <span className="flex-1 font-medium">{page.name}</span>
                      {isSelected && (
                        <kbd className="px-2 py-1 bg-emerald-100 border border-emerald-200 rounded text-xs text-emerald-700 font-mono">Enter</kbd>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
