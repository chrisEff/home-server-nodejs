'use strict'

const Router = require('restify-router').Router
const RfController = require('../classes/RfController')

const router = new Router()
router.prefix = '/rfoutlets'

// outlets

router.get('/', (request, response, next) => {
	response.send(['/outlet'])
	response.end()
	next()
})

router.get('/outlet', (request, response, next) => {
	response.send(RfController.getOutlets())
	response.end()
	next()
})

router.put('/outlet/:id/:state', async (request, response, next) => {
	try {
		await RfController.switchOutlet(request.params.id, request.params.state)
		response.send('OK')
	} catch (e) {
		console.log('codesend failed: ', e)
		response.send({error: e})
	} finally {
		response.end()
		next()
	}
})

module.exports = router
