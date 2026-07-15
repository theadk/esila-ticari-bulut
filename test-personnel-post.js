import http from 'http';
const formData = {
  id: "TEST-123",
  firstName: "T", lastName: "T", tcNo: "", birthDate: "",
  gender: "Erkek", bloodType: "", phone: "", email: "", address: "",
  emergencyContactName: "", emergencyContactPhone: "", department: "",
  position: "", startDate: new Date().toISOString().split("T")[0],
  employmentStatus: "Aktif", salary: 0, iban: "", socialSecurityNo: "",
  branch: "Şube1", records: []
};

const req = http.request('http://localhost:3000/api/personnel', {
  method: 'POST',
  headers: {
    'x-tenant-id': '1111111111',
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('POST personnel:', res.statusCode, data));
});
req.write(JSON.stringify(formData));
req.end();
