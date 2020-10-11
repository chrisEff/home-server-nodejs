const get = require('lodash.get')

const TYPE_MOTION_SENSOR = 'motionSensor'
const TYPE_PLUG = 'plug'
const TYPE_BULB = 'bulb'
const TYPE_SWITCH = 'switch'

const BULB_TYPE_RGB = 'rgb'
const BULB_TYPE_WHITE_SPECTRUM = 'white-spectrum'
const BULB_TYPE_WHITE = 'white'

const SWITCH_TYPE_REMOTE = 'remote'
const SWITCH_TYPE_DIMMER = 'dimmer'

const NOTIFICATION_TYPES = {
	1001: 'NEW_FIRMWARE_AVAILABLE',
	1003: 'GATEWAY_REBOOT_NOTIFICATION',
	1004: 'UNKNOWN_EVENT_1004',
	1005: 'UNKNOWN_EVENT_1005',
	5001: 'LOSS_OF_INTERNET_CONNECTIVITY',
}

class TradfriSanitizer {
	// prettier-ignore
	static sanitizeDevice(raw, includeRaw = false) {
		const result = {
			id:           get(raw, '9003'),
			type:         TradfriSanitizer.getDeviceType(raw),
			name:         get(raw, '9001'),
			model:        get(raw, '3.1'),
			firmware:     get(raw, '3.3'),
			manufacturer: get(raw, '3.0'),
		}

		if (result.type === TYPE_BULB) {
			result.state      = get(raw, '3311.0.5850')
			result.brightness = get(raw, '3311.0.5851')
			result.bulbType   = TradfriSanitizer.getBulbType(raw)
			result.color      = TradfriSanitizer.getColor(raw)
		}

		if (result.type === TYPE_SWITCH) {
			result.subType = TradfriSanitizer.getSwitchType(raw)
		}

		if (includeRaw) {
			result.raw = raw
		}

		return result
	}

	static getDeviceType(raw) {
		const ikeaType = get(raw, '5750')

		if (ikeaType === 4) return TYPE_MOTION_SENSOR
		if (ikeaType === 3) return TYPE_PLUG
		if (ikeaType === 2) return TYPE_BULB
		if (ikeaType === 0) return TYPE_SWITCH

		return undefined
	}

	static getBulbType(raw) {
		if (get(raw, '3311.0.5707') !== undefined) return BULB_TYPE_RGB
		if (get(raw, '3311.0.5706') !== undefined) return BULB_TYPE_WHITE_SPECTRUM
		return BULB_TYPE_WHITE
	}

	static getSwitchType(raw) {
		const model = get(raw, '3.1')

		if (model === 'TRADFRI remote control') return SWITCH_TYPE_REMOTE
		if (model === 'TRADFRI wireless dimmer') return SWITCH_TYPE_DIMMER

		return undefined
	}

	static getColor(raw) {
		const hexColor = get(raw, '3311.0.5706')
		if (hexColor && hexColor !== '0') {
			return TradfriSanitizer.getColorByHex(hexColor)
		}
		if (get(raw, '3311.0.5707')) {
			return TradfriSanitizer.getColorByHueSaturationXY(
				parseInt(get(raw, '3311.0.5707')),
				parseInt(get(raw, '3311.0.5708')),
				parseInt(get(raw, '3311.0.5709')),
				parseInt(get(raw, '3311.0.5710')),
			)
		}

		return undefined
	}

	static getColorByHex(hex) {
		// prettier-ignore
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

	static getColorByHueSaturationXY(hue, saturation, x, y) {
		if (hue === 63828 && saturation === 65279 && x === 41084 && y === 21159) return 'red'
		if (hue === 20673 && saturation === 65279 && x === 19659 && y === 39108) return 'green'
		if (hue === 45333 && saturation === 65279 && x === 10121 && y === 4098) return 'blue'
		return undefined
	}

	static sanitizeGroup(raw, includeRaw = false) {
		const result = {
			id: get(raw, '9003'),
			name: get(raw, '9001'),
			deviceIds: get(raw, '9018.15002.9003'),
		}
		if (includeRaw) {
			result.raw = raw
		}

		return result
	}

	static sanitizeNotification(raw, includeRaw = false) {
		const result = {
			time: new Date(parseInt(get(raw, '9002')) * 1000).toISOString(),
			state: get(raw, '9014'),
			type: NOTIFICATION_TYPES[get(raw, '9015')] || `UNKNOWN_EVENT_${get(raw, '9015')}`,
		}
		if (includeRaw) {
			result.raw = raw
		}

		return result
	}
}

module.exports = TradfriSanitizer
