'use strict'

const Router = require('restify-router').Router
const config = require('../config.js')
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

router.get('/device', async (request, response, next) => {
	response.send(await tradfri.getDevices())
	response.end()
	next()
})

router.get('/device/:id', async (request, response, next) => {
	response.send(await tradfri.getDevice(request.params.id))
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

router.put('/device', async (request, response, next) => {
	(await tradfri.getDeviceIds()).forEach(id => {
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

router.put('/device/:id/state/:state', async (request, response, next) => {
	response.send(await tradfri.setDeviceState(request.params.id, request.params.state))
	response.end()
	next()
})

async function setBrightness (request, response, next) {
	response.send(await tradfri.setDeviceBrightness(request.params.id, request.params.brightness, request.params.transitionTime, request.params.timeUnit))
	response.end()
	next()
}
router.put('/device/:id/brightness/:brightness', setBrightness)
router.put('/device/:id/brightness/:brightness/:transitionTime', setBrightness)
router.put('/device/:id/brightness/:brightness/:transitionTime/:timeUnit', setBrightness)

async function setColor (request, response, next) {
	response.send(await tradfri.setDeviceColor(request.params.id, request.params.color, request.params.transitionTime, request.params.timeUnit))
	response.end()
	next()
}
router.put('/device/:id/color/:color', setColor)
router.put('/device/:id/color/:color/:transitionTime', setColor)
router.put('/device/:id/color/:color/:transitionTime/:timeUnit', setColor)


// groups

router.get('/group', async (request, response, next) => {
	response.send(await tradfri.getGroups())
	response.end()
	next()
})

router.get('/group/:id', async (request, response, next) => {
	response.send(await tradfri.getGroup(request.params.id))
	response.end()
	next()
})

router.put('/group/:id/:state', async (request, response, next) => {
	response.send(await tradfri.setGroupState(request.params.id, request.params.state))
	response.end()
	next()
})


// schedules

router.get('/schedule', async (request, response, next) => {
	response.send(await tradfri.getSchedules()).end()
	response.end()
	next()
})

router.get('/schedule/:id', async (request, response, next) => {
	response.send(await tradfri.getSchedule(request.params.id))
	response.end()
	next()
})

module.exports = router
