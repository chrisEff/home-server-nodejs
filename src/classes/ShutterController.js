'use strict'

class ShutterController {

	constructor (shutters) {
		this.shutters = shutters
		this.exec = require('child-process-promise').exec
	}

	getShutters () {
		return this.shutters
	}

	/**
	 * @param {string|int} id
	 * @returns {Promise}
	 */
	async up (id) {
		const shutter = this.shutters.find(s => s.id === parseInt(id))

		return this._sendCode(shutter.codeUp, shutter.protocol)
	}

	/**
	 * @param {string|int} id
	 * @returns {Promise}
	 */
	async down (id) {
		const shutter = this.shutters.find(s => s.id === parseInt(id))

		return this._sendCode(shutter.codeDown, shutter.protocol)
	}

	/**
	 * @param {int} code
	 * @param {int} protocol
	 * @returns {Promise}
	 * @private
	 */
	_sendCode (code, protocol) {
		return this.exec(`codesend ${code} ${protocol}`)
	}
	
}

module.exports = ShutterController
