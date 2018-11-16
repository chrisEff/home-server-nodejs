'use strict'

const exec = require('child-process-promise').exec

const outlets = require('../../config.js').outlets

class RfController {

	constructor (outlets) {
		this.outlets = outlets
	}
	
	getOutlets () {
		return this.outlets
	}
	
	/**
	 * @param {int} id
	 * @param {int} state (0/1)
	 * @returns {Promise}
	 */
	static switchOutlet (id, state) {
		const outlet = outlets.find(o => o.id === parseInt(id))
		outlet.state = parseInt(state)
		return this._sendCode(outlet[state], outlet.protocol, outlet.pulseLength)
	}
	
	toggleOutlet (id) {
		const outlet = outlets.find(o => o.id === parseInt(id))
		return this.switchOutlet(id, outlet.state ? 0 : 1)
	}

	/**
	 * @param {int} code
	 * @param {int} protocol
	 * @param {int} pulseLength
	 * @returns {Promise}
	 * @private
	 */
	_sendCode (code, protocol, pulseLength) {
		return exec(`codesend ${code} ${protocol} ${pulseLength}`)
	}
	
}

module.exports = RfController
