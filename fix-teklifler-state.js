import fs from 'fs';
const f = 'pages/Teklifler.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import React, { useState, useEffect, useMemo } from 'react';",
  "import React, { useState, useEffect, useMemo } from 'react';\nimport { usePersistentState } from '../lib/use-persistent-state';"
);

txt = txt.replace(
  "const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);",
  "const [selectedCustomer, setSelectedCustomer] = usePersistentState<Customer | null>('teklif_selectedCustomer', null);"
);

txt = txt.replace(
  "const [cartItems, setCartItems] = useState<ProposalItem[]>([]);",
  "const [cartItems, setCartItems] = usePersistentState<ProposalItem[]>('teklif_cartItems', []);"
);

txt = txt.replace(
  "const [notes, setNotes] = useState<string>('');",
  "const [notes, setNotes] = usePersistentState<string>('teklif_notes', '');"
);

txt = txt.replace(
  "const [validDays, setValidDays] = useState<number>(15);",
  "const [validDays, setValidDays] = usePersistentState<number>('teklif_validDays', 15);"
);

fs.writeFileSync(f, txt);
