'use strict'

const dateFormat = require('dateformat')

const winston = require('winston')
winston.configure({
	level: require('../config.json').logLevel,
	transports: [
		new (winston.transports.Console)({
			timestamp: () => {
				return dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
			},
		}),
	],
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
