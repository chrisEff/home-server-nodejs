'use strict'

const exec = require('child-process-promise').exec

const outlets = require('../config.js').outlets

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
		const outlet = outlets.find(o => o.id === parseInt(id))
		outlet.state = parseInt(state)
		return RfController._sendCode(outlet[state], outlet.protocol, outlet.pulseLength)
	}
	
	static toggleOutlet (id) {
		const outlet = outlets.find(o => o.id === parseInt(id))
		return RfController.switchOutlet(id, outlet.state ? 0 : 1 )
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
