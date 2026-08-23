const fs = require('fs');
let code = fs.readFileSync('components/EmployeePortal.tsx', 'utf8');

const warningDiv = `
                {myRecord.advanceLimit > 0 && Number(amount) > myRecord.advanceLimit && (
                  <p className="text-sm text-red-600 mt-2">
                    Uyarı: Talep ettiğiniz tutar aylık avans limitinizi ({(myRecord.advanceLimit || 0).toLocaleString('tr-TR')} ₺) aşmaktadır. Yönetici onayına gönderilecektir ancak limit aşımı bildirilecektir.
                  </p>
                )}
`;

code = code.replace(
  'placeholder="0.00"\n                />\n              </div>',
  `placeholder="0.00"\n                />\n${warningDiv}              </div>`
);

fs.writeFileSync('components/EmployeePortal.tsx', code);
console.log('patched EmployeePortal.tsx');
