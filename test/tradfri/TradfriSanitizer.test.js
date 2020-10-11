const sinon = require('sinon')
const chai = require('chai')
const deepFreeze = require('deep-freeze-strict')

const TradfriSanitizer = require('../../src/classes/tradfri/TradfriSanitizer')

describe('TradfriSanitizer', () => {
	const sandbox = sinon.createSandbox()

	beforeEach(() => {})

	afterEach(() => {
		sandbox.verifyAndRestore()
	})

	describe('sanitizeDevice', () => {
		it('should correctly sanitize a remote', async () => {
			const raw = require('./data/raw-device-remote')
			const sanitized = require('./data/sanitized-device-remote')

			chai.assert.deepStrictEqual(TradfriSanitizer.sanitizeDevice(deepFreeze(raw)), sanitized)
		})

		it('should correctly sanitize a white-spectrum bulb', async () => {
			const raw = require('./data/raw-device-bulb-white-spectrum')
			const sanitized = require('./data/sanitized-device-bulb-white-spectrum')

			chai.assert.deepStrictEqual(TradfriSanitizer.sanitizeDevice(deepFreeze(raw)), sanitized)
		})

		it('should correctly sanitize an rgb bulb', async () => {
			const raw = require('./data/raw-device-bulb-rgb')
			const sanitized = require('./data/sanitized-device-bulb-rgb')

			chai.assert.deepStrictEqual(TradfriSanitizer.sanitizeDevice(deepFreeze(raw)), sanitized)
		})

		it('should correctly sanitize a motion sensor', async () => {
			const raw = require('./data/raw-device-motion-sensor')
			const sanitized = require('./data/sanitized-device-motion-sensor')

			chai.assert.deepStrictEqual(TradfriSanitizer.sanitizeDevice(deepFreeze(raw)), sanitized)
		})
	})

	describe('getColorByHex', () => {
		it('should return the correct color names', async () => {
			chai.assert.equal(TradfriSanitizer.getColorByHex('efd275'), 'warm')
			chai.assert.equal(TradfriSanitizer.getColorByHex('f1e0b5'), 'neutral')
			chai.assert.equal(TradfriSanitizer.getColorByHex('f5faf6'), 'cold')
			chai.assert.equal(TradfriSanitizer.getColorByHex('d6e44b'), 'yellow')
			chai.assert.equal(TradfriSanitizer.getColorByHex('d9337c'), 'pink')
			chai.assert.equal(TradfriSanitizer.getColorByHex('8f2686'), 'purple')
			chai.assert.equal(TradfriSanitizer.getColorByHex('e78834'), 'orange')
			chai.assert.equal(TradfriSanitizer.getColorByHex('e8bedd'), 'lightPink')
			chai.assert.equal(TradfriSanitizer.getColorByHex('c984bb'), 'lightPurple')
			chai.assert.equal(TradfriSanitizer.getColorByHex('dcf0f8'), 'coldSky')
			chai.assert.equal(TradfriSanitizer.getColorByHex('invalid'), undefined)
		})
	})

	describe('getColorByHueSaturationXY', () => {
		it('should return the correct color names', async () => {
			chai.assert.equal(
				TradfriSanitizer.getColorByHueSaturationXY(63828, 65279, 41084, 21159),
				'red',
			)
			chai.assert.equal(
				TradfriSanitizer.getColorByHueSaturationXY(20673, 65279, 19659, 39108),
				'green',
			)
			chai.assert.equal(
				TradfriSanitizer.getColorByHueSaturationXY(45333, 65279, 10121, 4098),
				'blue',
			)
			chai.assert.equal(TradfriSanitizer.getColorByHueSaturationXY(1, 2, 3, 4), undefined)
		})
	})
})
