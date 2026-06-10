import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'parking_complaint',
  user: 'liu',
})

export default pool
