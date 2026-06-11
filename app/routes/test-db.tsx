import { json } from '@remix-run/node'
import pool from 'api/db'

export const loader = async () => {
  try {
    const result = await pool.query('SELECT 1 as test')
    return json({ success: true, test: result.rows[0].test })
  } catch (err: any) {
    return json({ success: false, error: err.message })
  }
}

export default function Test() {
  return <div>Test page</div>
}
