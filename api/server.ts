import app from './app.js'
import db from './db.js'
import { seed } from './seed.js'

const PORT = process.env.PORT || 3001

const countResult = db.prepare('SELECT COUNT(*) as count FROM qualifications').get() as { count: number }
if (countResult.count === 0) {
  console.log('No data found, running seed...')
  seed()
}

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
