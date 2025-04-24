'use strict'
const assert = require('assert');
const map = require("../src/map");
const { max } = require('lodash');

describe("Map Tests", function () {
	describe("History", function () {
		it("It should equal 1hr", function () {
			//arrange
			let expected = 102110;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressureMinus01hr').value, expected);
		});
		it("It should equal 3hr", function () {
			//arrange
			let expected = 102210;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressureMinus03hr').value, expected);
		});
		it("It should equal 6hr", function () {
			//arrange
			let expected = 102310;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressureMinus06hr').value, expected);
		});
		it("It should equal 12hr", function () {
			//arrange
			let expected = 102410;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressureMinus12hr').value, expected);
		});
		it("It should equal 24hr", function () {
			//arrange
			let expected = 102510;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressureMinus24hr').value, expected);
		});
		it("It should equal 48hr", function () {
			//arrange
			let expected = 102610;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressureMinus48hr').value, expected);
		});
	});
});


const pressureMock = (pressure = 102100) => {
	return {
		datetime: new Date(),
		value: pressure,
		meta: {
			value: pressure + 10,
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
	predictions: {
		pressureOnly: "Pressure Only",
		beaufort: { low: 2.67, high: 3.33, force: "F6-7", min: 6, max: 7, description: "Strong breeze to near gale" },
		front: { "key": "FFF", "tendency": "Continously falling", "prognose": "Warm or cold front approaching", "wind": "Has backed and increasing" },
		system: { key: 0, name: "Low", short: "LOW", threshold: 0.1 }
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
