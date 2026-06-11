import express, {
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequestHandler } from '@remix-run/express'
import {
  type ServerBuild,
} from '@remix-run/node'
import authRoutes from './routes/auth.js'
import complaintsRoutes from './routes/complaints.js'
import evidenceRoutes from './routes/evidence.js'
import usersRoutes from './routes/users.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BUILD_DIR = path.resolve(__dirname, '..', 'build')
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')

const app: express.Application = express()

app.use(cors())

app.use('/api', express.json({ limit: '10mb' }))
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/complaints', complaintsRoutes)
app.use('/api/evidence', evidenceRoutes)
app.use('/api/users', usersRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

async function getBuild(): Promise<ServerBuild> {
  const buildPath = path.join(BUILD_DIR, 'index.js')
  const build = await import(buildPath)
  return build.default || build
}

async function setupDevMode(expressApp: Application): Promise<ServerBuild> {
  const { createServer } = await import('vite')
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  expressApp.use(vite.middlewares)

  const build = (await vite.ssrLoadModule('virtual:remix/server-build')) as ServerBuild
  return build
}

async function setupProdMode(expressApp: Application): Promise<ServerBuild> {
  const compression = (await import('compression')).default
  expressApp.use(compression())

  expressApp.use(
    '/assets',
    express.static(path.join(BUILD_DIR, 'client', 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  )

  expressApp.use(express.static(PUBLIC_DIR, { maxAge: '1h' }))

  return getBuild()
}

export async function setupRemix(expressApp: Application): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production'

  const build = isDev ? await setupDevMode(expressApp) : await setupProdMode(expressApp)

  expressApp.all(
    '*',
    createRequestHandler({
      build,
      mode: isDev ? 'development' : 'production',
    }),
  )
}

export { app }
export default app
