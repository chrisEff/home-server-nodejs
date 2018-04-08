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
}