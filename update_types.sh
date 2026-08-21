sed -i '/export interface Customer {/i export interface CustomerInstallment {\n  id: string;\n  orderId?: string;\n  amount: number;\n  dueDate: string;\n  isPaid: boolean;\n  paidDate?: string;\n  description?: string;\n}\n' types.ts
sed -i '/efaturaScenario?: string;/a\  installments?: CustomerInstallment[];' types.ts
