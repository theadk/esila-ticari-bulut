const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

const targetStr = `
                <div className="mb-6 grid grid-cols-2 gap-4 print:hidden">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Müşteri</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Durum</p>
                    <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border \${getStatusColor(selectedOrder.status)}\`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
`;

const newStr = `
                <div className="mb-6 print:hidden">
                  <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl mb-4">
                    <div className="flex justify-between items-center mb-5">
                      <p className="text-sm font-semibold text-gray-800">Sipariş Durumu</p>
                      <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border \${getStatusColor(selectedOrder.status)}\`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    {selectedOrder.status === OrderStatus.CANCELLED ? (
                      <div className="flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-lg font-medium border border-red-100">
                        <X className="w-5 h-5 mr-2" /> Sipariş İptal Edildi
                      </div>
                    ) : (
                      <div className="relative pt-2">
                        <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-gray-100">
                          <div style={{ width: 
                            selectedOrder.status === OrderStatus.PENDING ? '25%' :
                            selectedOrder.status === OrderStatus.PREPARED ? '50%' :
                            selectedOrder.status === OrderStatus.SHIPPED ? '75%' :
                            selectedOrder.status === OrderStatus.COMPLETED ? '100%' : '0%'
                           }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-400 px-1">
                          <div className={\`flex flex-col items-center gap-1 \${selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.PREPARED || selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.COMPLETED ? 'text-blue-600' : ''}\`}>
                             <span className="w-2 h-2 rounded-full bg-current hidden sm:block"></span>
                             <span>Bekliyor</span>
                          </div>
                          <div className={\`flex flex-col items-center gap-1 \${selectedOrder.status === OrderStatus.PREPARED || selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.COMPLETED ? 'text-blue-600' : ''}\`}>
                             <span className="w-2 h-2 rounded-full bg-current hidden sm:block"></span>
                             <span>Hazır</span>
                          </div>
                          <div className={\`flex flex-col items-center gap-1 \${selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.COMPLETED ? 'text-blue-600' : ''}\`}>
                             <span className="w-2 h-2 rounded-full bg-current hidden sm:block"></span>
                             <span>Kargolandı</span>
                          </div>
                          <div className={\`flex flex-col items-center gap-1 \${selectedOrder.status === OrderStatus.COMPLETED ? 'text-blue-600' : ''}\`}>
                             <span className="w-2 h-2 rounded-full bg-current hidden sm:block"></span>
                             <span>Tamamlandı</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Müşteri</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                    </div>
                  </div>
                </div>
`;

code = code.replace(targetStr.trim(), newStr.trim());
fs.writeFileSync('pages/Siparisler.tsx', code);
