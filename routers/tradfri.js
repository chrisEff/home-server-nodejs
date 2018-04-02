'use strict'

const Router = require('restify-router').Router
const config = require('../config.json')
const Tradfri = require('../src/Tradfri.js')

const router = new Router()
router.prefix = '/tradfri'

const tradfri = new Tradfri(config.tradfri.user, config.tradfri.psk, config.tradfri.gateway)

// devices

router.get('/', (request, response, next) => {
	response.send(['/device', '/group', '/schedule'])
	response.end()
	next()
})

router.get('/device', (request, response, next) => {
	response.send(tradfri.getDevices())
	response.end()
	next()
})

router.get('/device/:id', (request, response, next) => {
	response.send(tradfri.getDevice(request.params.id))
	response.end()
	next()
})

function putDevice (id, body) {
	let state
	if (body.hasOwnProperty('state')) {
		state = body.state
	} else {
		const deviceInfo = tradfri.getDevice(id)
		state = deviceInfo[3311][0][5850]
	}

	if (body.hasOwnProperty('color')) {
		tradfri.setDeviceColor(id, body.color)
	}

	if (body.hasOwnProperty('brightness')) {
		tradfri.setDeviceBrightness(id, body.brightness)
	}

	// Changing the brightness will set the state to on,
	// even if you explicitly want to set it to off or not change it at all.
	// So we set the state last in order to revert any unwanted changes.
	tradfri.setDeviceState(id, state)
}

router.put('/device', (request, response, next) => {
	tradfri.getDeviceIds().forEach(id => {
		putDevice(id, request.body)
	})

	response.end()
	next()
})

router.put('/device/:id', (request, response, next) => {
	putDevice(request.params.id, request.body)

	response.end()
	next()
})

function setBrightness (request, response, next) {
	response.send(tradfri.setDeviceBrightness(request.params.id, request.params.brightness, request.params.transitionTime, request.params.timeUnit))
	response.end()
	next()
}
router.put('/device/:id/brightness/:brightness', setBrightness)
router.put('/device/:id/brightness/:brightness/:transitionTime', setBrightness)
router.put('/device/:id/brightness/:brightness/:transitionTime/:timeUnit', setBrightness)

function setColor (request, response, next) {
	response.send(tradfri.setDeviceColor(request.params.id, request.params.color, request.params.transitionTime, request.params.timeUnit))
	response.end()
	next()
}
router.put('/device/:id/color/:color', setColor)
router.put('/device/:id/color/:color/:transitionTime', setColor)
router.put('/device/:id/color/:color/:transitionTime/:timeUnit', setColor)


// groups

router.get('/group', (request, response, next) => {
	response.send(tradfri.getGroups())
	response.end()
	next()
})

router.get('/group/:id', (request, response, next) => {
	response.send(tradfri.getGroup(request.params.id))
	response.end()
	next()
})

router.put('/group/:id/:state', (request, response, next) => {
	response.send(tradfri.setGroupState(request.params.id, request.params.state))
	response.end()
	next()
})


// schedules

router.get('/schedule', (request, response, next) => {
	response.send(tradfri.getSchedules()).end()
	response.end()
	next()
})

router.get('/schedule/:id', (request, response, next) => {
	response.send(tradfri.getSchedule(request.params.id))
	response.end()
	next()
})

module.exports = router
