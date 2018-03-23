'use strict'

const fs = require('fs')
const restify = require('restify')
const errors = require('restify-errors')

const dateFormat = require('dateformat')
const config = require('./config.json')

const routers = [
	require('./routes/rfoutlets'),
	require('./routes/tradfri'),
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
	log(`received request: ${request.method} ${request.getPath()}`)
	next()
})

server.use(restify.plugins.jsonBodyParser())

routers.forEach(/** @var Router */router => {
	router.applyRoutes(server, router.prefix)
})

server.listen(config.serverPort, () => {
	log('server started, listening on port ' + config.serverPort)
})

function log (message) {
	console.log(dateFormat(new Date(), '[yyyy-mm-dd HH:MM:ss] ') + message)
}
