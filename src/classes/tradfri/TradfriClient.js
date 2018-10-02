'use strict'

const exec = require('child-process-promise').exec
const get = require('lodash.get')

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
	
	// gateway
	
	async getGatewayDetails () {
		return this.request('get', '15011/15012')
	}

	async rebootGateway () {
		return this.request('post', '15011/9030')
	}
	
	// devices

	async getDeviceIds () {
		return this.request('get', `15001`)
	}
	
	async getDevice (deviceId) {
		const raw = await this.request('get', `15001/${deviceId}`)
		let model = get(raw, '3.1')
		const result = {
			id:         get(raw, '9003'),
			type:       TradfriClient.getDeviceTypeByModel(model),
			name:       get(raw, '9001'),
			model:      model,
			firmware:   get(raw, '3.3'),
		}
		
		if (result.type === 'bulb') {
			result.state      = get(raw, '3311.0.5850')
			result.brightness = get(raw, '3311.0.5851')
			result.bulbType   = TradfriClient.getBulbTypeByModel(model)
		}
		result.raw = raw

		return result
	}

	static getDeviceTypeByModel (model) {
		if (model === 'TRADFRI remote control')        return 'remote'
		if (model === 'TRADFRI wireless dimmer')       return 'dimmer'
		if (model && model.startsWith('TRADFRI bulb')) return 'bulb'
		return undefined
	}

	static getBulbTypeByModel (model) {
		if (model.includes(' CWS ')) return 'rgb'
		if (model.includes(' WS '))  return 'white-spectrum'
		return 'white'
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
		return this.setState(`15001/${id}`, state)
	}

	async toggleDeviceState (id) {
		return this.setDeviceState(id, await this.getDeviceState(id) ? 0 : 1)
	}

	async setDeviceBrightness (id, brightness, transitionTime = null, timeUnit = 's') {
		return this.setBrightness(`15001/${id}`, brightness, transitionTime, timeUnit)
	}

	async setDeviceColor (id, color, transitionTime = null, timeUnit = 's') {
		return this.setColor(`15001/${id}`, color, transitionTime, timeUnit)
	}
	
	
	// groups

	async getGroupIds () {
		return this.request('get', `15004`)
	}
	
	async getGroup (id) {
		const raw = await this.request('get', `15004/${id}`)
		const result = {
			id:   get(raw, '9003'),
			name: get(raw, '9001'),
			deviceIds: get(raw, '9018.15002.9003'),
			raw,
		}
		
		return result
	}

	async getGroups () {
		return Promise.all((await this.getGroupIds()).map(async id => this.getGroup(id)))
	}

	async setGroupName (id, name) {
		return this.request('put', `15004/${id}`, JSON.stringify({'9001': name}))
	}

	async setGroupState (id, state) {
		return this.setState(`15004/${id}`, state)
	}

	async setGroupBrightness (id, brightness, transitionTime = null, timeUnit = 's') {
		return this.setBrightness(`15004/${id}`, brightness, transitionTime, timeUnit)
	}

	async setGroupColor (id, color, transitionTime = null, timeUnit = 's') {
		return this.setColor(`15004/${id}`, color, transitionTime, timeUnit)
	}
	
	
	// schedules

	async getScheduleIds () {
		return this.request('get', `15010`)
	}

	async getSchedule (id) {
		return this.request('get', `15010/${id}`)
	}

	async getSchedules () {
		return Promise.all((await this.getScheduleIds()).map(async id => this.getSchedule(id)))
	}
	
	
	// general

	async setState (path, state) {
		return this.request('put', path, JSON.stringify({
			3311: [{
				5850: parseInt(state),
			}],
		}))
	}

	async setBrightness (path, brightness, transitionTime = null, timeUnit = 's') {
		const body = {
			3311: [{
				5851: parseInt(brightness),
			}],
		}
		if (transitionTime) {
			body[3311][0][5712] = TradfriClient.convertTransitionTime(transitionTime, timeUnit)
		}
		return this.request('put', path, JSON.stringify(body))
	}

	async setColor (path, color, transitionTime = null, timeUnit = 's') {
		color = color
			.replace('ä', 'ae')
			.replace('ö', 'oe')
			.replace('ü', 'ue')
		if (['random', 'zufall'].indexOf(color) >= 0) {
			color = this.getRandomColor()
		}

		let body
		if (this.colorTemperatures[color]) {
			body = {3311: [{5706: this.colorTemperatures[color]}]}
		} else if (this.colorsRGB[color]) {
			body = {3311: [{
				5707: this.colorsRGB[color].hue,
				5708: this.colorsRGB[color].saturation,
				5709: this.colorsRGB[color].colorX,
				5710: this.colorsRGB[color].colorY,
			}]}
		} else {
			throw new Error(`color "${color}" not supported`)
		}

		if (transitionTime) {
			body[3311][0][5712] = TradfriClient.convertTransitionTime(transitionTime, timeUnit)
		}

		return this.request('put', path, JSON.stringify(body))
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

module.exports = TradfriClient
