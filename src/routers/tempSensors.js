'use strict'

const errors = require('restify-errors')
const Router = require('restify-router').Router
const {sensors} = require('../../config.js').temperature

const router = new Router()
router.prefix = '/tempSensors'
require('restify-await-promise').install(router)

const TemperatureReader = require('../classes/temperature/TemperatureReader')
const TemperatureRepository = require('../classes/temperature/TemperatureRepository')

router.get('/', async () => Promise.all(
	sensors.map(async (sensor) => ({...sensor, celsiusValue: await TemperatureReader.readSensor(sensor.deviceId)}))
))

router.get('/:id', async (req) => {
	const sensor = sensors.find(sensor => sensor.id === parseInt(req.params.id))
	return sensor
		? {...sensor, celsiusValue: await TemperatureReader.readSensor(sensor.deviceId)}
		: new errors.NotFoundError(`sensor ID ${req.params.id} not found`)
})

router.get('/:id/history', async (req) =>
	TemperatureRepository.loadHistory(
		parseInt(req.params.id),
		parseInt(req.query.min),
		parseInt(req.query.max),
	))

module.exports = router
