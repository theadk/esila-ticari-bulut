const fs = require('fs');
let code = fs.readFileSync('pages/Login.tsx', 'utf8');

code = code.replace(
  "const [username, setUsername] = useState('');",
  "const [username, setUsername] = useState(localStorage.getItem('esila_saved_username') || '');"
);

code = code.replace(
  "localStorage.setItem('esila_tenant_id', user.vkn || '1111111111');",
  "localStorage.setItem('esila_tenant_id', user.vkn || '1111111111');\n        localStorage.setItem('esila_saved_username', username);"
);

fs.writeFileSync('pages/Login.tsx', code);
