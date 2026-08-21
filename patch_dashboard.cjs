const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

// 1. Update installmentStats to include cashFlowData
const oldStats = `    return {
       overdueCount, overdueTotal,
       upcomingCount, upcomingTotal,
       paidCount, paidTotal
    };`;
const newStats = `    let week1 = 0; let week2 = 0; let week3 = 0; let week4 = 0;
    const todayNum = today.getTime();
    
    customers?.forEach(c => {
      if (c.installments) {
        c.installments.forEach(inst => {
          const dueDate = new Date(inst.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          if (!inst.isPaid && dueDate >= today && dueDate <= thirtyDaysFromNow) {
            const diffTime = dueDate.getTime() - todayNum;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) week1 += inst.amount;
            else if (diffDays <= 14) week2 += inst.amount;
            else if (diffDays <= 21) week3 += inst.amount;
            else week4 += inst.amount;
          }
        });
      }
    });

    const cashFlowData = [
       { name: '1-7 Gün', Beklenen: week1 },
       { name: '8-14 Gün', Beklenen: week2 },
       { name: '15-21 Gün', Beklenen: week3 },
       { name: '22-30 Gün', Beklenen: week4 }
    ];

    return {
       overdueCount, overdueTotal,
       upcomingCount, upcomingTotal,
       paidCount, paidTotal,
       cashFlowData
    };`;
code = code.replace(oldStats, newStats);

// 2. Remove chart_installments from renderStatCard
const oldChartInstallments = `      case 'chart_installments': return (
        <SortableItem key={id} id={id} isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Clock className="text-indigo-600" size={20} />
              Taksit Takip Panosu
            </h3>
            <div className="flex-1 flex flex-col justify-center gap-3">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-red-600 font-medium">Geciken ({installmentStats.overdueCount})</p>
                  <p className="text-xl font-bold text-red-700">{installmentStats.overdueTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                </div>
                <AlertCircle className="text-red-400" size={32} />
              </div>
              
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Yaklaşan (30 Gün) ({installmentStats.upcomingCount})</p>
                  <p className="text-xl font-bold text-orange-700">{installmentStats.upcomingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                </div>
                <Calendar className="text-orange-400" size={32} />
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Tahsil Edilen ({installmentStats.paidCount})</p>
                  <p className="text-xl font-bold text-emerald-700">{installmentStats.paidTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                </div>
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
            </div>
          </div>
        </SortableItem>
      );`;
code = code.replace(oldChartInstallments, "");

// 3. Add to renderChartCard
const newChartInstallments = `      case 'chart_installments': return (
        <SortableItem key={id} id={id} className="lg:col-span-3" isEditMode={isEditMode}>
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Clock className="text-indigo-600" size={20} />
              Taksit Takip Panosu (Gelecek 30 Günlük Vade Analizi)
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sol Taraf: Özet Kartları */}
              <div className="flex-none w-full lg:w-1/3 flex flex-col gap-3 justify-center">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Geciken ({installmentStats.overdueCount})</p>
                    <p className="text-xl font-bold text-red-700">{installmentStats.overdueTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                  </div>
                  <AlertCircle className="text-red-400" size={32} />
                </div>
                
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Yaklaşan (30 Gün) ({installmentStats.upcomingCount})</p>
                    <p className="text-xl font-bold text-orange-700">{installmentStats.upcomingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                  </div>
                  <Calendar className="text-orange-400" size={32} />
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Tahsil Edilen ({installmentStats.paidCount})</p>
                    <p className="text-xl font-bold text-emerald-700">{installmentStats.paidTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                  </div>
                  <CheckCircle className="text-emerald-400" size={32} />
                </div>
              </div>
              
              {/* Sağ Taraf: Nakit Akışı Grafiği */}
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={installmentStats.cashFlowData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    />
                    <Bar dataKey="Beklenen" name="Beklenen Tahsilat" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SortableItem>
      );`;

const chartCardEndIdx = code.indexOf("const renderChartCard = (id: string) => {\n    switch(id) {\n");
if (chartCardEndIdx !== -1) {
    const insertIdx = chartCardEndIdx + "const renderChartCard = (id: string) => {\n    switch(id) {\n".length;
    code = code.substring(0, insertIdx) + newChartInstallments + '\n' + code.substring(insertIdx);
} else {
    console.error("Could not find renderChartCard start.");
}

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log("Patched chart_installments into renderChartCard with BarChart");
