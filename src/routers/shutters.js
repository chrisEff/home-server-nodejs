'use strict'

const Router = require('restify-router').Router
const ShutterController = require('../classes/rf/ShutterController')

const router = new Router()
router.prefix = '/shutters'
require('restify-await-promise').install(router)

const shutterController = new ShutterController(require('../../config').shutters)

router.get('/', () => ['/shutter'])
router.get('/shutter', () => shutterController.getShutters())

router.put('/shutter/:id/up', async (req) => {
	try {
		await shutterController.up(req.params.id)
		return 'OK'
	} catch (e) {
		console.log('codesend failed: ', e)
		throw e
	}
})

router.put('/shutter/:id/down', async (req) => {
	try {
		await shutterController.down(req.params.id)
		return 'OK'
	} catch (e) {
		console.log('codesend failed: ', e)
		throw e
	}
})

module.exports = router

