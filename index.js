'use strict'

const fs = require('fs')
const get = require('lodash.get')
const restify = require('restify')
const corsMiddleware = require('restify-cors-middleware')
const errors = require('restify-errors')
const FauxMo = require('fauxmojs')
const dhcpSpy = require('dhcp-spy')

const config = require('./config.js')

process.env['AWS_SDK_LOAD_CONFIG'] = '1'
if (config.awsProfile) {
	process.env['AWS_PROFILE'] = config.awsProfile
}
const AWS = require('aws-sdk')

const Logger = require('./src/classes/Logger')
const RfController = require('./src/classes/RfController')
const RfSniffer = require('./src/classes/RfSniffer')
const TemperatureReader = require('./src/classes/TemperatureReader')

const rfController = new RfController(config.outlets)

const routers = [
	require('./src/routers/rfoutlets'),
	require('./src/routers/tradfri'),
	require('./src/routers/tempSensors'),
	require('./src/routers/shutters'),
]

const options = {}
if (get(config, 'ssl.certificateFile') && get(config, 'ssl.certificateKeyFile')) {
	options.certificate = fs.readFileSync(config.ssl.certificateFile)
	options.key = fs.readFileSync(config.ssl.certificateKeyFile)
} else {
	Logger.warn('SSL not configured, falling back to http')
}
const server = restify.createServer(options)

server.pre(restify.plugins.queryParser())

if (config.users && config.users.length) {
	server.pre((request, response, next) => {
		if (request.method === 'OPTIONS') {
			return next()
		}
		const apiUser = request.headers.apiuser || request.query.apiuser
		const apiKey  = request.headers.apikey  || request.query.apikey

		const user = config.users.find(user => user.id === apiUser && user.key === apiKey)
		if (!user) {
			return next(new errors.UnauthorizedError('nope!'))
		}
		next()
	})
} else {
	Logger.warn('No users configured -> API can be accessed by anyone!')
}

server.pre((request, response, next) => {
	Logger.debug(`received request: ${request.method} ${request.getPath()}`)
	next()
})

server.use(restify.plugins.jsonBodyParser())

let cors = corsMiddleware({
	origins: ['*'],
	allowHeaders: ['apiuser', 'apikey'],
})
server.pre(cors.preflight)
server.use(cors.actual)

server.get('/', (request, response, next) => {
	response.send(routers.map(router => router.prefix))
	response.end()
	next()
})

routers.forEach(/** @var Router */router => {
	router.applyRoutes(server, router.prefix)
})

server.listen(config.serverPort, () => {
	Logger.info('server started, listening on port ' + config.serverPort)
})

const fauxMoDevices = config.fauxMoDevices || []

if (config.outlets && config.outlets.length) {
	config.outlets
		.filter(o => o.hasOwnProperty('fauxmoPort'))
		.map(o => ({
			name: o.name,
			port: o.fauxmoPort,
			handler: (action) => {
				Logger.debug(`FauxMo device '${o.name}' switched ${action}`)
				rfController.switchOutlet(o.id, (action === 'on') ? 1 : 0)
			},
		}))
		.forEach(o => fauxMoDevices.push(o))
}

if (fauxMoDevices.length) {
	const fauxMo = new FauxMo({
		devices: fauxMoDevices,
	})
	Logger.info(`registered ${fauxMo.getNumberOfRegisteredDevices()} FauxMo devices`)
}

if (!config.cronjobs) {
	config.cronjobs = []
}

const temperatureRecordIntervalMinutes = get(config, 'temperature.recordIntervalMinutes')
const temperatureSensors = get(config, 'temperature.sensors')
const temperatureDynamoDbTable = get(config, 'temperature.dynamoDbTable')

if (temperatureRecordIntervalMinutes && temperatureSensors && temperatureSensors.length && temperatureDynamoDbTable) {
	const dynamoClient = new AWS.DynamoDB.DocumentClient()

	config.cronjobs.push({
		name: 'record temperature to DynamoDB',
		schedule: { second: '0', minute: `*/${temperatureRecordIntervalMinutes}`, hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' },
		callback: async () => {
			temperatureSensors.forEach(async (sensor) => {
				try {
					await dynamoClient.put({
						TableName: temperatureDynamoDbTable,
						Item: {
							sensorId: sensor.id,
							timestamp: Math.floor(Date.now() / 10000) * 10,
							val: await TemperatureReader.readSensor(sensor.deviceId),
						},
					}).promise()
				} catch (e) {
					console.log('failed reading temperature sensor: ', e)
				}
			})
		},
	})
}

if (config.rfButtons && config.rfButtons.length) {
	const sniffer = new RfSniffer(500)
	
	config.rfButtons.forEach(button => {
		sniffer.on(button.code, button.callback)
	})

	Logger.info(`registered ${config.rfButtons.length} RF buttons`)
	
	process.on('SIGINT', () => {
		sniffer.stop()
		process.exit()
	})
	
	process.on('SIGTERM', () => {
		sniffer.stop()
		process.exit()
	})
}

if (config.dashButtons && config.dashButtons.length) {
	dhcpSpy.listening.then(() => {
		Logger.info('Listening for DHCP requests')
	})

	config.dashButtons.forEach(button => {
		dhcpSpy.on(button.macAddress, () => {
			Logger.debug(`dash button "${button.label}" pressed`)
			button.callback()
		})
	})

	Logger.info(`registered ${config.dashButtons.length} Amazon Dash buttons`)
}

if (config.cronjobs && config.cronjobs.length) {
	const nodeCron = require('node-cron')
	config.cronjobs.forEach(cronJob => {
		const s = cronJob.schedule
		let scheduleString = `${s.minute} ${s.hour} ${s.dayOfMonth} ${s.month} ${s.dayOfWeek}`
		if (s.hasOwnProperty('second')) {
			scheduleString = `${s.second} ${scheduleString}`
		}
		return nodeCron.schedule(scheduleString, () => {
			Logger.info(`running cron job '${cronJob.name}'`)
			cronJob.callback()
		})
	})
}
