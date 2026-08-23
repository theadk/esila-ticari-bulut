const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

if (!code.includes('payrollApprovals')) {
  code = code.replace(
    'proposals, reminderNotes, setReminderNotes } = useAppStore();',
    'proposals, reminderNotes, setReminderNotes, payrollApprovals, notifications, setNotifications, users } = useAppStore();'
  );
  
  const payrollEffect = `
  useEffect(() => {
    const currentUserId = localStorage.getItem('esila_user_id');
    const currentUser = users.find(u => u.id === currentUserId);
    if (currentUser?.role !== 'Admin') return;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.toISOString().substring(0, 7);
    
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().substring(0, 7);

    const checkAndNotify = (month, message, idSuffix) => {
      const isApproved = payrollApprovals?.some(a => a.month === month && a.status === 'Onaylandı');
      if (!isApproved) {
        const notifId = \`payroll-rem-\${month}-\${idSuffix}\`;
        const exists = notifications?.some(n => n.id === notifId);
        if (!exists) {
          setNotifications(prev => [...(prev || []), {
            id: notifId,
            userId: currentUserId,
            title: 'Maaş Bordrosu Onayı',
            message,
            isRead: false,
            createdAt: new Date().toISOString(),
            type: 'warning',
            link: '/personel'
          }]);
        }
      }
    };

    if (currentDay >= 25) {
      checkAndNotify(currentMonth, \`\${currentMonth} dönemi maaş ödeme günleri yaklaşıyor. Lütfen bordroları kontrol edip onaylayın.\`, 'upcoming');
    }

    if (currentDay <= 15) { 
      checkAndNotify(prevMonth, \`\${prevMonth} dönemine ait maaş bordroları henüz onaylanmadı! Lütfen onay işlemini tamamlayın.\`, 'overdue');
    }
  }, [payrollApprovals, notifications, setNotifications, users]);
  `;

  code = code.replace(
    'const [products, setProducts] = useState<Product[]>([]);',
    'const [products, setProducts] = useState<Product[]>([]);\n' + payrollEffect
  );

  fs.writeFileSync('pages/Dashboard.tsx', code);
  console.log('Patched Dashboard.tsx with payroll reminders');
} else {
  console.log('Dashboard.tsx already has payrollApprovals');
}
