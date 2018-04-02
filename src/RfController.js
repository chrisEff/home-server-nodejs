'use strict'

const exec = require('child-process-promise').exec

const outlets = require('../config.json').outlets

class RfController {
	
	static getOutlets () {
		return outlets
	}
	
	/**
	 * @param {int} id
	 * @param {int} state (0/1)
	 * @returns {Promise}
	 */
	static switchOutlet (id, state) {
		return RfController._sendCode(outlets[id][state], outlets[id].protocol, outlets[id].pulseLength)
	}

	/**
	 * @param {int} code
	 * @param {int} protocol
	 * @param {int} pulseLength
	 * @returns {Promise}
	 * @private
	 */
	static _sendCode (code, protocol, pulseLength) {
		return exec(`codesend ${code} ${protocol} ${pulseLength}`)
	}
	
}

module.exports = RfController
