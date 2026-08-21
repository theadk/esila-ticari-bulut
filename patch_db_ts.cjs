const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const newMigration = `,
      {
        name: '006_add_reminder_settings',
        up: async () => {
          const alterStatements = [
            'ALTER TABLE settings ADD COLUMN reminder_3_days_before BOOLEAN DEFAULT TRUE;',
            'ALTER TABLE settings ADD COLUMN reminder_1_day_before BOOLEAN DEFAULT TRUE;',
            'ALTER TABLE settings ADD COLUMN reminder_overdue BOOLEAN DEFAULT TRUE;'
          ];
          for (const stmt of alterStatements) {
            try {
              await client.query(stmt);
            } catch (e) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 006_add_reminder_settings:', e.message, '->', stmt);
              }
            }
          }
        }
      }`;

code = code.replace("        }\n      }\n    ];", "        }\n      }" + newMigration + "\n    ];");
fs.writeFileSync('server/db.ts', code);
console.log("Patched server/db.ts");
