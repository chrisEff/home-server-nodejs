'use strict'

const dateFormat = require('dateformat')
const get = require('lodash.get')

const winston = require('winston')
const LogzioWinstonTransport = require('winston-logzio')

let winstonLogger

const getWinstonLogger = () => {
	if (!winstonLogger) {
		const config = require('../../config.js')

		const transports = []

		if (get(config, 'logging.console.active')) {
			const level = get(config, 'logging.console.level')
			transports.push(
				new winston.transports.Console({
					level,
					timestamp: () => {
						return dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
					},
				}),
			)
		}

		if (get(config, 'logging.file.active')) {
			const level = get(config, 'logging.file.level')
			const filename = get(config, 'logging.file.filename')
			transports.push(
				new winston.transports.File({
					level,
					filename,
					timestamp: () => {
						return dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
					},
				}),
			)
		}

		if (get(config, 'logging.logzio.active')) {
			const level = get(config, 'logging.logzio.level')
			const token = get(config, 'logging.logzio.token')
			transports.push(
				new LogzioWinstonTransport({
					level,
					name: 'winston_logzio',
					token,
					host: 'listener.logz.io',
				}),
			)
		}

		winstonLogger = winston.createLogger({
			transports,
		})
	}
	return winstonLogger
}

class Logger {
	static error(msg, meta = undefined) {
		getWinstonLogger().error(msg, meta)
	}

	static warn(msg, meta = undefined) {
		getWinstonLogger().warn(msg, meta)
	}

	static info(msg, meta = undefined) {
		getWinstonLogger().info(msg, meta)
	}

	static verbose(msg, meta = undefined) {
		getWinstonLogger().verbose(msg, meta)
	}

	static debug(msg, meta = undefined) {
		getWinstonLogger().debug(msg, meta)
	}

	static silly(msg, meta = undefined) {
		getWinstonLogger().silly(msg, meta)
	}
}

module.exports = Logger
