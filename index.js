'use strict'

const fs = require('fs')
const get = require('lodash.get')
const restify = require('restify')
const errors = require('restify-errors')
const Logger = require('./src/Logger')
const FauxMo = require('fauxmojs')
const RfController = require('./src/RfController')

const config = require('./config.js')

const routers = [
	require('./routers/rfoutlets'),
	require('./routers/tradfri'),
	require('./routers/tempSensors'),
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
			RfController.switchOutlet(1, (action === 'on') ? 1 : 0)
		},
	}))

if (fauxMoDevices.length) {
	const fauxMo = new FauxMo({
		devices: fauxMoDevices,
	})
	Logger.info(`registered ${fauxMo.getNumberOfRegisteredDevices()} FauxMo devices`)
}

