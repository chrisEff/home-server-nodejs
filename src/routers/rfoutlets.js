'use strict'

const Router = require('restify-router').Router
const OutletController = require('../classes/rf/OutletController')

const router = new Router()
router.prefix = '/rfoutlets'
require('restify-await-promise').install(router)

const outletController = new OutletController(require('../../config').outlets)

router.get('/', () => ['/outlet'])
router.get('/outlet', () => outletController.getOutlets())

router.put('/outlet/:id/:state', async (req) => {
	try {
		await outletController.switchOutlet(req.params.id, req.params.state)
		return 'OK'
	} catch (e) {
		console.log('codesend failed: ', e)
		throw e
	}
})

module.exports = router
