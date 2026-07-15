import fs from 'fs';
const f = 'pages/Personel.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import React, { useState } from 'react';",
  "import React, { useState } from 'react';\nimport { usePersistentState } from '../lib/use-persistent-state';"
);

txt = txt.replace(
  "const [formData, setFormData] = useState<Personnel>(INITIAL_FORM);",
  "const [formData, setFormData] = usePersistentState<Personnel>('personel_formData', INITIAL_FORM);"
);

txt = txt.replace(
  "const [recordFormData, setRecordFormData] =\n    useState<PersonnelRecord>(INITIAL_RECORD);",
  "const [recordFormData, setRecordFormData] = usePersistentState<PersonnelRecord>('personel_recordFormData', INITIAL_RECORD);"
);
txt = txt.replace(
  "const [recordFormData, setRecordFormData] = useState<PersonnelRecord>(INITIAL_RECORD);",
  "const [recordFormData, setRecordFormData] = usePersistentState<PersonnelRecord>('personel_recordFormData', INITIAL_RECORD);"
);
// wait, the line break might have matched, let's do generic replace
txt = txt.replace(/useState<PersonnelRecord>\(INITIAL_RECORD\);/g, "usePersistentState<PersonnelRecord>('personel_recordFormData', INITIAL_RECORD);");

fs.writeFileSync(f, txt);
