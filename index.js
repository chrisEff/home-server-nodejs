"use strict";

const restify = require('restify')
const errors = require('restify-errors')

const execSync = require('child_process').execSync
const dateFormat = require('dateformat')
const config = require('./config.json')

const Tradfri = require('./src/Tradfri.js')

const server = restify.createServer()
const tradfri = new Tradfri(config.tradfri.user, config.tradfri.psk, config.tradfri.gateway)

server.pre(restify.plugins.queryParser())
server.pre(function(request, response, next) {
	if (request.query.key !== config.superSecretKey) {
		return next(new errors.UnauthorizedError('nope!'))
	}
	log(`received request: ${request.method} ${request.getPath()}`)
	next()
})

server.use(restify.plugins.jsonBodyParser())


// devices

server.get('/device', (request, response, next) => {
	response.send(tradfri.getDevices())
	response.end()
	next()
})

server.get('/device/:id', (request, response, next) => {
	response.send(tradfri.getDevice(request.params.id))
	response.end()
	next()
})

server.put('/device/:id', (request, response, next) => {
	let state;
	if (request.body.hasOwnProperty('state')) {
		state = request.body.state
	} else {
		const deviceInfo = tradfri.getDevice(request.params.id)
		state = deviceInfo[3311][0][5850];
	}

	if (request.body.hasOwnProperty('color')) {
		tradfri.setDeviceColor(request.params.id, request.body.color)
	}
	
	if (request.body.hasOwnProperty('brightness')) {
		tradfri.setDeviceBrightness(request.params.id, request.body.brightness)
	}
	
	// Changing the brightness will set the state to on,
	// even if you explicitly want to set it to off or not change it at all.
	// So we set the state last in order to revert any unwanted changes.
	tradfri.setDeviceState(request.params.id, state)
	
	response.end()
	next()
})

function setBrightness(request, response, next) {
	response.send(tradfri.setDeviceBrightness(request.params.id, request.params.brightness, request.params.transitionTime, request.params.timeUnit))
	response.end()
	next()
}
server.put('/device/:id/brightness/:brightness', setBrightness)
server.put('/device/:id/brightness/:brightness/:transitionTime', setBrightness)
server.put('/device/:id/brightness/:brightness/:transitionTime/:timeUnit', setBrightness)

function setColor(request, response, next) {
	response.send(tradfri.setDeviceColor(request.params.id, request.params.color, request.params.transitionTime, request.params.timeUnit))
	response.end()
	next()
}
server.put('/device/:id/color/:color', setColor)
server.put('/device/:id/color/:color/:transitionTime', setColor)
server.put('/device/:id/color/:color/:transitionTime/:timeUnit', setColor)


// groups

server.get('/group', (request, response, next) => {
	response.send(tradfri.getGroups())
	response.end()
	next()
})

server.get('/group/:id', (request, response, next) => {
	response.send(tradfri.getGroup(request.params.id))
	response.end()
	next()
})

server.put('/group/:id/:state', (request, response, next) => {
	response.send(tradfri.setGroupState(request.params.id, request.params.state))
	response.end()
	next()
})


// schedules

server.get('/schedule', (request, response, next) => {
	response.send(tradfri.getSchedules()).end()
	response.end()
	next()
})

server.get('/schedule/:id', (request, response, next) => {
	response.send(tradfri.getSchedule(request.params.id))
	response.end()
	next()
})


// outlets

server.put('/outlet/:id/:state', (request, response, next) => {
	let outlet = config.outlets[request.params.id]
	execSync(`codesend ${outlet[request.params.state]} ${outlet.protocol} ${outlet.pulseLength}`)
	response.send('OK')
	response.end()
	next()
})

server.listen(config.serverPort, function () {
	log('server started, listening on port ' + config.serverPort)
})

function log(message) {
	console.log(dateFormat(new Date(), '[yyyy-mm-dd HH:MM:ss] ') + message)
}