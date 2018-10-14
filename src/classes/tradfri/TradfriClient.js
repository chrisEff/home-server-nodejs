'use strict'

const exec = require('child-process-promise').exec

const TradfriSanitizer = require('./TradfriSanitizer')

class TradfriClient {
	
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
			red:    { hue: 63828, saturation: 65279, colorX: 41084, colorY: 21159 },
			green:  { hue: 20672, saturation: 65279, colorX: 19659, colorY: 39108 },
			blue:   { hue: 45333, saturation: 65279, colorX: 10121, colorY: 4098 },
			yellow: { hue: 9611,  saturation: 65279, colorX: 28800, colorY: 31848 },
			pink:   { hue: 59476, saturation: 65279, colorX: 31574, colorY: 15919 },
			purple: { hue: 49141, saturation: 65279, colorX: 13353, colorY: 5879 },
		}
		this.colorsRGB.rot   = this.colorsRGB.red
		this.colorsRGB.gruen = this.colorsRGB.green
		this.colorsRGB.blau  = this.colorsRGB.blue
		this.colorsRGB.gelb  = this.colorsRGB.yellow
		this.colorsRGB.rosa  = this.colorsRGB.pink
		this.colorsRGB.lila  = this.colorsRGB.purple
	}
	
	// *** gateway ***
	
	async getGatewayDetails () {
		return this.request('get', '15011/15012')
	}

	async rebootGateway () {
		return this.request('post', '15011/9030')
	}
	
	
	// *** devices ***

	async getDeviceIds () {
		return this.request('get', `15001`)
	}
	
	async getDevice (deviceId) {
		return TradfriSanitizer.sanitizeDevice(await this.request('get', `15001/${deviceId}`))
	}

	async getDevices () {
		return Promise.all((await this.getDeviceIds()).map(async id => this.getDevice(id)))
	}
	
	async setDeviceName (id, name) {
		return this.request('put', `15001/${id}`, JSON.stringify({'9001': name}))
	}

	async getDeviceState (id) {
		return (await this.getDevice(id)).state
	}

	async setDeviceState (id, state) {
		return this.request('put', `15001/${id}`, JSON.stringify({3311: [{5850: parseInt(state)}]}))
	}

	async toggleDeviceState (id) {
		return this.setDeviceState(id, await this.getDeviceState(id) ? 0 : 1)
	}

	async setDeviceBrightness (id, brightness, transitionTime = null, timeUnit = 's') {
		const body = {3311: [{5851: parseInt(brightness)}]}
		if (transitionTime) {
			body[3311][0][5712] = TradfriClient.convertTransitionTime(transitionTime, timeUnit)
		}
		
		return this.request('put', `15001/${id}`, JSON.stringify(body))
	}

	async setDeviceColor (id, color, transitionTime = null, timeUnit = 's') {
		const body = {3311: [this.mapColor(color)]}
		if (transitionTime) {
			body[3311][0][5712] = TradfriClient.convertTransitionTime(transitionTime, timeUnit)
		}

		return this.request('put', `15001/${id}`, JSON.stringify(body))
	}
	
	
	// *** groups ***

	async getGroupIds () {
		return this.request('get', `15004`)
	}
	
	async getGroup (id) {
		return TradfriSanitizer.sanitizeGroup(await this.request('get', `15004/${id}`))
	}

	async getGroups () {
		return Promise.all((await this.getGroupIds()).map(async id => this.getGroup(id)))
	}

	async setGroupName (id, name) {
		return this.request('put', `15004/${id}`, JSON.stringify({9001: name}))
	}

	async setGroupState (id, state) {
		return this.request('put', `15004/${id}`, JSON.stringify({5850: parseInt(state)}))
	}

	async setGroupBrightness (id, brightness, transitionTime = null, timeUnit = 's') {
		const body = {5851: parseInt(brightness)}
		if (transitionTime) {
			body[5712] = TradfriClient.convertTransitionTime(transitionTime, timeUnit)
		}
		
		return this.request('put', `15004/${id}`, JSON.stringify(body))
	}

	// setGroupColor() not implemented since it doesn't seem to be possible to set a group's color
	
	
	// *** schedules ***

	async getScheduleIds () {
		return this.request('get', `15010`)
	}

	async getSchedule (id) {
		return this.request('get', `15010/${id}`)
	}

	async getSchedules () {
		return Promise.all((await this.getScheduleIds()).map(async id => this.getSchedule(id)))
	}
	
	
	// *** general ***
	
	mapColor (color) {
		color = color
			.replace('ä', 'ae')
			.replace('ö', 'oe')
			.replace('ü', 'ue')
		
		if (['random', 'zufall'].indexOf(color) >= 0) {
			color = this.getRandomColor()
		}

		if (this.colorTemperatures[color]) {
			return {5706: this.colorTemperatures[color]}
		}
		
		if (this.colorsRGB[color]) {
			return {
				5707: this.colorsRGB[color].hue,
				5708: this.colorsRGB[color].saturation,
				5709: this.colorsRGB[color].colorX,
				5710: this.colorsRGB[color].colorY,
			}
		}
		
		throw new Error(`color "${color}" not supported`)
	}

	getRandomColor () {
		const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'purple']
		const color = colors[Math.floor(Math.random() * colors.length)]
		return color === this.lastRandomColor ? this.getRandomColor() : this.lastRandomColor = color
	}

	static convertTransitionTime (value, unit) {
		value = parseInt(value)
		switch (unit) {
			case 'h':  return value * 36000
			case 'm':  return value * 600
			case 'ds': return value // deci-second (1/10 of a second), the smallest unit Tradfri understands
			case 's':  return value * 10
			default:   throw new Error(`time unit "${unit}" not supported`)
		}
	}

	/**
	 * @param {string} method
	 * @param {string} path
	 * @param {string} body
	 * @returns {Promise<*>}
	 */
	async request (method, path, body = null) {
		body = body ? `-e '${body}'` : ''

		const command = `coap-client -B 10 -m ${method} -u "${this.user}" -k "${this.psk}" ${body} "coaps://${this.gateway}:5684/${path}"`
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

module.exports = TradfriClient
