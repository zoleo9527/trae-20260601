import { getDb } from '../db.js'

export function syncExpiredLocks(): void {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const now = new Date().toISOString()

  const expiringLocks = db
    .prepare(
      `
    SELECT id, adjustment_id, inventory_id, customer_id 
    FROM price_lock 
    WHERE lock_end_date < ? AND status != 'expired'
  `,
    )
    .all(today) as Array<{
    id: string
    adjustment_id: string
    inventory_id: string
    customer_id: string
  }>

  if (expiringLocks.length > 0) {
    const updateLockStmt = db.prepare('UPDATE price_lock SET status = ? WHERE id = ?')
    const updateAdjStmt = db.prepare(`
      UPDATE price_adjustment 
      SET status = 'expired', updated_at = ? 
      WHERE id = ? AND status = 'approved'
    `)
    const updateQuoteStmt = db.prepare(`
      UPDATE customer_quote 
      SET status = 'expired' 
      WHERE adjustment_id = ? AND status = 'active'
    `)

    const tx = db.transaction((locks: typeof expiringLocks) => {
      for (const lock of locks) {
        updateLockStmt.run('expired', lock.id)
        updateAdjStmt.run(now, lock.adjustment_id)
        updateQuoteStmt.run(lock.adjustment_id)
      }
    })

    tx(expiringLocks)
  }

  db
    .prepare(
      `
    UPDATE price_lock
    SET status = 'expiring_soon'
    WHERE lock_end_date >= ? AND lock_end_date <= ? AND status = 'active'
  `,
    )
    .run(today, threeDaysLater)
}
