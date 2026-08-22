const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// 1. Add state and handler
const stateStr = `  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);`;
const newStateStr = `  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newInternalNote, setNewInternalNote] = useState('');
  
  const handleAddInternalNote = () => {
    if (!newInternalNote.trim() || !selectedOrder) return;
    
    const note = {
      id: crypto.randomUUID(),
      text: newInternalNote.trim(),
      date: new Date().toISOString()
    };
    
    const updatedOrder = {
      ...selectedOrder,
      internalNotes: [...(selectedOrder.internalNotes || []), note]
    };
    
    setSelectedOrder(updatedOrder);
    store.setOrders((prev: Order[]) => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
    
    setNewInternalNote('');
    toast.success('Dahili not eklendi');
  };`;

code = code.replace(stateStr, newStateStr);

// 2. Add UI in the modal
const uiStr = `                {selectedOrder.notes && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Sipariş Notu:</p>
                    <p className="text-sm text-amber-900">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>`;

const newUiStr = `                {selectedOrder.notes && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Sipariş Notu:</p>
                    <p className="text-sm text-amber-900">{selectedOrder.notes}</p>
                  </div>
                )}
                
                {/* Dahili Notlar */}
                <div className="mt-8 border-t border-gray-100 pt-6 print:hidden">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Dahili Yorumlar / Notlar
                  </h4>
                  
                  <div className="space-y-3 mb-4">
                    {(!selectedOrder.internalNotes || selectedOrder.internalNotes.length === 0) ? (
                      <p className="text-xs text-gray-500 italic">Henüz not eklenmemiş.</p>
                    ) : (
                      selectedOrder.internalNotes.map(note => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-medium text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">
                              {new Date(note.date).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newInternalNote}
                      onChange={(e) => setNewInternalNote(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') handleAddInternalNote(); }}
                      placeholder="Sipariş için dahili not yazın..."
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button 
                      onClick={handleAddInternalNote}
                      disabled={!newInternalNote.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>`;

code = code.replace(uiStr, newUiStr);
fs.writeFileSync('pages/Siparisler.tsx', code);
