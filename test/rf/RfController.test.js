const sinon = require('sinon')
const chai = require('chai')

const OutletController = require('../../src/classes/rf/OutletController')

describe('OutletController', () => {

	const sandbox = sinon.createSandbox()

	const outletController = new OutletController([{
		id: 123,
		name: 'Outlet A',
		off: 12345678,
		on: 87654321,
		protocol: 0,
		pulseLength: 100,
		state: 0,
	}])

	let sendCodeStub, switchOutletSpy

	beforeEach(() => {
		sendCodeStub = sandbox.stub(outletController, 'exec')
		sendCodeStub.resolves('')

		switchOutletSpy = sandbox.spy(outletController, 'switchOutlet')
	})

	afterEach(() => {
		sandbox.verifyAndRestore()
	})

	describe('getOutlets()', () => {
		it('should return an array', () => {
			chai.assert.isArray(outletController.getOutlets())
		})
	})

	describe('switchOutlet()', () => {
		it('should send the right "ON" code', () => {
			outletController.switchOutlet(123, 1)

			sinon.assert.calledOnce(sendCodeStub)
			sinon.assert.calledWithExactly(sendCodeStub, `codesend 87654321 0 100`)
		})

		it('should send the right "OFF" code', () => {
			outletController.switchOutlet(123, 0)

			sinon.assert.calledOnce(sendCodeStub)
			sinon.assert.calledWithExactly(sendCodeStub, `codesend 12345678 0 100`)
		})
	})

	describe('toggleOutlet()', () => {
		it('should call toggle the state', () => {
			const expectedState = outletController.outlets[0].state ? 0 : 1
			outletController.toggleOutlet(123)

			sinon.assert.calledOnce(switchOutletSpy)
			sinon.assert.calledWithExactly(switchOutletSpy, 123, expectedState)
		})

		it('should call toggle the state again', () => {
			const expectedState = outletController.outlets[0].state ? 0 : 1
			outletController.toggleOutlet(123)

			sinon.assert.calledOnce(switchOutletSpy)
			sinon.assert.calledWithExactly(switchOutletSpy, 123, expectedState)
		})
	})
	
})
