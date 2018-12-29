'use strict'

const TradfriClient = require('./src/classes/tradfri/TradfriClient.js')
const RfController = require('./src/classes/RfController')

const users = [
	// in order to be used as a GET param, key MUST NOT have the following characters in it:
	// ? & #
	{id: 'admin', key: 'vpe485zgoe48nvpe485zbpvow4zpeo458'},
]
const serverPort = 8080
const logLevel = 'silly'
const ssl = {
	certificateFile: '/etc/letsencrypt/live/my.domain.com/fullchain.pem',
	certificateKeyFile: '/etc/letsencrypt/live/my.domain.com/privkey.pem',
}
const awsProfile = 'private' // leave blank for default

const tradfri = {
	user: 'someuser',
	psk: 'abcdEfgHijklMnOP',
	gateway: 'tradfri.fritz.box',
}

const tradfriClient = new TradfriClient(tradfri.user, tradfri.psk, tradfri.gateway)

const outlets = [
	{
		id: 1,
		name: 'Power outlet #0',
		0: 12345678,
		1: 87654321,
		protocol: 0,
		pulseLength: 100,
		fauxmoPort: 11000, // optional: if set, outlet will be exposed as a fake WeMo ("FauxMo") device on the network under this port
	},
]

const rfController = new RfController(outlets)

const shutters = [
	{
		id: 1,
		name: 'Bedroom',
		codeUp: 12550316,
		codeDown: 11916668,
		protocol: 4,
	},
]

const temperature = {
	recordIntervalMinutes: 5,
	dynamoDbTable: 'home-server_temperatures',
	sensors: [
		{
			id: 1,
			name: 'Office',
			deviceId: '28-0000011a2b3f',
		},
	],
}

const rfButtons = [
	{
		id: 1,
		name: 'Remote Button #1',
		code: '12345678',
		callback: () => {
			tradfriClient.toggleDeviceState(65539)
		},
	},
]

const dashButtons = [
	{
		id: 1,
		macAddress: '01:23:45:67:89:0A',
		label: 'Afri Cola',
		callback: () => {
			rfController.toggleOutlet(2)
		},
	},
]
const cronjobs = [
	{
		name: 'turn off living room light at midnight',
		schedule: {
			minute: '0',
			hour: '0',
			dayOfMonth: '*',
			month: '*',
			dayOfWeek: '*',
		},
		callback: () => {
			// tradfriClient.setDeviceState(3, 0)
		},
	},
]

module.exports = {
	users,
	serverPort,
	logLevel,
	ssl,
	tradfri,
	awsProfile,
	outlets,
	shutters,
	temperature,
	rfButtons,
	dashButtons,
	cronjobs,
}
