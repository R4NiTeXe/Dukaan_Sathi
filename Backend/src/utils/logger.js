import fs from 'fs'
import path from 'path'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import config from '../config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir = path.join(__dirname, '..', '..', 'logs')

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const dayStamp = () => new Date().toISOString().slice(0, 10)

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, `access-${dayStamp()}.log`),
  {
    flags: 'a',
  }
)
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, `error-${dayStamp()}.log`),
  {
    flags: 'a',
  }
)

morgan.token('request-id', (req) => req.id || '-')

const accessLogger = morgan(
  '[:request-id] :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
  {
    stream: config.server.isProduction
      ? accessLogStream
      : {
          write: (line) => {
            accessLogStream.write(line)
            process.stdout.write(line)
          },
        },
  }
)

const logError = (message, meta = {}) => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    ...meta,
  })
  errorLogStream.write(`${entry}\n`)
  if (!config.server.isProduction) {
    console.error(entry)
  }
}

export { accessLogger, logError, logsDir }
