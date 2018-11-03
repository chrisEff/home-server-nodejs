const get = require('lodash.get')

const TYPE_REMOTE = 'remote'
const TYPE_DIMMER = 'dimmer'
const TYPE_BULB = 'bulb'

const BULB_TYPE_RGB = 'rgb'
const BULB_TYPE_WHITE_SPECTRUM = 'white-spectrum'
const BULB_TYPE_WHITE = 'white'

class TradfriSanitizer {
	
	static sanitizeDevice (raw, includeRaw = false) {
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

			if (get(raw, '3311.0.5706') && get(raw, '3311.0.5706') !== '0') {
				result.color = TradfriSanitizer.getColorByHex(get(raw, '3311.0.5706'))
			} else if (get(raw, '3311.0.5707')) {
				result.color = TradfriSanitizer.getColorByHueSaturationXY(
					parseInt(get(raw, '3311.0.5707')),
					parseInt(get(raw, '3311.0.5708')),
					parseInt(get(raw, '3311.0.5709')),
					parseInt(get(raw, '3311.0.5710'))
				)
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
	
	static getColorByHex (hex) {
		switch (hex) {
			case 'efd275': return 'warm'
			case 'f1e0b5': return 'neutral'
			case 'f5faf6': return 'cold'
			case 'd6e44b': return 'yellow'
			case 'd9337c': return 'pink'
			case '8f2686': return 'purple'
			case 'e78834': return 'orange'
			case 'e8bedd': return 'lightPink'
			case 'c984bb': return 'lightPurple'
			case 'dcf0f8': return 'coldSky'
		}
		return undefined
	}

	static getColorByHueSaturationXY (hue, saturation, x, y) {
		if (hue === 63828 && saturation === 65279 && x === 41084 && y === 21159) return 'red'
		if (hue === 20673 && saturation === 65279 && x === 19659 && y === 39108) return 'green'
		if (hue === 45333 && saturation === 65279 && x === 10121 && y === 4098)  return 'blue'
		return undefined
	}

	static sanitizeGroup (raw, includeRaw = false) {
		const result = {
			id:   get(raw, '9003'),
			name: get(raw, '9001'),
			deviceIds: get(raw, '9018.15002.9003'),
		}
		if (includeRaw) {
			result.raw = raw
		}
		
		return result
	}
	
}

module.exports = TradfriSanitizer
