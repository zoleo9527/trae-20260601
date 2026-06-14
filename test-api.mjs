import { fetch } from 'node-fetch';

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/cases');
    console.log(`Status Code: ${response.status}`);
    console.log(`Headers:`, response.headers);
    
    const data = await response.json();
    console.log('Response Body:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();