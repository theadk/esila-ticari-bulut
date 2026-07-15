import { readFileSync } from 'fs';
const sip = readFileSync('pages/Siparisler.tsx', 'utf8');
const fetchIndex = sip.indexOf('fetchOrders');
if (fetchIndex !== -1) {
    console.log(sip.substring(fetchIndex - 100, fetchIndex + 400));
} else {
    console.log('no fetchOrders found');
}
