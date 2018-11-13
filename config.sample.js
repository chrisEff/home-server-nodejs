module.exports = {
	users: [
		{ id: 'admin', key: 'vpe485zgoe48nvpe485zbpvow4zpeo458' },
	],
	serverPort: 8080,
	logLevel: 'silly',
	ssl: {
		certificateFile: '/etc/letsencrypt/live/my.domain.com/fullchain.pem',
		certificateKeyFile: '/etc/letsencrypt/live/my.domain.com/privkey.pem',
	},
	tradfri: {
		user: 'someuser',
		psk: 'abcdEfgHijklMnOP',
		gateway: 'tradfri.fritz.box',
	},
	awsProfile: 'private', // leave blank for default
	outlets: [
		{
			id: 0,
			name: 'Power outlet #0',
			0: 12345678,
			1: 87654321,
			protocol: 0,
			pulseLength: 100,
			fauxmoPort: 11000, // optional: if set, outlet will be exposed as a fake WeMo ("FauxMo") device on the network under this port
		},
	],
	temperature: {
		recordIntervalMinutes: 5,
		dynamoDbTable: 'home-server_temperatures',
		sensors: [
			{
				id: 1,
				name: 'Office',
				deviceId: '28-0000011a2b3f',
			},
		],
	},
	rfButtons: [
		{
			id: 1,
			name: 'Remote Button #1',
			code: '12345678',
			callback: () => {
				const TradfriClient = require('./src/classes/tradfri/TradfriClient.js')
				const tradfri = new TradfriClient(module.exports.tradfri.user, module.exports.tradfri.psk, module.exports.tradfri.gateway)
				tradfri.toggleDeviceState(65539)
			},
		},
	],
	dashButtons: [
		{
			id: 1,
			macAddress: '01:23:45:67:89:0A',
			label: 'Afri Cola',
			callback: () => {
				const RfController = require('./src/classes/RfController')
				RfController.toggleOutlet(2)
			},
		},
	],
	cronjobs: [
		{
			name: 'do something every minute',
			schedule: {
				minute: '*',
				hour: '*',
				dayOfMonth: '*',
				month: '*',
				dayOfWeek: '*',
			},
			callback: () => {
				// do something
			},
		},
	],
}
