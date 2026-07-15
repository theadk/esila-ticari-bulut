import fs from 'fs';
const f = 'pages/Siparisler.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import React, { useState, useMemo } from 'react';",
  "import React, { useState, useMemo } from 'react';\nimport { usePersistentState } from '../lib/use-persistent-state';"
);

txt = txt.replace(
  /const \[customerInfo, setCustomerInfo\] = useState\(\{/g,
  "const [customerInfo, setCustomerInfo] = usePersistentState('siparis_customerInfo', {"
);

txt = txt.replace(
  /const \[cartItems, setCartItems\] = useState<OrderItem\[\]>\(\[\]\);/g,
  "const [cartItems, setCartItems] = usePersistentState<OrderItem[]>('siparis_cartItems', []);"
);

txt = txt.replace(
  /const \[notes, setNotes\] = useState\(''\);/g,
  "const [notes, setNotes] = usePersistentState('siparis_notes', '');"
);

fs.writeFileSync(f, txt);
