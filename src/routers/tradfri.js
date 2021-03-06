'use strict'

const Router = require('restify-router').Router
const config = require('../../config.js')
const TradfriClient = require('../classes/tradfri/TradfriClient.js')
const hasOwnProperty = require('../helpers/hasOwnProperty')

const router = new Router()
router.prefix = '/tradfri'
require('restify-await-promise').install(router)

const tradfri = new TradfriClient(config.tradfri.user, config.tradfri.psk, config.tradfri.gateway)

router.get('/', () => ['/gateway', '/device', '/group', '/schedule'])

const toBool = (value) => !!value && value !== '0' && value !== 'false'

// gateway

router.get('/gateway', async () => tradfri.getGatewayDetails())
router.post('/gateway/reboot', async () => tradfri.rebootGateway())

// devices

router.get('/device',     async (req) => tradfri.getDevices(req.query.type, req.query.sortBy, toBool(req.query.withRaw)))
router.get('/device/:id', async (req) => tradfri.getDevice(req.params.id, toBool(req.query.withRaw)))

async function putDevice (device, body) {
	const state = hasOwnProperty(body, 'state') ? body.state : device.state

	if (hasOwnProperty(body, 'color'))      tradfri.setDeviceColor(device.id, body.color)
	if (hasOwnProperty(body, 'brightness')) tradfri.setDeviceBrightness(device.id, body.brightness)
	if (hasOwnProperty(body, 'name'))       tradfri.setDeviceName(device.id, body.name)

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
router.put('/device/:id/toggle',       async (req) => tradfri.toggleDeviceState(req.params.id))

router.put('/device/:id/brightness/:brightness',                           async (req) => tradfri.setDeviceBrightness(req.params.id, req.params.brightness))
router.put('/device/:id/brightness/:brightness/:transitionTime',           async (req) => tradfri.setDeviceBrightness(req.params.id, req.params.brightness, req.params.transitionTime))
router.put('/device/:id/brightness/:brightness/:transitionTime/:timeUnit', async (req) => tradfri.setDeviceBrightness(req.params.id, req.params.brightness, req.params.transitionTime, req.params.timeUnit))

router.put('/device/:id/color/:color',                           async (req) => tradfri.setDeviceColor(req.params.id, req.params.color))
router.put('/device/:id/color/:color/:transitionTime',           async (req) => tradfri.setDeviceColor(req.params.id, req.params.color, req.params.transitionTime))
router.put('/device/:id/color/:color/:transitionTime/:timeUnit', async (req) => tradfri.setDeviceColor(req.params.id, req.params.color, req.params.transitionTime, req.params.timeUnit))


// groups
router.get('/group',     async (req) => tradfri.getGroups(req.query.sortBy, toBool(req.query.withRaw)))
router.get('/group/:id', async (req) => tradfri.getGroup(req.params.id, toBool(req.query.withRaw)))

router.put('/group/:id/name/:name',   async (req) => tradfri.setGroupName(req.params.id, req.params.name))
router.put('/group/:id/state/:state', async (req) => tradfri.setGroupState(req.params.id, req.params.state))

router.put('/group/:id/brightness/:brightness',                           async (req) => tradfri.setGroupBrightness(req.params.id, req.params.brightness))
router.put('/group/:id/brightness/:brightness/:transitionTime',           async (req) => tradfri.setGroupBrightness(req.params.id, req.params.brightness, req.params.transitionTime))
router.put('/group/:id/brightness/:brightness/:transitionTime/:timeUnit', async (req) => tradfri.setGroupBrightness(req.params.id, req.params.brightness, req.params.transitionTime, req.params.timeUnit))

// PUT /group/:id/color/:color not implemented since it doesn't seem to be possible to set a group's color

// notifications
router.get('/notification', async (req) => tradfri.getNotifications(toBool(req.query.withRaw)))

// schedules
router.get('/schedule',     async ()    => tradfri.getSchedules())
router.get('/schedule/:id', async (req) => tradfri.getSchedule(req.params.id))

module.exports = router
