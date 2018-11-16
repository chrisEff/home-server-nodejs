'use strict'

class RfController {

	constructor (outlets) {
		this.outlets = outlets
		this.exec = require('child-process-promise').exec
	}
	
	getOutlets () {
		return this.outlets
	}
	
	/**
	 * @param {int} id
	 * @param {int} state (0/1)
	 * @returns {Promise}
	 */
	switchOutlet (id, state) {
		const outlet = this.outlets.find(o => o.id === parseInt(id))
		outlet.state = parseInt(state)
		return this._sendCode(outlet[state], outlet.protocol, outlet.pulseLength)
	}
	
	toggleOutlet (id) {
		const outlet = this.outlets.find(o => o.id === parseInt(id))
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
		return this.exec(`codesend ${code} ${protocol} ${pulseLength}`)
	}
	
}

module.exports = RfController
