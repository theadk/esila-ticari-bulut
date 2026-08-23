const fs = require('fs');
let code = fs.readFileSync('pages/Mutabakat.tsx', 'utf8');

if (!code.includes('return (\n    <>\n      <div className="space-y-6">')) {
  code = code.replace(
    'return (\n    <div className="space-y-6">',
    'return (\n    <>\n      <div className="space-y-6">'
  );
  
  if (code.endsWith('    </div>\n  );\n};\n')) {
    code = code.replace(
      '    </div>\n  );\n};\n',
      '    </div>\n    </>\n  );\n};\n'
    );
  } else {
    // If it ends differently
    code = code.replace(
      '    </div>\n  );\n};',
      '    </div>\n    </>\n  );\n};'
    );
  }

  fs.writeFileSync('pages/Mutabakat.tsx', code);
}
console.log('Fixed mutabakat root');
