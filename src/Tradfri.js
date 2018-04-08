'use strict'

const exec = require('child-process-promise').exec

class Tradfri {
	
	constructor (user, psk, gateway) {
		this.user    = user
		this.psk     = psk
		this.gateway = gateway
		
		this.lastRandomColor = ''
		
		this.colorTemperatures = {
			warm:    'efd275',
			neutral: 'f1e0b5',
			cold:    'f5faf6',
		}
		this.colorTemperatures.kalt = this.colorTemperatures.cold
		
		this.colorsRGB = {
			red: {
				5707: 63828,
				5708: 65279,
				5709: 41084,
				5710: 21159,
			},
			green: {
				5707: 20672,
				5708: 65279,
				5709: 19659,
				5710: 39108,
			},
			blue: {
				5707: 45333,
				5708: 65279,
				5709: 10121,
				5710: 4098,
			},
			yellow: {
				5707: 9611,
				5708: 65279,
				5709: 28800,
				5710: 31848,
			},
			pink: {
				5707: 59476,
				5708: 65279,
				5709: 31574,
				5710: 15919,
			},
			purple: {
				5707: 49141,
				5708: 65279,
				5709: 13353,
				5710: 5879,
			},
		}
		this.colorsRGB.rot   = this.colorsRGB.red
		this.colorsRGB.gruen = this.colorsRGB.green
		this.colorsRGB.blau  = this.colorsRGB.blue
		this.colorsRGB.gelb  = this.colorsRGB.yellow
		this.colorsRGB.rosa  = this.colorsRGB.pink
		this.colorsRGB.lila  = this.colorsRGB.purple
	}
	
	
	// devices

	getDeviceIds () {
		return this.request('get', `15001`)
	}
	
	getDevice (deviceId) {
		return this.request('get', `15001/${deviceId}`)
	}

	async getDevices () {
		const result = {}
		for (const id of await this.getDeviceIds()) {
			result[id] = await this.getDevice(id)
		}
		return result
	}
	
	setDeviceState (id, state) {
		return this.setState(`15001/${id}`, state)
	}
	
	setDeviceBrightness (id, brightness, transitionTime = null, timeUnit = 's') {
		return this.setBrightness(`15001/${id}`, brightness, transitionTime, timeUnit)
	}

	setDeviceColor (id, color, transitionTime = null, timeUnit = 's') {
		return this.setColor(`15001/${id}`, color, transitionTime, timeUnit)
	}
	
	static sanitizeTransitionTime (value, unit) {
		value = parseInt(value)
		switch (unit) {
			case 'h':  return value * 36000
			case 'm':  return value * 600
			case 'ds': return value // deci-second (1/10 of a second), the smallest unit Tradfri understands
			case 's':
			default:   return value * 10
		}
	}
	
	
	// groups
	
	getGroupIds () {
		return this.request('get', `15004`)
	}
	
	getGroup (id) {
		return this.request('get', `15004/${id}`)
	}

	async getGroups () {
		const result = {}
		for (const id of await this.getGroupIds()) {
			result[id] = await this.getGroup(id)
		}
		return result
	}

	setGroupState (id, state) {
		return this.setState(`15004/${id}`, state)
	}

	setGroupBrightness (id, brightness, transitionTime = null, timeUnit = 's') {
		return this.setBrightness(`15004/${id}`, brightness, transitionTime, timeUnit)
	}

	setGroupColor (id, color, transitionTime = null, timeUnit = 's') {
		return this.setColor(`15004/${id}`, color, transitionTime, timeUnit)
	}
	
	
	// schedules
	
	getScheduleIds () {
		return this.request('get', `15010`)
	}

	getSchedule (id) {
		return this.request('get', `15010/${id}`)
	}

	async getSchedules () {
		const result = {}
		for (const id of await this.getScheduleIds()) {
			result[id] = await this.getSchedule(id)
		}
		return result
	}
	
	
	// general

	setState (path, state) {
		return this.request('put', path, JSON.stringify({
			3311: [{
				5850: parseInt(state),
			}],
		}))
	}

	setBrightness (path, brightness, transitionTime = null, timeUnit = 's') {
		const body = {
			3311: [{
				5851: parseInt(brightness),
			}],
		}
		if (transitionTime) {
			body[3311][0][5712] = Tradfri.sanitizeTransitionTime(transitionTime, timeUnit)
		}
		return this.request('put', path, JSON.stringify(body))
	}

	getRandomColor () {
		const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'purple']
		const color = colors[Math.floor(Math.random() * colors.length)]
		return color === this.lastRandomColor ? this.getRandomColor() : this.lastRandomColor = color
	}

	setColor (path, color, transitionTime = null, timeUnit = 's') {
		color = color
			.replace('ä', 'ae')
			.replace('ö', 'oe')
			.replace('ü', 'ue')
		if (['random', 'zufall'].indexOf(color) >= 0) {
			color = this.getRandomColor()
		}

		let body = {3311: []}
		if (this.colorTemperatures[color]) {
			body[3311][0] = {5706: this.colorTemperatures[color]}
		} else if (this.colorsRGB[color]) {
			// JSON.parse(JSON.stringify()) is a hack for cloning the object.
			// This is necessary because we don't wanna mess with the reference below.
			body[3311][0] = JSON.parse(JSON.stringify(this.colorsRGB[color]))
		} else {
			body[3311][0] = {}
		}

		if (transitionTime) {
			body[3311][0][5712] = Tradfri.sanitizeTransitionTime(transitionTime, timeUnit)
		}

		return this.request('put', path, JSON.stringify(body))
	}

	/**
	 * @param {string} method
	 * @param {string} path
	 * @param {string} body
	 * @returns {Promise<*>}
	 */
	async request (method, path, body = null) {
		body = body ? `-e '${body}'` : ''

		const command = `coap-client -m ${method} -u "${this.user}" -k "${this.psk}" ${body} "coaps://${this.gateway}:5684/${path}"`
		const response = await exec(command)
		const lines = response.stdout.toString().split('\n')

		for (let i in lines) {
			if (lines[i].startsWith('{') || lines[i].startsWith('[')) {
				return JSON.parse(lines[i])
			}
		}

		return 'OK'
	}

}

module.exports = Tradfri
