const fs = require('fs');
let code = fs.readFileSync('src/pages/SuperAdminLogin.tsx', 'utf8');

code = code.replace(
  "const [username, setUsername] = useState('');",
  "const [username, setUsername] = useState(localStorage.getItem('esila_admin_saved_username') || '');"
);

code = code.replace(
  "if (username === 'admin' && password === 'esila2026') {",
  "if (username === 'admin' && password === 'esila2026') {\n      localStorage.setItem('esila_admin_saved_username', username);"
);

fs.writeFileSync('src/pages/SuperAdminLogin.tsx', code);
