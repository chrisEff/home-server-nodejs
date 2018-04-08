'use strict'

const fs = require('fs')
const restify = require('restify')
const errors = require('restify-errors')
const Logger = require('./src/Logger')

const config = require('./config.js')

const routers = [
	require('./routers/rfoutlets'),
	require('./routers/tradfri'),
]

const options = {}
if (config.ssl.certificateFile && config.ssl.certificateKeyFile) {
	options.certificate = fs.readFileSync(config.ssl.certificateFile)
	options.key = fs.readFileSync(config.ssl.certificateKeyFile)
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
