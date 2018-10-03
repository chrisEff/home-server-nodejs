const chai = require('chai')

const RfController = require('../src/classes/RfController')

describe('RfController', () => {
	
	describe('getOutlets()', () => {
		it('should return an array', () => {
			chai.assert.isArray(RfController.getOutlets())
		})
	})
	
})
