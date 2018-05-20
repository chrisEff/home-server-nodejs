module.exports = {
	superSecretKey: 'my-5up3r_53cr3t.KeY!!1',
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
	tempSensors: [
		{
			id: 1,
			name: 'Office',
			deviceId: '28-0000011a2b3f',
		},
	],
	rfButtons: [
		{
			id: 1,
			name: 'Remote Button #1',
			code: '12345678',
			callback: () => {
				const Tradfri = require('./src/Tradfri.js')
				const tradfri = new Tradfri(module.exports.tradfri.user, module.exports.tradfri.psk, module.exports.tradfri.gateway)
				tradfri.toggleDeviceState(65539)
			},
		},
	],
}
