'use strict'

const RfCodeSender = require('./RfCodeSender')

class ShutterController extends RfCodeSender {

	constructor (shutters) {
		super()
		this.shutters = shutters
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

		return this.sendCode(shutter.codeUp, shutter.protocol)
	}

	/**
	 * @param {string|int} id
	 * @returns {Promise}
	 */
	async down (id) {
		const shutter = this.shutters.find(s => s.id === parseInt(id))

		return this.sendCode(shutter.codeDown, shutter.protocol)
	}
	
}

module.exports = ShutterController
