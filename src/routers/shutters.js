'use strict'

const exec = require('child-process-promise').exec

const Router = require('restify-router').Router

const router = new Router()
router.prefix = '/shutters'
require('restify-await-promise').install(router)

const shutters = require('../../config').shutters

router.get('/', () => ['/shutter'])
router.get('/shutter', () => shutters)

router.put('/shutter/:id/up', async (req) => {
	try {
		const shutter = shutters.find(shutter => shutter.id === parseInt(req.params.id))
		await exec(`codesend ${shutter.codeUp} ${shutter.protocol}`)
		return 'OK'
	} catch (e) {
		console.log('codesend failed: ', e)
		throw e
	}
})

router.put('/shutter/:id/down', async (req) => {
	try {
		const shutter = shutters.find(shutter => shutter.id === parseInt(req.params.id))
		await exec(`codesend ${shutter.codeDown} ${shutter.protocol}`)
		return 'OK'
	} catch (e) {
		console.log('codesend failed: ', e)
		throw e
	}
})

module.exports = router

