const sinon = require('sinon')
const chai = require('chai')

const TradfriClient = require('../src/classes/tradfri/TradfriClient')

describe('TradfriClient', () => {
	const sandbox = sinon.createSandbox()

	const tradfri = new TradfriClient('user', 'psk', 'gate.way')
	
	let requestStub

	beforeEach(() => {
		requestStub = sandbox.stub(tradfri, 'request')
	})

	afterEach(() => {
		sandbox.verifyAndRestore()
	})

	describe('devices', () => {
		const rawDevice1 = {
			'3': {
				'0': 'IKEA of Sweden',
				'1': 'TRADFRI remote control',
				'2': '',
				'3': '1.2.214',
				'6': 3,
				'9': 34,
			},
			'5750': 0,
			'9001': 'Remote AZ',
			'9002': 1513380504,
			'9003': 65536,
			'9019': 1,
			'9020': 1538262131,
			'9054': 0,
			'15009': [
				{
					'9003': 0,
				},
			],
		}
		const rawDevice2 = {
			'3': {
				'0': 'IKEA of Sweden',
				'1': 'TRADFRI bulb E27 WS opal 980lm',
				'2': '',
				'3': '1.2.217',
				'6': 1,
			},
			'3311': [
				{
					'5706': 'efd275',
					'5709': 30138,
					'5710': 26909,
					'5711': 454,
					'5717': 0,
					'5850': 0,
					'5851': 254,
					'9003': 0,
				},
			],
			'5750': 2,
			'9001': 'Decke AZ',
			'9002': 1513380565,
			'9003': 65537,
			'9019': 1,
			'9020': 1538258221,
			'9054': 0,
		}

		const sanitizedDevice1 = {
			id: 65536,
			type: 'remote',
			name: 'Remote AZ',
			model: 'TRADFRI remote control',
			firmware: '1.2.214',
		}
		const sanitizedDevice2 = {
			id: 65537,
			type: 'bulb',
			name: 'Decke AZ',
			state: 0,
			brightness: 254,
			model: 'TRADFRI bulb E27 WS opal 980lm',
			firmware: '1.2.217',
			bulbType: 'white-spectrum',
			color: 'warm',
		}
		
		describe('getDeviceIds()', () => {
			it('should call request() correctly and pass through its response', async () => {
				requestStub
					.withArgs('get', '15001')
					.resolves([65536, 65537, 65538])
				
				chai.assert.deepStrictEqual(await tradfri.getDeviceIds(), [65536, 65537, 65538])
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15001')
			})
		})
	
		describe('getDevice()', () => {
			beforeEach(() => {
				requestStub
					.withArgs('get', '15001/65536')
					.resolves(rawDevice1)
			})

			it('should call request() correctly and sanitize its response', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevice(65536), sanitizedDevice1)
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15001/65536')
			})

			it('should append raw data if requested', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevice(65536, true), { ...sanitizedDevice1, raw: rawDevice1 })
			})
		})
	
		describe('getDevices()', () => {
			beforeEach(() => {
				requestStub
					.withArgs('get', '15001')
					.resolves([65536, 65537])
					.withArgs('get', '15001/65536')
					.resolves(rawDevice1)
					.withArgs('get', '15001/65537')
					.resolves(rawDevice2)
			})

			it('should fetch the devices and aggregate them', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevices(), [sanitizedDevice1, sanitizedDevice2])
				sinon.assert.calledThrice(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15001')
				sinon.assert.calledWithExactly(requestStub, 'get', '15001/65536')
				sinon.assert.calledWithExactly(requestStub, 'get', '15001/65537')
			})

			it('should append raw data if requested', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevices(null, true), [
					{ ...sanitizedDevice1, raw: rawDevice1 },
					{ ...sanitizedDevice2, raw: rawDevice2 },
				])
			})
		})

		describe('getDeviceState()', () => {
			it('should return undefined for device #1', async () => {
				requestStub
					.withArgs('get', '15001/65536')
					.resolves(rawDevice1)

				chai.assert.strictEqual(await tradfri.getDeviceState(65536), undefined)
			})
			it('should return 0 for device #2', async () => {
				requestStub
					.withArgs('get', '15001/65537')
					.resolves(rawDevice2)

				chai.assert.strictEqual(await tradfri.getDeviceState(65537), 0)
			})
		})

		describe('setDeviceName()', () => {
			it('should send one PUT request to the correct path with the correct body', async () => {
				requestStub
					.withArgs('put', '15001/65537')
					.resolves('OK')
				await tradfri.setDeviceName(65537, 'foobar')

				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"9001":"foobar"}')
			})
		})

		describe('setDeviceState()', () => {
			it('should send one PUT request to the correct path with the correct body', async () => {
				requestStub
					.withArgs('put', '15001/65537')
					.resolves('OK')
				await tradfri.setDeviceState(65537, 1)
				
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5850":1}]}')
			})
		})

		describe('setDeviceBrightness()', () => {
			it('should send one PUT request to the correct path with the correct body', async () => {
				requestStub.resolves('OK')

				await tradfri.setDeviceBrightness(65537, 254)
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5851":254}]}')
			})
		})

		describe('setDeviceColor()', () => {
			beforeEach(() => {
				requestStub.resolves('OK')
			})

			it('should set the color "warm" correctly', async () => {
				await tradfri.setDeviceColor(65537, 'warm')
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5706":"efd275"}]}')
			})

			it('should set the color "neutral" correctly', async () => {
				await tradfri.setDeviceColor(65537, 'neutral')
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5706":"f1e0b5"}]}')
			})

			it('should set the color "cold" correctly', async () => {
				await tradfri.setDeviceColor(65537, 'cold')
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5706":"f5faf6"}]}')
			})
		})
	})

	describe('groups', () => {
		const rawGroup1 = {
			'5850': 0,
			'5851': 0,
			'9001': 'Arbeitszimmer',
			'9002': 1513380507,
			'9003': 131073,
			'9018': {
				'15002': {
					'9003': [
						65536,
						65537,
					],
				},
			},
			'9039': 196608,
			'9108': 0,
		}
		const rawGroup2 = {
			'5850': 0,
			'5851': 0,
			'9001': 'Schlafzimmer',
			'9002': 1514555198,
			'9003': 131075,
			'9018': {
				'15002': {
					'9003': [
						65538,
						65541,
						65556,
						65557,
					],
				},
			},
			'9039': 196614,
			'9108': 0,
		}
		
		const sanitizedGroup1 = {
			id: 131073,
			name: 'Arbeitszimmer',
			deviceIds: [65536, 65537],
		}
		const sanitizedGroup2 = {
			id: 131075,
			name: 'Schlafzimmer',
			deviceIds: [65538, 65541, 65556, 65557],
		}
		
		describe('getGroupIds()', () => {
			it('should call request() correctly and pass through its response', async () => {
				requestStub
					.withArgs('get', '15004')
					.resolves([131073, 131074, 131075])
	
				chai.assert.deepStrictEqual(await tradfri.getGroupIds(), [131073, 131074, 131075])
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15004')
			})
		})
	
		describe('getGroup()', () => {
			beforeEach(() => {
				requestStub
					.withArgs('get', '15004/131073')
					.resolves(rawGroup1)
			})

			it('should call request() correctly and pass through its response', async () => {
				chai.assert.deepStrictEqual(await tradfri.getGroup(131073), sanitizedGroup1)
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15004/131073')
			})

			it('should append raw data if requested', async () => {
				chai.assert.deepStrictEqual(await tradfri.getGroup(131073, true), { ...sanitizedGroup1, raw: rawGroup1 })
			})
		})
	
		describe('getGroups()', () => {
			beforeEach(() => {
				requestStub
					.withArgs('get', '15004')
					.resolves([131073, 131075])
					.withArgs('get', '15004/131073')
					.resolves(rawGroup1)
					.withArgs('get', '15004/131075')
					.resolves(rawGroup2)
			})

			it('should fetch the groups and aggregate them', async () => {
				chai.assert.deepStrictEqual(await tradfri.getGroups(), [sanitizedGroup1, sanitizedGroup2])
				sinon.assert.calledThrice(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15004')
				sinon.assert.calledWithExactly(requestStub, 'get', '15004/131073')
				sinon.assert.calledWithExactly(requestStub, 'get', '15004/131075')
			})

			it('should append raw data if requested', async () => {
				chai.assert.deepStrictEqual(await tradfri.getGroups(null, true), [
					{ ...sanitizedGroup1, raw: rawGroup1 },
					{ ...sanitizedGroup2, raw: rawGroup2 },
				])
			})
		})

		describe('setGroupState()', () => {
			it('should send one PUT request to the correct path with the correct body', async () => {
				requestStub
					.withArgs('put', '15004/131073')
					.resolves('OK')
				await tradfri.setGroupState(131073, 1)

				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15004/131073', '{"5850":1}')
			})
		})
	})

	describe('schedules', () => {
		const rawSchedule = {
			'5850': 0,
			'9002': 1513380759,
			'9003': 280397,
			'9040': 4,
			'9041': 31,
			'9042': {
				'5850': 1,
				'15013': [
					{
						'5712': 18000,
						'5851': 254,
						'9003': 65551,
					},
				],
			},
			'9044': [
				{
					'9046': 5,
					'9047': 45,
				},
			],
		}
		
		describe('getScheduleIds()', () => {
			it('should call request() correctly and pass through its response', async () => {
				requestStub
					.withArgs('get', '15010')
					.resolves([280397, 295373, 301852])

				chai.assert.deepStrictEqual(await tradfri.getScheduleIds(), [280397, 295373, 301852])
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15010')
			})
		})
		
		describe('getSchedule()', () => {
			it('should call request() correctly and pass through its response', async () => {
				requestStub
					.withArgs('get', '15010/280397')
					.resolves(rawSchedule)

				chai.assert.deepStrictEqual(await tradfri.getSchedule(280397), rawSchedule)
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15010/280397')
			})
		})

		describe('getSchedules()', () => {
			it('should fetch schedules', async () => {
				requestStub
					.withArgs('get', '15010')
					.resolves([280397])
					.withArgs('get', '15010/280397')
					.resolves(rawSchedule)

				chai.assert.deepStrictEqual(await tradfri.getSchedules(), [rawSchedule])
			})
		})
	})

	describe('mapColor()', () => {
		it('should map the colors correctly', async () => {
			chai.assert.deepStrictEqual(tradfri.mapColor('warm'), {5706: 'efd275'})
			chai.assert.deepStrictEqual(tradfri.mapColor('neutral'), {5706: 'f1e0b5'})
			chai.assert.deepStrictEqual(tradfri.mapColor('cold'), {5706: 'f5faf6'})
		})
	})

	describe('getRandomColor()', () => {
		it('should return a valid random color', async () => {
			chai.assert.include(['red', 'green', 'blue', 'yellow', 'pink', 'purple', 'orange'], tradfri.getRandomColor())
			sinon.assert.notCalled(requestStub)
		})
	})

	describe('convertTransitionTime()', () => {
		it('should convert the time correctly', async () => {
			chai.assert.equal(TradfriClient.convertTransitionTime(1, 'h'), 36000)
			chai.assert.equal(TradfriClient.convertTransitionTime(1, 'm'), 600)
			chai.assert.equal(TradfriClient.convertTransitionTime(1, 's'), 10)
			chai.assert.equal(TradfriClient.convertTransitionTime(1, 'ds'), 1)
			chai.assert.equal(TradfriClient.convertTransitionTime(100, 'ms'), 1)
		})
	})

})
