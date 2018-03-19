const Router = require('restify-router').Router
const config = require('../config.json')
const execSync = require('child_process').execSync

const router = new Router()

// outlets

router.get('/outlet', (request, response, next) => {
	response.send(config.outlets)
	response.end()
	next()
})

router.put('/outlet/:id/:state', (request, response, next) => {
	let outlet = config.outlets[request.params.id]
	execSync(`codesend ${outlet[request.params.state]} ${outlet.protocol} ${outlet.pulseLength}`)
	response.send('OK')
	response.end()
	next()
})

module.exports = router
