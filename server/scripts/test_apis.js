import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const ADMIN_ID = '69eb6048b30237feb534f94c';
const BASE_URL = 'http://localhost:3001';

async function testAPIs() {
  const token = jwt.sign({ _id: ADMIN_ID, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    { name: 'Auth /me', path: '/api/auth/me', method: 'GET' },
    { name: 'Listings (Public)', path: '/api/listings', method: 'GET', noAuth: true },
    { name: 'Admin Stats', path: '/api/admin/stats', method: 'GET' },
    { name: 'Admin Pending', path: '/api/admin/pending', method: 'GET' },
    { name: 'Admin Listings', path: '/api/admin/listings', method: 'GET' },
    { name: 'Admin Users', path: '/api/admin/users', method: 'GET' },
    { name: 'Admin Payouts', path: '/api/admin/payouts', method: 'GET' },
    { name: 'Admin Activity', path: '/api/admin/activity', method: 'GET' }
  ];

  console.log('🧪 Starting API Health Check...\n');

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: ep.noAuth ? {} : headers
      });
      const duration = Date.now() - start;
      
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? ` (${data.length} items)` : '';
        console.log(`✅ [${res.status}] ${ep.name}: PASS ${count} - ${duration}ms`);
      } else {
        const errText = await res.text();
        console.log(`❌ [${res.status}] ${ep.name}: FAIL - ${errText}`);
      }
    } catch (err) {
      console.log(`❌ [ERROR] ${ep.name}: ${err.message}`);
    }
  }
  
  console.log('\n✨ API Check Complete.');
  process.exit(0);
}

testAPIs();
