const sinon = require('sinon')
const chai = require('chai')

const TradfriClient = require('../../src/classes/tradfri/TradfriClient')

describe('TradfriClient', () => {
	const sandbox = sinon.createSandbox()

	let tradfri
	let requestStub

	beforeEach(() => {
		tradfri = new TradfriClient('user', 'psk', 'gate.way')
		requestStub = sandbox.stub(tradfri, 'request')
	})

	afterEach(() => {
		sandbox.verifyAndRestore()
	})

	describe('gateway', () => {
		const rawGatewayDetails = {
			'9023': '3.tradfri.pool.ntp.org',
			'9029': '1.4.15',
			'9054': 0,
			'9055': 0,
			'9059': 1542400053,
			'9060': '2018-11-16T20:27:33.054712Z',
			'9061': 0,
			'9062': 0,
			'9066': 5,
			'9069': 1530565455,
			'9071': 1,
			'9072': 3,
			'9073': 31,
			'9074': 1,
			'9075': 0,
			'9076': 10,
			'9077': 27,
			'9078': 1,
			'9079': 0,
			'9080': 60,
			'9081': '7e196d5204400158',
			'9082': true,
			'9083': '376-65-898',
			'9092': 1,
			'9093': 1,
			'9105': 1,
			'9106': 1,
			'9107': 0,
			'9200': 'ac83b910-7431-45f4-91c6-3c39512034f9',
		}

		describe('getGatewayDetails()', () => {
			it('should return the correct gateway details', async () => {
				requestStub
					.withArgs('get', '15011/15012')
					.resolves(rawGatewayDetails)

				chai.assert.deepStrictEqual(await tradfri.getGatewayDetails(), rawGatewayDetails)
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15011/15012')
			})
		})

		describe('rebootGateway()', () => {
			it('should reboot the gateway', async () => {
				requestStub
					.withArgs('post', '15011/9030')
					.resolves('OK')

				chai.assert.deepStrictEqual(await tradfri.rebootGateway(), 'OK')
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'post', '15011/9030')
			})
		})
	})

	describe('devices', () => {
		const rawDevice1 = require('./data/raw-device-remote')
		const rawDevice2 = require('./data/raw-device-bulb-white-spectrum')
		const rawDevice3 = require('./data/raw-device-bulb-rgb')

		const sanitizedDevice1 = require('./data/sanitized-device-remote')
		const sanitizedDevice2 = require('./data/sanitized-device-bulb-white-spectrum')
		const sanitizedDevice3 = require('./data/sanitized-device-bulb-rgb')
		
		describe('getDeviceIds()', () => {
			it('should call request() correctly and pass through its response', async () => {
				requestStub
					.withArgs('get', '15001')
					.resolves([sanitizedDevice1.id, sanitizedDevice2.id, sanitizedDevice3.id])
				
				chai.assert.deepStrictEqual(await tradfri.getDeviceIds(), [sanitizedDevice1.id, sanitizedDevice2.id, sanitizedDevice3.id])
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'get', '15001')
			})
		})
	
		describe('getDevice()', () => {
			beforeEach(() => {
				requestStub
					.withArgs('get', `15001/${sanitizedDevice1.id}`)
					.resolves(rawDevice1)
					.withArgs('get', `15001/${sanitizedDevice2.id}`)
					.resolves(rawDevice2)
					.withArgs('get', `15001/${sanitizedDevice3.id}`)
					.resolves(rawDevice3)
			});

			[
				{deviceId: sanitizedDevice1.id, expectedResult: sanitizedDevice1},
				{deviceId: sanitizedDevice2.id, expectedResult: sanitizedDevice2},
				{deviceId: sanitizedDevice3.id, expectedResult: sanitizedDevice3},
			].forEach(({deviceId, expectedResult}) => {
				it(`should correctly fetch and sanitize device #${deviceId}`, async () => {
					chai.assert.deepStrictEqual(await tradfri.getDevice(deviceId), expectedResult)
					sinon.assert.calledOnce(requestStub)
					sinon.assert.calledWithExactly(requestStub, 'get', `15001/${deviceId}`)
				})
			})

			it('should append raw data if requested', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevice(65536, true), {...sanitizedDevice1, raw: rawDevice1})
			})
		})
	
		describe('getDevices()', () => {
			beforeEach(() => {
				requestStub
					.withArgs('get', '15001')
					.resolves([sanitizedDevice1.id, sanitizedDevice2.id, sanitizedDevice3.id])
					.withArgs('get', `15001/${sanitizedDevice1.id}`)
					.resolves(rawDevice1)
					.withArgs('get', `15001/${sanitizedDevice2.id}`)
					.resolves(rawDevice2)
					.withArgs('get', `15001/${sanitizedDevice3.id}`)
					.resolves(rawDevice3)
			})

			it('should fetch the devices and aggregate them', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevices(), [sanitizedDevice1, sanitizedDevice2, sanitizedDevice3])
				chai.assert.equal(requestStub.callCount, 4)
				sinon.assert.calledWithExactly(requestStub, 'get', '15001')
				sinon.assert.calledWithExactly(requestStub, 'get', `15001/${sanitizedDevice1.id}`)
				sinon.assert.calledWithExactly(requestStub, 'get', `15001/${sanitizedDevice2.id}`)
				sinon.assert.calledWithExactly(requestStub, 'get', `15001/${sanitizedDevice3.id}`)
			})

			it('should append raw data if requested', async () => {
				chai.assert.deepStrictEqual(await tradfri.getDevices(null, null, true), [
					{...sanitizedDevice1, raw: rawDevice1},
					{...sanitizedDevice2, raw: rawDevice2},
					{...sanitizedDevice3, raw: rawDevice3},
				])
			})
		})

		describe('getDeviceState()', () => {
			it('should return undefined for device #1', async () => {
				requestStub
					.withArgs('get', `15001/${sanitizedDevice1.id}`)
					.resolves(rawDevice1)

				chai.assert.strictEqual(await tradfri.getDeviceState(sanitizedDevice1.id), sanitizedDevice1.state)
			})
			it('should return 0 for device #2', async () => {
				requestStub
					.withArgs('get', `15001/${sanitizedDevice2.id}`)
					.resolves(rawDevice2)

				chai.assert.strictEqual(await tradfri.getDeviceState(sanitizedDevice2.id), sanitizedDevice2.state)
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

		describe('toggleDeviceState()', () => {
			let getDeviceStateStub
			let setDeviceStateSpy

			beforeEach(() => {
				getDeviceStateStub = sandbox.stub(tradfri, 'getDeviceState')
				setDeviceStateSpy = sandbox.spy(tradfri, 'setDeviceState')
			})

			it('should set the state to 1 if it is 0', async () => {
				getDeviceStateStub.resolves(0)

				await tradfri.toggleDeviceState(65537)
				sinon.assert.calledOnce(setDeviceStateSpy)
				sinon.assert.calledWithExactly(setDeviceStateSpy, 65537, 1)
			})

			it('should set the state to 0 if it is 1', async () => {
				getDeviceStateStub.resolves(1)

				await tradfri.toggleDeviceState(65537)
				sinon.assert.calledOnce(setDeviceStateSpy)
				sinon.assert.calledWithExactly(setDeviceStateSpy, 65537, 0)
			})
		})

		describe('setDeviceBrightness()', () => {
			it('should send one PUT request to the correct path with the correct body', async () => {
				requestStub.resolves('OK')

				await tradfri.setDeviceBrightness(65537, 254)
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5851":254}]}')
			})

			it('should handle the transition time correctly', async () => {
				await tradfri.setDeviceBrightness(65537, 100, 500, 'ms')
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5712":5,"5851":100}]}')
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

			it('should handle the transition time correctly', async () => {
				await tradfri.setDeviceColor(65537, 'warm', 500, 'ms')
				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15001/65537', '{"3311":[{"5706":"efd275","5712":5}]}')
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
				chai.assert.deepStrictEqual(await tradfri.getGroup(131073, true), {...sanitizedGroup1, raw: rawGroup1})
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
					{...sanitizedGroup1, raw: rawGroup1},
					{...sanitizedGroup2, raw: rawGroup2},
				])
			})
		})

		describe('setGroupName()', () => {
			it('should set the name correctly', async () => {
				requestStub
					.withArgs('put', '15004/131073')
					.resolves('OK')
				await tradfri.setGroupName(131073, 'foobar')

				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15004/131073', '{"9001":"foobar"}')
			})
		})

		describe('setGroupState()', () => {
			it('should set the state correctly', async () => {
				requestStub
					.withArgs('put', '15004/131073')
					.resolves('OK')
				await tradfri.setGroupState(131073, 1)

				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15004/131073', '{"5850":1}')
			})
		})

		describe('setGroupBrightness()',  () => {
			beforeEach(() => {
				requestStub
					.withArgs('put', '15004/131073')
					.resolves('OK')
			})

			it('should set the brightness correctly', async () => {
				await tradfri.setGroupBrightness(131073, 128)

				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15004/131073', '{"5851":128}')
			})

			it('should handle the transition time correctly', async () => {
				await tradfri.setGroupBrightness(131073, 128, 500, 'ms')

				sinon.assert.calledOnce(requestStub)
				sinon.assert.calledWithExactly(requestStub, 'put', '15004/131073', '{"5712":5,"5851":128}')
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

	describe('disco()', () => {
		let setIntervalStub
		let clearIntervalStub
		let setTimeoutStub

		beforeEach(() => {
			setIntervalStub = sandbox.stub(tradfri, 'setInterval')
			clearIntervalStub = sandbox.stub(tradfri, 'clearInterval')
			setTimeoutStub = sandbox.stub(tradfri, 'setTimeout')
		})

		it('should set an interval when turning on', async () => {
			tradfri.disco([65537], true)

			sinon.assert.notCalled(clearIntervalStub)
			sinon.assert.notCalled(setTimeoutStub)
			sinon.assert.calledOnce(setIntervalStub)
			sinon.assert.calledWith(setIntervalStub, sinon.match.func)
		})

		it('should do nothing when turning on if already on', async () => {
			tradfri.discoInterval = 1
			tradfri.disco([65537], true)

			sinon.assert.notCalled(clearIntervalStub)
			sinon.assert.notCalled(setTimeoutStub)
			sinon.assert.notCalled(setIntervalStub)
		})

		it('should clear interval when turning off', async () => {
			tradfri.discoInterval = 1
			tradfri.disco([65537], false)

			sinon.assert.calledOnce(clearIntervalStub)
			sinon.assert.calledOnce(setTimeoutStub)
			sinon.assert.notCalled(setIntervalStub)
		})

		it('should do nothing when turning off if already off', async () => {
			tradfri.disco([65537], false)

			sinon.assert.notCalled(clearIntervalStub)
			sinon.assert.notCalled(setTimeoutStub)
			sinon.assert.notCalled(setIntervalStub)
		})
	})

	describe('mapColor()', () => {
		it('should map the colors correctly', async () => {
			chai.assert.deepStrictEqual(tradfri.mapColor('warm'), {5706: 'efd275'})
			chai.assert.deepStrictEqual(tradfri.mapColor('neutral'), {5706: 'f1e0b5'})
			chai.assert.deepStrictEqual(tradfri.mapColor('cold'), {5706: 'f5faf6'})
			chai.assert.deepStrictEqual(tradfri.mapColor('green'), {
				'5707': 20673,
				'5708': 65279,
				'5709': 19659,
				'5710': 39108,
			})
		})

		it('should throw an error for unknown colors', async () => {
			chai.assert.throws(() => tradfri.mapColor('foobar'), Error)
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

		it('should throw an error for unknown time units', async () => {
			chai.assert.throws(() => TradfriClient.convertTransitionTime(1, 'x'), Error)
		})
	})

})
