'use strict'

const errors = require('restify-errors')
const fs = require('fs-extra')

const Router = require('restify-router').Router
const sensors = require('../config.js').tempSensors

const router = new Router()
router.prefix = '/tempSensors'

router.get('/:id', async (request, response, next) => {
	const sensor = sensors.find(sensor => sensor.id === parseInt(request.params.id))
	if (!sensor) {
		return next(new errors.NotFoundError(`sensor ID ${request.params.id} not found`))
	}
	sensor.celsiusValue = await readSensor(sensor.deviceId)

	response.send(sensor)
	response.end()
	next()
})

const readSensor = async (deviceId) => {
	const lines = (await fs.readFile(`/sys/bus/w1/devices/${deviceId}/w1_slave`, 'utf8')).trim().split('\n')
	console.log(lines)
	if (lines.length === 2 && lines[0].endsWith(' YES')) {
		const match = lines[1].match(/^(?:[0-9a-f]{2} )+t=([0-9]+)$/)
		if (match) {
			return match[1] / 1000
		}
	}
	return null
}

module.exports = router
