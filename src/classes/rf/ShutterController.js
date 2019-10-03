'use strict'

const RfCodeSender = require('./RfCodeSender')
const path = require('path')

class ShutterController extends RfCodeSender {

	constructor (shutters) {
		super(path.join(__dirname, '../../../433Utils/RPi_utils', 'codesend'))
		this.shutters = shutters
	}

	getShutters () {
		return this.shutters
	}

	/**
	 * @param {string|int} id
	 * @param {int} delaySeconds
	 * @returns {Promise}
	 */
	async up (id, delaySeconds = 0) {
		const shutter = this.shutters.find(s => s.id === parseInt(id))

		setTimeout(async () => {
			await this.sendCode(shutter.codeUp, shutter.protocol)
		}, delaySeconds * 1000)
	}

	/**
	 * @param {string|int} id
	 * @param {int} delaySeconds
	 * @returns {Promise}
	 */
	async down (id, delaySeconds = 0) {
		const shutter = this.shutters.find(s => s.id === parseInt(id))

		setTimeout(async () => {
			await this.sendCode(shutter.codeDown, shutter.protocol)
		}, delaySeconds * 1000)
	}
	
}

module.exports = ShutterController
