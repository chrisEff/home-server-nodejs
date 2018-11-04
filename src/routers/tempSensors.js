'use strict'

const errors = require('restify-errors')
const fs = require('fs-extra')

const Router = require('restify-router').Router
const sensors = require('../../config.js').tempSensors

const router = new Router()
router.prefix = '/tempSensors'
require('restify-await-promise').install(router)

router.get('/', async () => Promise.all(
	sensors.map(async (sensor) => ({ ...sensor, celsiusValue: await readSensor(sensor.deviceId) }))
))

router.get('/:id', async (req) => {
	const sensor = sensors.find(sensor => sensor.id === parseInt(req.params.id))
	return sensor
		? { ...sensor, celsiusValue: await readSensor(sensor.deviceId) }
		: new errors.NotFoundError(`sensor ID ${req.params.id} not found`)
})

const readSensor = async (deviceId) => {
	const lines = (await fs.readFile(`/sys/bus/w1/devices/${deviceId}/w1_slave`, 'utf8')).trim().split('\n')
	if (lines.length === 2 && lines[0].endsWith(' YES')) {
		const match = lines[1].match(/^(?:[0-9a-f]{2} )+t=([0-9]+)$/)
		if (match) {
			return match[1] / 1000
		}
	}
	return null
}

module.exports = router
