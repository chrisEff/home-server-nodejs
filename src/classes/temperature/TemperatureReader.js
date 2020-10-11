'use strict'

const fs = require('fs-extra')

class TemperatureReader {
	static async readSensor(deviceId) {
		const lines = (await fs.readFile(`/sys/bus/w1/devices/${deviceId}/w1_slave`, 'utf8'))
			.trim()
			.split('\n')
		if (lines.length === 2 && lines[0].endsWith(' YES')) {
			const match = lines[1].match(/^(?:[0-9a-f]{2} )+t=([0-9]+)$/)
			if (match) {
				return match[1] / 1000
			}
		}
		return null
	}
}

module.exports = TemperatureReader
