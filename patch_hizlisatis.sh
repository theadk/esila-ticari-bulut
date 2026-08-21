sed -i 's/const \[showSuspendedModal, setShowSuspendedModal\] = useState(false);/const [showSuspendedModal, setShowSuspendedModal] = useState(false);\n  const [showTaksitModal, setShowTaksitModal] = useState(false);\n  const [taksitSayisi, setTaksitSayisi] = useState<number>(3);\n  const [taksitAraligi, setTaksitAraligi] = useState<number>(30);/g' pages/HizliSatis.tsx

sed -i "s/const handleCheckout = (paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Cari') => {/const handleCheckout = (paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Cari' | 'Taksit', taksitConfig?: { count: number, intervalDays: number }) => {/g" pages/HizliSatis.tsx

