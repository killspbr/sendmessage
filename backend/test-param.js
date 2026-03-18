import { query } from './src/db.js';

async function testQueryParam() {
  try {
     await query('SELECT $1::text', [undefined]);
     console.log('Success with undefined');
  } catch(e) {
     console.error('Error with undefined:', e.message);
  }
}

testQueryParam();
