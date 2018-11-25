'use strict'

const lodashSortBy = require('lodash.sortby')

const TradfriSanitizer = require('./TradfriSanitizer')

class TradfriClient {
	
	constructor (user, psk, gateway) {
		this.user    = user
		this.psk     = psk
		this.gateway = gateway

		this.exec = require('child-process-promise').exec
		
		this.lastRandomColor = ''
		
		this.colorTemperatures = {
			warm:    'efd275',
			neutral: 'f1e0b5',
			cold:    'f5faf6',
		}
		this.colorTemperatures.kalt = this.colorTemperatures.cold
		
		this.colorsRGB = {
			red:          {hue: 63828, saturation: 65279, colorX: 41084, colorY: 21159},
			green:        {hue: 20673, saturation: 65279, colorX: 19659, colorY: 39108},
			blue:         {hue: 45333, saturation: 65279, colorX: 10121, colorY: 4098},
			yellow:       {hue: 8572,  saturation: 55985, colorX: 29491, colorY: 30802}, // Yellow
			pink:         {hue: 59789, saturation: 65279, colorX: 32768, colorY: 15729}, // Saturated Pink
			purple:       {hue: 53953, saturation: 65279, colorX: 20316, colorY: 8520}, // Saturated Purple
			orange:       {hue: 4137,  saturation: 65279, colorX: 38011, colorY: 24904}, // Warm Amber
			lightPink:    {hue: 62007, saturation: 41158, colorX: 29491, colorY: 18350}, // Light Pink
			lightPurple:  {hue: 55784, saturation: 44554, colorX: 22282, colorY: 12452}, // Light Purple
			coldSky:      {hue: 2681,  saturation: 4360,  colorX: 21109, colorY: 21738}, // Cold Sky
			coolDaylight: {hue: 5989,  saturation: 12964, colorX: 22584, colorY: 23272}, // Cool Daylight
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
	
	async getDevice (deviceId, withRaw = false) {
		return TradfriSanitizer.sanitizeDevice(await this.request('get', `15001/${deviceId}`), withRaw)
	}

	async getDevices (type = null, sortBy = null, withRaw = false) {
		const devices = await Promise.all((await this.getDeviceIds()).map(async id => this.getDevice(id, withRaw)))
		const filtered = type ? devices.filter(d => d.type === type) : devices
		return sortBy ? lodashSortBy(filtered, sortBy.split(',')) : filtered
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
	
	async getGroup (id, withRaw = false) {
		return TradfriSanitizer.sanitizeGroup(await this.request('get', `15004/${id}`), withRaw)
	}

	async getGroups (sortBy = null, withRaw = false) {
		const groups = await Promise.all((await this.getGroupIds()).map(async id => this.getGroup(id, withRaw)))
		return sortBy ? lodashSortBy(groups, sortBy.split(',')) : groups
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


	// *** fancy features ***

	disco (deviceIds, on, intervalMs = 500, transitionMs = 300) {
		if (!on) {
			if (this.discoInterval) {
				this.clearInterval(this.discoInterval)
				this.discoInterval = null
				this.setTimeout(() => deviceIds.forEach(deviceId => this.setDeviceState(deviceId, 0)), 500)
			}
		} else if (!this.discoInterval) {
			deviceIds.forEach(deviceId => this.setDeviceState(deviceId, 1))
			this.discoInterval = this.setInterval(() => deviceIds.forEach(deviceId => this.setDeviceColor(deviceId, 'random', transitionMs, 'ms')), intervalMs)
		}
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
		const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'purple', 'orange']
		const color = colors[Math.floor(Math.random() * colors.length)]
		return color === this.lastRandomColor ? this.getRandomColor() : this.lastRandomColor = color
	}

	static convertTransitionTime (value, unit) {
		value = parseInt(value)
		switch (unit) {
			case 'h':  return value * 36000
			case 'm':  return value * 600
			case 's':  return value * 10
			case 'ds': return value // deci-second (1/10 of a second), the smallest unit Tradfri understands
			case 'ms': return Math.round(value / 100)
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
		const response = await this.exec(command)
		const lines = response.stdout.toString().split('\n')

		for (let i in lines) {
			if (lines[i].startsWith('{') || lines[i].startsWith('[')) {
				return JSON.parse(lines[i])
			}
		}

		return 'OK'
	}


	// *** for stubbing in unit tests

	setInterval (handler, timeout) {
		return setInterval(handler, timeout)
	}

	clearInterval (handler) {
		clearInterval(handler)
	}

	setTimeout (handler, timeout) {
		setTimeout(handler, timeout)
	}

}

module.exports = TradfriClient
