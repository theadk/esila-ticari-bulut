const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

// 1. Initial State
code = code.replace(
  "const [revisionForm, setRevisionForm] = useState({ category: 'all', brand: 'all', percentage: 10, type: 'increase', target: 'price' });",
  "const [revisionForm, setRevisionForm] = useState({ category: 'all', brand: 'all', value: 10, type: 'increase', target: 'price', method: 'percentage' });"
);

// 2. Logic replacement
code = code.replace(
  "    if (!revisionForm.percentage || Number(revisionForm.percentage) <= 0) {\n      alert(\"Geçerli bir yüzde giriniz.\");",
  "    if (!revisionForm.value || Number(revisionForm.value) <= 0) {\n      alert(\"Geçerli bir değer giriniz.\");"
);

const oldLogic = `      const multiplier = revisionForm.type === 'increase' 
          ? 1 + (Number(revisionForm.percentage) / 100) 
          : 1 - (Number(revisionForm.percentage) / 100);

      const promises = targetProducts.map(p => {
         const currentVal = Number(p[revisionForm.target as keyof Product] || 0);
         const newVal = currentVal * multiplier;
         return api.updateProduct(p.id, { ...p, [revisionForm.target]: parseFloat(newVal.toFixed(2)) });
      });`;

const newLogic = `      const promises = targetProducts.map(p => {
         const currentVal = Number(p[revisionForm.target as keyof Product] || 0);
         let newVal = currentVal;
         if (revisionForm.method === 'percentage') {
           const multiplier = revisionForm.type === 'increase' 
               ? 1 + (Number(revisionForm.value) / 100) 
               : 1 - (Number(revisionForm.value) / 100);
           newVal = currentVal * multiplier;
         } else {
           newVal = revisionForm.type === 'increase' 
               ? currentVal + Number(revisionForm.value)
               : currentVal - Number(revisionForm.value);
           if (newVal < 0) newVal = 0;
         }
         return api.updateProduct(p.id, { ...p, [revisionForm.target]: parseFloat(newVal.toFixed(2)) });
      });`;

code = code.replace(oldLogic, newLogic);

// 3. UI Replacement
const oldUI = `              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Yönü</label>
                   <select 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                     value={revisionForm.type}
                     onChange={e => setRevisionForm({...revisionForm, type: e.target.value})}
                     disabled={isRevisionLoading}
                   >
                     <option value="increase">Artış (+)</option>
                     <option value="decrease">İndirim (-)</option>
                   </select>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Yüzde (%)</label>
                   <input 
                     type="number"
                     min="0.1"
                     step="0.1"
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                     value={revisionForm.percentage}
                     onChange={e => setRevisionForm({...revisionForm, percentage: Number(e.target.value)})}
                     disabled={isRevisionLoading}
                   />
                 </div>
              </div>`;

const newUI = `              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Hesaplama Tipi</label>
                   <select 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                     value={revisionForm.method}
                     onChange={e => setRevisionForm({...revisionForm, method: e.target.value})}
                     disabled={isRevisionLoading}
                   >
                     <option value="percentage">Yüzde (%)</option>
                     <option value="fixed">Tutar (₺)</option>
                   </select>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Yönü</label>
                   <select 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                     value={revisionForm.type}
                     onChange={e => setRevisionForm({...revisionForm, type: e.target.value})}
                     disabled={isRevisionLoading}
                   >
                     <option value="increase">Artış (+)</option>
                     <option value="decrease">İndirim (-)</option>
                   </select>
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{revisionForm.method === 'percentage' ? 'Yüzde (%)' : 'Tutar (₺)'}</label>
                 <input 
                   type="number"
                   min="0.1"
                   step="0.1"
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                   value={revisionForm.value}
                   onChange={e => setRevisionForm({...revisionForm, value: Number(e.target.value)})}
                   disabled={isRevisionLoading}
                 />
              </div>`;

code = code.replace(oldUI, newUI);

fs.writeFileSync('pages/Urunler.tsx', code);
