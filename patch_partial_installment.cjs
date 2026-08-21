const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const oldCode = `          if (paymentForm.installmentIds && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              paymentForm.installmentIds.includes(inst.id) ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          } else if (paymentForm.installmentId && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          }`;

const newCode = `          if (paymentForm.installmentIds && updatedInstallments) {
            const totalTargetAmount = updatedInstallments
              .filter((inst: any) => paymentForm.installmentIds.includes(inst.id))
              .reduce((sum: number, inst: any) => sum + inst.amount, 0);

            if (paymentForm.amount < totalTargetAmount) {
              let remainingPayment = paymentForm.amount;
              const newInstallmentsToAdd: any[] = [];

              updatedInstallments = updatedInstallments.map((inst: any) => {
                if (paymentForm.installmentIds.includes(inst.id)) {
                   if (remainingPayment >= inst.amount) {
                      remainingPayment -= inst.amount;
                      return { ...inst, isPaid: true, paidDate: new Date().toISOString() };
                   } else if (remainingPayment > 0) {
                      const paidAmount = remainingPayment;
                      const leftover = inst.amount - paidAmount;
                      remainingPayment = 0;
                      
                      newInstallmentsToAdd.push({
                        ...inst,
                        id: Math.random().toString(36).substr(2, 9),
                        amount: leftover,
                        description: inst.description + ' (Kalan)',
                        isPaid: false,
                        paidDate: undefined
                      });

                      return { ...inst, amount: paidAmount, isPaid: true, paidDate: new Date().toISOString() };
                   } else {
                      return inst;
                   }
                }
                return inst;
              });

              if (newInstallmentsToAdd.length > 0) {
                 updatedInstallments.push(...newInstallmentsToAdd);
                 updatedInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
              }
            } else {
              updatedInstallments = updatedInstallments.map((inst: any) => 
                paymentForm.installmentIds.includes(inst.id) ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
              );
            }
          } else if (paymentForm.installmentId && updatedInstallments) {
            const targetInst = updatedInstallments.find((i: any) => i.id === paymentForm.installmentId);
            if (targetInst && paymentForm.amount < targetInst.amount) {
              const paidAmount = paymentForm.amount;
              const remainingAmount = targetInst.amount - paidAmount;
              
              updatedInstallments = updatedInstallments.map((inst: any) => 
                inst.id === paymentForm.installmentId ? { ...inst, amount: paidAmount, isPaid: true, paidDate: new Date().toISOString() } : inst
              );
              
              updatedInstallments.push({
                ...targetInst,
                id: Math.random().toString(36).substr(2, 9),
                amount: remainingAmount,
                description: targetInst.description + ' (Kalan)',
                isPaid: false,
                paidDate: undefined
              });
              
              updatedInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            } else {
              updatedInstallments = updatedInstallments.map((inst: any) => 
                inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
              );
            }
          }`;

if (code.includes(oldCode)) {
  fs.writeFileSync('pages/Cariler.tsx', code.replace(oldCode, newCode));
  console.log("Success");
} else {
  console.log("Code not found");
}
