import { format, Format } from 'logform'
import { createLogger, Logger } from 'winston'
import { Console, ConsoleTransportInstance } from 'winston/lib/winston/transports'

const IS_DEBUG: boolean = process.env.DEBUG ? true : false
const NO_COLOR: boolean = process.env.NO_COLOR ? true : false

const messageFormat: Format = format.combine(
  format.colorize({ all: !NO_COLOR }),
  format.printf(({ message, level }) => `[${level}]: ${message}`)
)

const consoleTransport: ConsoleTransportInstance = new Console({
  silent: false
})

const logger: Logger = createLogger({
  exitOnError: false,
  level: IS_DEBUG ? 'silly' : 'info',
  transports: [consoleTransport],
  exceptionHandlers: [consoleTransport],
  format: messageFormat
})

export default logger
