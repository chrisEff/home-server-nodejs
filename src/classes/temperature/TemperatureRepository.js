'use strict'

const AWS = require('aws-sdk')
const get = require('lodash.get')
const config = require('../../../config.js')

const table = get(config, 'temperature.dynamoDbTable')
const dynamoClient = new AWS.DynamoDB.DocumentClient()

class TemperatureRepository {
	/**
	 * @param {int} sensorId
	 * @param {int} from
	 * @param {int} until
	 * @returns {Promise<Array>}
	 */
	static async loadHistory(sensorId, from = undefined, until = undefined) {
		const response = await dynamoClient
			.query({
				TableName: table,
				KeyConditionExpression: 'sensorId = :sensorId AND #timestamp BETWEEN :min AND :max',
				ExpressionAttributeNames: {
					'#timestamp': 'timestamp',
				},
				ExpressionAttributeValues: {
					':sensorId': sensorId,
					':min': from || 1500000000,
					':max': until || Math.floor(Date.now() / 1000),
				},
			})
			.promise()

		return response.Items.map((item) => ({
			time: item.timestamp,
			val: item.val,
		}))
	}

	static async save(sensorId, timestamp, value) {
		return dynamoClient
			.put({
				TableName: table,
				Item: {
					sensorId: sensorId,
					timestamp: timestamp,
					val: value,
				},
			})
			.promise()
	}
}

module.exports = TemperatureRepository
