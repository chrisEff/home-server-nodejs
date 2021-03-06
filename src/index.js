'use strict'

const fs = require('fs')
const get = require('lodash.get')
const restify = require('restify')
const corsMiddleware = require('restify-cors-middleware')
const errors = require('restify-errors')
const wemore = require('wemore')
const dhcpSpy = require('dhcp-spy')
const path = require('path')

const config = require('../config.js')
const hasOwnProperty = require('./helpers/hasOwnProperty')

process.env.AWS_SDK_LOAD_CONFIG = '1'
if (config.awsProfile) {
	process.env.AWS_PROFILE = config.awsProfile
}

const Logger = require('./classes/Logger')
const OutletController = require('./classes/rf/OutletController')
const ShutterController = require('./classes/rf/ShutterController')
const RfSniffer = require('./classes/RfSniffer')

const outletController = new OutletController(config.outlets)
const shutterController = new ShutterController(config.shutters)

const routers = [
	require('./routers/rfoutlets'),
	require('./routers/tradfri'),
	require('./routers/tempSensors'),
	require('./routers/shutters'),
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
		const apiKey = request.headers.apikey || request.query.apikey

		const user = config.users.find((user) => user.id === apiUser && user.key === apiKey)
		if (!user) {
			return next(new errors.UnauthorizedError('nope!'))
		}
		next()
	})
} else {
	Logger.warn('No users configured -> API can be accessed by anyone!')
}

server.pre((request, response, next) => {
	Logger.debug('received request', {
		method: request.method,
		path: request.getPath(),
		query: {
			...request.query,
			apikey: request.query.apikey ? 'XXX' : undefined,
		},
		headers: {
			...request.headers,
			apikey: request.headers.apikey ? 'XXX' : undefined,
		},
	})
	next()
})

server.use(restify.plugins.jsonBodyParser())

const cors = corsMiddleware({
	origins: ['*'],
	allowHeaders: ['apiuser', 'apikey'],
})
server.pre(cors.preflight)
server.use(cors.actual)

server.get('/', (request, response, next) => {
	response.send(routers.map((router) => router.prefix))
	response.end()
	next()
})

routers.forEach(
	/** @var Router */ (router) => {
		router.applyRoutes(server, router.prefix)
	},
)

server.listen(config.serverPort, () => {
	Logger.info('server started, listening on port ' + config.serverPort)
})

const fauxMoDevices = []

if (config.outlets && config.outlets.length) {
	config.outlets
		.filter((o) => hasOwnProperty(o, 'fauxmoPort'))
		.map((o) => ({
			name: o.name,
			port: o.fauxmoPort,
			handler: (action) => {
				Logger.debug(`FauxMo device '${o.name}' switched ${action}`)
				outletController.switchOutlet(o.id, action ? 1 : 0)
			},
		}))
		.forEach((o) => fauxMoDevices.push(o))
}

if (config.shutters && config.shutters.length) {
	config.shutters
		.filter((s) => hasOwnProperty(s, 'fauxmoPort'))
		.map((s) => ({
			name: s.name,
			port: s.fauxmoPort,
			handler: (action) => {
				if (action) shutterController.up(s.id)
				else shutterController.down(s.id)
			},
		}))
		.forEach((o) => fauxMoDevices.push(o))
}

if (fauxMoDevices.length) {
	fauxMoDevices.forEach((device) => {
		const wemoEmulator = wemore.Emulate({
			friendlyName: device.name,
			port: device.port,
		})
		wemoEmulator.on('state', device.handler)
	})
	Logger.info(
		`registered ${fauxMoDevices.length} (fake) WeMo devices: (${fauxMoDevices
			.map((d) => d.name)
			.join(',')})`,
	)
}

if (!config.cronjobs) {
	config.cronjobs = []
}

const temperatureRecordIntervalMinutes = get(config, 'temperature.recordIntervalMinutes')
const temperatureSensors = get(config, 'temperature.sensors')
const temperatureDynamoDbTable = get(config, 'temperature.dynamoDbTable')

if (
	temperatureRecordIntervalMinutes &&
	temperatureSensors &&
	temperatureSensors.length &&
	temperatureDynamoDbTable
) {
	const TemperatureReader = require('./classes/temperature/TemperatureReader')
	const TemperatureRepository = require('./classes/temperature/TemperatureRepository')

	config.cronjobs.push({
		name: 'record temperature to DynamoDB',
		schedule: {
			second: '0',
			minute: `*/${temperatureRecordIntervalMinutes}`,
			hour: '*',
			dayOfMonth: '*',
			month: '*',
			dayOfWeek: '*',
		},
		action: async () => {
			temperatureSensors.forEach(async (sensor) => {
				try {
					await TemperatureRepository.save(
						sensor.id,
						Math.floor(Date.now() / 10000) * 10,
						await TemperatureReader.readSensor(sensor.deviceId),
					)
				} catch (e) {
					console.log('failed reading temperature sensor: ', e)
				}
			})
		},
	})
}

if (
	(config.rfButtons && config.rfButtons.length) ||
	(config.windowSensors && config.windowSensors.length)
) {
	const sniffer = new RfSniffer(500, path.join(__dirname, '../433Utils/RPi_utils', 'RFSniffer'))

	config.rfButtons.forEach((button) => {
		sniffer.on(button.code, button.action)
	})

	Logger.info(`registered ${config.rfButtons.length} RF buttons`)

	config.windowSensors.forEach((sensor) => {
		sniffer.on(sensor.codeOpened, () => sensor.action(true))
		sniffer.on(sensor.codeClosed, () => sensor.action(false))
	})

	Logger.info(`registered ${config.windowSensors.length} window sensors`)

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

	config.dashButtons.forEach((button) => {
		dhcpSpy.on(button.macAddress, () => {
			Logger.debug(`dash button "${button.label}" pressed`)
			button.action()
		})
	})

	Logger.info(`registered ${config.dashButtons.length} Amazon Dash buttons`)
}

if (config.cronjobs && config.cronjobs.length) {
	const nodeCron = require('node-cron')
	config.cronjobs.forEach((cronJob) => {
		const s = cronJob.schedule
		let scheduleString = `${s.minute} ${s.hour} ${s.dayOfMonth} ${s.month} ${s.dayOfWeek}`
		if (Object.prototype.hasOwnProperty.call(s, 'second')) {
			scheduleString = `${s.second} ${scheduleString}`
		}
		return nodeCron.schedule(scheduleString, async () => {
			Logger.debug(`cron job '${cronJob.name}' invoked`)
			try {
				await Promise.resolve(cronJob.action())
				Logger.debug(`cron job '${cronJob.name}' done`)
			} catch (error) {
				Logger.error(`cron job '${cronJob.name}' failed`, { error })
			}
		})
	})
}
