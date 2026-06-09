import db, { resetDatabase } from './db.js'
import { seed } from './seed.js'

resetDatabase()
seed()

console.log('Database reset and seeded successfully')
db.close()
