const debounce = require('lodash.debounce')
const spawn = require('child_process').spawn
const EventEmitter = require('events').EventEmitter

const Logger = require('./Logger')

class RfSniffer extends EventEmitter {
	constructor(debounceDelay, pathToExecutable = 'RFSniffer') {
		super()
		this.process = spawn(pathToExecutable)

		this.process.stdout.on(
			'data',
			debounce((buffer) => {
				const data = buffer.toString().trim()
				if (data.startsWith('Received ')) {
					const code = data.substr(9)
					Logger.debug(`RfSniffer received code: ${code}`)
					this.emit(code)
				} else {
					Logger.error(`RfSniffer received unrecognized data: ${data}`)
				}
			}, debounceDelay),
		)

		this.process.stderr.on('data', (buffer) => {
			this.emit('error', buffer.toString())
		})

		Logger.info('RfSniffer initialized, listening for events')
	}

	stop() {
		this.process.kill()
	}
}

module.exports = RfSniffer
