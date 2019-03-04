'use strict'

const dateFormat = require('dateformat')

const winston = require('winston')
const config = require('../../config.js')

const transports = [
	new winston.transports.Console({
		level: config.logLevel,
		timestamp: () => {
			return dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
		},
	}),
]

if (config.logzIoToken) {
	const LogzioWinstonTransport = require('winston-logzio')
	transports.push(new LogzioWinstonTransport({
		level: 'silly',
		name: 'winston_logzio',
		token: config.logzIoToken,
		host: 'listener.logz.io',
	}))
}

winston.configure({
	transports,
})

class Logger {

	static error (msg, meta = undefined) {
		winston.error(msg, meta)
	}

	static warn (msg, meta = undefined) {
		winston.warn(msg, meta)
	}

	static info (msg, meta = undefined) {
		winston.info(msg, meta)
	}

	static verbose (msg, meta = undefined) {
		winston.verbose(msg, meta)
	}

	static debug (msg, meta = undefined) {
		winston.debug(msg, meta)
	}

	static silly (msg, meta = undefined) {
		winston.silly(msg, meta)
	}
	
}

module.exports = Logger
