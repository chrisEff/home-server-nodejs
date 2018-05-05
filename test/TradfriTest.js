const assert = require('assert')
const sinon = require('sinon')
const chai = require('chai')

const Tradfri = require('../src/Tradfri')

describe('Tradfri', () => {
	const sandbox = sinon.createSandbox()

	const tradfri = new Tradfri('user', 'psk', 'gate.way')

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
			
			assert.deepEqual(tradfri.getDeviceIds(), [65536, 65537, 65538])
		})
	})

	describe('getDevice()', () => {
		it('should call request() correctly and pass through its response', () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15001/65536`)
				.returns({foo: 'bar'})
			
			assert.deepEqual(tradfri.getDevice(65536), {foo: 'bar'})
		})
	})

	describe('getDevices()', () => {
		it('should fetch the devices and aggregate them', async () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15001`)
				.returns([65536])
				.withArgs('get', `15001/65536`)
				.returns({foo: 'bar'})

			assert.deepEqual(await tradfri.getDevices(), {65536: {foo: 'bar'}})
		})
	})

	describe('getGroupIds()', () => {
		it('should call request() correctly and pass through its response', () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15004`)
				.returns([131073, 131074, 131075])

			assert.deepEqual(tradfri.getGroupIds(), [131073, 131074, 131075])
		})
	})

	describe('getGroup()', () => {
		it('should call request() correctly and pass through its response', () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15004/131073`)
				.returns({foo: 'bar'})

			assert.deepEqual(tradfri.getGroup(131073), {foo: 'bar'})
		})
	})

	describe('getGroups()', () => {
		it('should fetch the groups and aggregate them', async () => {
			sandbox.stub(tradfri, 'request')
				.withArgs('get', `15004`)
				.returns([131073])
				.withArgs('get', `15004/131073`)
				.returns({foo: 'bar'})

			assert.deepEqual(await tradfri.getGroups(), {131073: {foo: 'bar'}})
		})
	})

	describe('getRandomColor()', () => {
		it('should return a valid random color', async () => {
			chai.assert.include(['red', 'green', 'blue', 'yellow', 'pink', 'purple'], tradfri.getRandomColor())
		})
	})

})
