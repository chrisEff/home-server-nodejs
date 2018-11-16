'use strict'

const Router = require('restify-router').Router
const RfController = require('../classes/RfController')

const router = new Router()
router.prefix = '/rfoutlets'
require('restify-await-promise').install(router)

const rfController = new RfController(require('../../config').outlets)

router.get('/', () => ['/outlet'])
router.get('/outlet', () => rfController.getOutlets())

router.put('/outlet/:id/:state', async (req) => {
	try {
		await rfController.switchOutlet(req.params.id, req.params.state)
		return 'OK'
	} catch (e) {
		console.log('codesend failed: ', e)
		throw e
	}
})

module.exports = router
