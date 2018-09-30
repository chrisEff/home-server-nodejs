'use strict'

const fs = require('fs')
const get = require('lodash.get')
const restify = require('restify')
const corsMiddleware = require('restify-cors-middleware')
const errors = require('restify-errors')
const FauxMo = require('fauxmojs')
const dhcpSpy = require('dhcp-spy')

const config = require('./config.js')

const Logger = require('./src/classes/Logger')
const RfController = require('./src/classes/RfController')
const RfSniffer = require('./src/classes/RfSniffer')

const routers = [
	require('./src/routers/rfoutlets'),
	require('./src/routers/tradfri'),
	require('./src/routers/tempSensors'),
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
server.pre((request, response, next) => {
	if (request.query.key !== config.superSecretKey) {
		return next(new errors.UnauthorizedError('nope!'))
	}
	Logger.debug(`received request: ${request.method} ${request.getPath()}`)
	next()
})

server.use(restify.plugins.jsonBodyParser())

let cors = corsMiddleware({
	origins: ['*'],
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

const fauxMoDevices =  config.outlets
	.filter(o => o.hasOwnProperty('fauxmoPort'))
	.map(o => ({
		name: o.name,
		port: o.fauxmoPort,
		handler: (action) => {
			Logger.debug(`FauxMo device '${o.name}' switched ${action}`)
			RfController.switchOutlet(o.id, (action === 'on') ? 1 : 0)
		},
	}))

if (fauxMoDevices.length) {
	const fauxMo = new FauxMo({
		devices: fauxMoDevices,
	})
	Logger.info(`registered ${fauxMo.getNumberOfRegisteredDevices()} FauxMo devices`)
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

