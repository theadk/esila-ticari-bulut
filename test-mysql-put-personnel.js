import http from 'http';
const updatePersonnel = {
  "id": "PER-1002-OAL2",
  "firstName": "Ahmet Updated",
  "lastName": "Durko",
  "tcNo": "",
  "birthDate": "",
  "gender": "Erkek",
  "bloodType": "",
  "phone": "",
  "email": "",
  "address": "",
  "emergencyContactName": "",
  "emergencyContactPhone": "",
  "department": "",
  "position": "",
  "startDate": "2026-07-15",
  "endDate": "",
  "employmentStatus": "Aktif",
  "salary": 0,
  "iban": "",
  "socialSecurityNo": "",
  "branch": "Main",
  "records": []
};

const req = http.request('http://localhost:3000/api/personnel/PER-1002-OAL2', {
  method: 'PUT',
  headers: {
    'x-tenant-id': '5770426720',
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('PUT personnel:', res.statusCode, data));
});
req.write(JSON.stringify(updatePersonnel));
req.end();
