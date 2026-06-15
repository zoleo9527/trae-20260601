import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/building_materials',
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  return client;
}
