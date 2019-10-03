'use strict'

const childProcessPromise = require('child-process-promise')

/**
 * @abstract
 */
class RfCodeSender {
	constructor (pathToExecutable = 'codesend') {
		this.pathToExecutable = pathToExecutable
		this.exec = childProcessPromise.exec
	}

	/**
	 * @param {int} code
	 * @param {int} protocol
	 * @param {int} pulseLength
	 * @returns {Promise}
	 * @protected
	 */
	sendCode (code, protocol, pulseLength = undefined) {
		return this.exec(`${this.pathToExecutable} ${code} ${protocol} ${pulseLength || ''}`)
	}
}

module.exports = RfCodeSender
