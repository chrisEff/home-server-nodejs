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
		level: 'info',
		name: 'winston_logzio',
		token: config.logzIoToken,
		host: 'listener.logz.io',
	}))
}

winston.configure({
	transports,
})

class Logger {

	static error (msg) {
		winston.error(msg)
	}

	static warn (msg) {
		winston.warn(msg)
	}

	static info (msg) {
		winston.info(msg)
	}

	static verbose (msg) {
		winston.verbose(msg)
	}

	static debug (msg) {
		winston.debug(msg)
	}

	static silly (msg) {
		winston.silly(msg)
	}
	
}

module.exports = Logger
