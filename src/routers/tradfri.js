'use strict'

const restifyPromise = require('restify-await-promise')

const Router = require('restify-router').Router
const config = require('../../config.js')
const TradfriClient = require('../classes/tradfri/TradfriClient.js')

const router = new Router()
router.prefix = '/tradfri'
restifyPromise.install(router)

const tradfri = new TradfriClient(config.tradfri.user, config.tradfri.psk, config.tradfri.gateway)

router.get('/', () => ['/gateway', '/device', '/group', '/schedule'])


// gateway

router.get('/gateway', async () => tradfri.getGatewayDetails())
router.post('/gateway/reboot', async () => tradfri.rebootGateway())


// devices

router.get('/device',     async ()    => tradfri.getDevices())
router.get('/device/:id', async (req) => tradfri.getDevice(req.params.id))

async function putDevice (device, body) {
	const state = body.hasOwnProperty('state') ? body.state : device.state

	if (body.hasOwnProperty('color'))      tradfri.setDeviceColor(device.id, body.color)
	if (body.hasOwnProperty('brightness')) tradfri.setDeviceBrightness(device.id, body.brightness)
	if (body.hasOwnProperty('name'))       tradfri.setDeviceName(device.id, body.name)

	// Changing the brightness will set the state to on,
	// even if you explicitly want to set it to off or not change it at all.
	// So we set the state last in order to revert any unwanted changes.
	setTimeout(() => tradfri.setDeviceState(device.id, state), 50)
}

router.put('/device', async (req) => (await tradfri.getDevices())
	.filter(device => device.type === 'bulb')
	.forEach(device => putDevice(device, req.body)))

router.put('/device/:id', async (req) => putDevice((await tradfri.getDevice(req.params.id)), req.body))

router.put('/device/:id/name/:name',   async (req) => tradfri.setDeviceName(req.params.id, req.params.name))
router.put('/device/:id/state/:state', async (req) => tradfri.setDeviceState(req.params.id, req.params.state))

router.put('/device/:id/brightness/:brightness',                           async (req) => tradfri.setDeviceBrightness(req.params.id, req.params.brightness))
router.put('/device/:id/brightness/:brightness/:transitionTime',           async (req) => tradfri.setDeviceBrightness(req.params.id, req.params.brightness, req.params.transitionTime))
router.put('/device/:id/brightness/:brightness/:transitionTime/:timeUnit', async (req) => tradfri.setDeviceBrightness(req.params.id, req.params.brightness, req.params.transitionTime, req.params.timeUnit))

router.put('/device/:id/color/:color',                           async (req) => tradfri.setDeviceColor(req.params.id, req.params.color))
router.put('/device/:id/color/:color/:transitionTime',           async (req) => tradfri.setDeviceColor(req.params.id, req.params.color, req.params.transitionTime))
router.put('/device/:id/color/:color/:transitionTime/:timeUnit', async (req) => tradfri.setDeviceColor(req.params.id, req.params.color, req.params.transitionTime, req.params.timeUnit))


// groups
router.get('/group',     async ()    => tradfri.getGroups())
router.get('/group/:id', async (req) => tradfri.getGroup(req.params.id))

router.put('/group/:id/name/:name',   async (req) => tradfri.setGroupName(req.params.id, req.params.name))
router.put('/group/:id/state/:state', async (req) => tradfri.setGroupState(req.params.id, req.params.state))

router.put('/group/:id/brightness/:brightness',                           async (req) => tradfri.setGroupBrightness(req.params.id, req.params.brightness))
router.put('/group/:id/brightness/:brightness/:transitionTime',           async (req) => tradfri.setGroupBrightness(req.params.id, req.params.brightness, req.params.transitionTime))
router.put('/group/:id/brightness/:brightness/:transitionTime/:timeUnit', async (req) => tradfri.setGroupBrightness(req.params.id, req.params.brightness, req.params.transitionTime, req.params.timeUnit))

router.put('/group/:id/color/:color',                           async (req) => tradfri.setGroupColor(req.params.id, req.params.color))
router.put('/group/:id/color/:color/:transitionTime',           async (req) => tradfri.setGroupColor(req.params.id, req.params.color, req.params.transitionTime))
router.put('/group/:id/color/:color/:transitionTime/:timeUnit', async (req) => tradfri.setGroupColor(req.params.id, req.params.color, req.params.transitionTime, req.params.timeUnit))


// schedules
router.get('/schedule',     async ()    => tradfri.getSchedules())
router.get('/schedule/:id', async (req) => tradfri.getSchedule(req.params.id))

module.exports = router
