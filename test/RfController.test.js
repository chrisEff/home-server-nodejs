const chai = require('chai')

const RfController = require('../src/classes/RfController')

describe('RfController', () => {

	const rfController = new RfController([])
	
	describe('getOutlets()', () => {
		it('should return an array', () => {
			chai.assert.isArray(rfController.getOutlets())
		})
	})
	
})
