'use strict'
const assert = require('assert');
const deltPathMapper = require("../src/deltaPathMapper");
const { max } = require('lodash');

describe("Map Tests", function () {
	// describe("History", function () {
	// 	it("It should equal 1hr", function () {
	// 		//arrange
	// 		let expected = 102100;
	// 		//act
	// 		let actual = deltPathMapper.mapForecastUpdates(jsonMock);
	// 		//assert
	// 		assert.strictEqual(actual.find((m) => m.path === 'environment.barometer.pressureMinus01hr').value.pressure, expected);
	// 	});
	// 	it("It should equal 3hr", function () {
	// 		//arrange
	// 		let expected = 102200;
	// 		//act
	// 		let actual = deltPathMapper.mapForecastUpdates(jsonMock);
	// 		//assert
	// 		assert.strictEqual(actual.find((m) => m.path === 'environment.barometer.pressureMinus03hr').value.pressure, expected);
	// 	});
	// 	it("It should equal 6hr", function () {
	// 		//arrange
	// 		let expected = 102300;
	// 		//act
	// 		let actual = deltPathMapper.mapForecastUpdates(jsonMock);
	// 		//assert
	// 		assert.strictEqual(actual.find((m) => m.path === 'environment.barometer.pressureMinus06hr').value.pressure, expected);
	// 	});
	// 	it("It should equal 12hr", function () {
	// 		//arrange
	// 		let expected = 102400;
	// 		//act
	// 		let actual = deltPathMapper.mapForecastUpdates(jsonMock);
	// 		//assert
	// 		assert.strictEqual(actual.find((m) => m.path === 'environment.barometer.pressureMinus12hr').value.pressure, expected);
	// 	});
	// 	it("It should equal 24hr", function () {
	// 		//arrange
	// 		let expected = 102500;
	// 		//act
	// 		let actual = deltPathMapper.mapForecastUpdates(jsonMock);
	// 		//assert
	// 		assert.strictEqual(actual.find((m) => m.path === 'environment.barometer.pressureMinus24hr').value.pressure, expected);
	// 	});
	// 	it("It should equal 48hr", function () {
	// 		//arrange
	// 		let expected = 102600;
	// 		//act
	// 		let actual = deltPathMapper.mapForecastUpdates(jsonMock);
	// 		let asfd = actual.find((m) => m.path === 'environment.barometer.pressureMinus48hr');
	// 		//assert
	// 		assert.strictEqual(actual.find((m) => m.path === 'environment.barometer.pressureMinus48hr').value.pressure, expected);
	// 	});
	// });
});


const pressureMock = (pressure = 102100) => {
	return {
		datetime: new Date(),
		pressure: pressure,
		meta: {
			//value: pressure + 10,
			altitude: 50,
			temperature: 301,
			twd: null
		}
	};
}


const jsonMock = {
	trend: {
		tendency: 'RISING',
		trend: 'QUICKLY',
		severity: 3,
		from: pressureMock(),
		to: pressureMock(102600),
		period: 10800
	},
	models: {
		pressureOnly: "Pressure Only",
		beaufort: { low: 2.67, high: 3.33, force: "F6-7", min: 6, max: 7, description: "Strong breeze to near gale" },
		front: {
			current: { "key": "FFF", "tendency": "Continously falling", "prognose": "Warm or cold front approaching", "wind": "Has backed and increasing" },
			trending: { "key": "FFF", "tendency": "Continously falling", "prognose": "Warm or cold front approaching", "wind": "Has backed and increasing" }
		},
		pressureSystem: {
			current: { key: 0, name: "Low", short: "LOW", threshold: 0.1 },
			trending: { key: 0, name: "Low", short: "LOW", threshold: 0.1 }
		}
	},
	history: [
		{ hour: 1, pressure: pressureMock(102100) },
		{ hour: 3, pressure: pressureMock(102200) },
		{ hour: 6, pressure: pressureMock(102300) },
		{ hour: 12, pressure: pressureMock(102400) },
		{ hour: 24, pressure: pressureMock(102500) },
		{ hour: 48, pressure: pressureMock(102600) },
	]
}
