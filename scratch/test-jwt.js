import jwt from 'jsonwebtoken';
import https from 'https';

const secret = 'renthub_jwt_super_secret_2024_presentation_key';
const token = jwt.sign({ _id: '123456789012345678901234', role: 'user' }, secret, { expiresIn: '1h' });

const options = {
  hostname: 'renthub-backend-ni16.onrender.com',
  path: '/api/auth/me',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.on('error', e => console.error(e));
req.end();
