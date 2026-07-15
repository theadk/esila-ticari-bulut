import fs from 'fs';
const f = 'pages/HizliSatis.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import React, { useState, useMemo, useRef, useEffect } from 'react';",
  "import React, { useState, useMemo, useRef, useEffect } from 'react';\nimport { usePersistentState } from '../lib/use-persistent-state';"
);

txt = txt.replace(
  "const [cart, setCart] = useState<{product: Product, quantity: number, discount: number}[]>([]);",
  "const [cart, setCart] = usePersistentState<{product: Product, quantity: number, discount: number}[]>('hizlisatis_cart', []);"
);

fs.writeFileSync(f, txt);
