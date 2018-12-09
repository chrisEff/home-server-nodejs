'use strict'


const {InternalServerError} = require('restify-errors')

class RfController {

	constructor (outlets) {
		this.outlets = outlets
		this.exec = require('child-process-promise').exec
	}
	
	getOutlets () {
		return this.outlets
	}
	
	/**
	 * @param {string|int} id
	 * @param {string|int} state (0/1)
	 * @returns {Promise}
	 */
	async switchOutlet (id, state) {
		const outlet = this.outlets.find(o => o.id === parseInt(id))
		outlet.state = parseInt(state)
		const codeOrHandler = outlet.state ? outlet.on : outlet.off

		if (Number.isInteger(codeOrHandler)) {
			// we have a simple 433 Mhz code -> send it
			return this._sendCode(codeOrHandler, outlet.protocol, outlet.pulseLength)
		}
		if (typeof codeOrHandler === 'function') {
			// we have a custom handler function -> execute it
			codeOrHandler()
			return 'OK'
		}

		throw new InternalServerError(`Faulty config: Device ${id} has a handler that is neither an RF code, nor a function`)
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
