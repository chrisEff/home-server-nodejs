const get = require('lodash.get')

const TYPE_REMOTE = 'remote'
const TYPE_DIMMER = 'dimmer'
const TYPE_BULB = 'bulb'

const BULB_TYPE_RGB = 'rgb'
const BULB_TYPE_WHITE_SPECTRUM = 'white-spectrum'
const BULB_TYPE_WHITE = 'white'

class TradfriSanitizer {
	
	static sanitizeDevice (raw, includeRaw = true) {
		let model = get(raw, '3.1')
		const result = {
			id:         get(raw, '9003'),
			type:       TradfriSanitizer.getDeviceTypeByModel(model),
			name:       get(raw, '9001'),
			model:      model,
			firmware:   get(raw, '3.3'),
		}

		if (result.type === TYPE_BULB) {
			result.state      = get(raw, '3311.0.5850')
			result.brightness = get(raw, '3311.0.5851')
			result.bulbType   = TradfriSanitizer.getBulbTypeByModel(model)

			if (result.bulbType === BULB_TYPE_WHITE_SPECTRUM) {
				result.color = TradfriSanitizer.getColorTemperatureByHex(get(raw, '3311.0.5706'))
			}
		}
		if (includeRaw) {
			result.raw = raw
		}

		return result
	}

	static getDeviceTypeByModel (model) {
		if (model === 'TRADFRI remote control')        return TYPE_REMOTE
		if (model === 'TRADFRI wireless dimmer')       return TYPE_DIMMER
		if (model && model.startsWith('TRADFRI bulb')) return TYPE_BULB
		return undefined
	}

	static getBulbTypeByModel (model) {
		if (model.includes(' CWS ')) return BULB_TYPE_RGB
		if (model.includes(' WS '))  return BULB_TYPE_WHITE_SPECTRUM
		return BULB_TYPE_WHITE
	}
	
	static getColorTemperatureByHex (hex) {
		switch (hex) {
			case 'efd275': return 'warm'
			case 'f1e0b5': return 'neutral'
			case 'f5faf6': return 'cold'
		}
		return undefined
	}

	static sanitizeGroup (raw, includeRaw = true) {
		const result = {
			id:   get(raw, '9003'),
			name: get(raw, '9001'),
			deviceIds: get(raw, '9018.15002.9003'),
			raw,
		}
		if (includeRaw) {
			result.raw = raw
		}
		
		return result
	}
	
}

module.exports = TradfriSanitizer
