'use strict'

const errors = require('restify-errors')
const Router = require('restify-router').Router
const {dynamoDbTable, sensors} = require('../../config.js').temperature

const router = new Router()
router.prefix = '/tempSensors'
require('restify-await-promise').install(router)

const TemperatureReader = require('../classes/TemperatureReader')
const AWS = require('aws-sdk')
const dynamoClient = new AWS.DynamoDB.DocumentClient()

router.get('/', async () => Promise.all(
	sensors.map(async (sensor) => ({...sensor, celsiusValue: await TemperatureReader.readSensor(sensor.deviceId)}))
))

router.get('/:id', async (req) => {
	const sensor = sensors.find(sensor => sensor.id === parseInt(req.params.id))
	return sensor
		? {...sensor, celsiusValue: await TemperatureReader.readSensor(sensor.deviceId)}
		: new errors.NotFoundError(`sensor ID ${req.params.id} not found`)
})

router.get('/:id/history', async (req) => {
	const response = await dynamoClient.query({
		TableName: dynamoDbTable,
		KeyConditionExpression: 'sensorId = :sensorId AND #timestamp BETWEEN :min AND :max',
		ExpressionAttributeNames: {
			'#timestamp': 'timestamp',
		},
		ExpressionAttributeValues: {
			':sensorId': parseInt(req.params.id),
			':min': parseInt(req.query.min) || 1500000000,
			':max': parseInt(req.query.max) || Math.floor(Date.now() / 1000),
		},
	}).promise()

	return response.Items.map(item => ({time: item.timestamp, val: item.val}))
})

module.exports = router
