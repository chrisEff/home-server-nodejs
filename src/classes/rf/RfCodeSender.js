'use strict'

const childProcessPromise = require('child-process-promise')

/**
 * @abstract
 */
class RfCodeSender {
	constructor () {
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
		return this.exec(`codesend ${code} ${protocol} ${pulseLength || ''}`)
	}
}

module.exports = RfCodeSender
