const assert = require('assert')
const sinon = require('sinon')
const chai = require('chai')

const Tradfri = require('../src/classes/Tradfri')

describe('Tradfri', () => {
	const sandbox = sinon.createSandbox()

	const tradfri = new Tradfri('user', 'psk', 'gate.way')
	
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
		raw: rawDevice1,
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
		raw: rawDevice2,
	}

	beforeEach(() => {
	})

	afterEach(() => {
		sandbox.verifyAndRestore()
	})

	describe('getDeviceIds()', () => {
		it('should call request() correctly and pass through its response', () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15001`)
				.returns([65536, 65537, 65538])
			
			assert.deepStrictEqual(tradfri.getDeviceIds(), [65536, 65537, 65538])
		})
	})

	describe('getDevice()', () => {
		it('should call request() correctly and sanitize its response', async () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15001/65536`)
				.returns(rawDevice1)
			
			assert.deepStrictEqual(await tradfri.getDevice(65536), sanitizedDevice1)
		})
	})

	describe('getDevices()', () => {
		it('should fetch the devices and aggregate them', async () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15001`)
				.returns([65536, 65537])
				.withArgs('get', `15001/65536`)
				.returns(rawDevice1)
				.withArgs('get', `15001/65537`)
				.returns(rawDevice2)

			assert.deepStrictEqual(await tradfri.getDevices(), {65536: sanitizedDevice1, 65537: sanitizedDevice2})
		})
	})

	describe('getGroupIds()', () => {
		it('should call request() correctly and pass through its response', () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15004`)
				.returns([131073, 131074, 131075])

			assert.deepStrictEqual(tradfri.getGroupIds(), [131073, 131074, 131075])
		})
	})

	describe('getGroup()', () => {
		it('should call request() correctly and pass through its response', () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15004/131073`)
				.returns({foo: 'bar'})

			assert.deepStrictEqual(tradfri.getGroup(131073), {foo: 'bar'})
		})
	})

	describe('getGroups()', () => {
		it('should fetch the groups and aggregate them', async () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15004`)
				.returns([131073])
				.withArgs('get', `15004/131073`)
				.returns({foo: 'bar'})

			assert.deepStrictEqual(await tradfri.getGroups(), {131073: {foo: 'bar'}})
		})
	})

	describe('getRandomColor()', () => {
		it('should return a valid random color', async () => {
			chai.assert.include(['red', 'green', 'blue', 'yellow', 'pink', 'purple'], tradfri.getRandomColor())
		})
	})

})
