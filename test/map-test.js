'use strict'
const assert = require('assert');
const { getPressureAverage } = require('barometer-trend/utils');
const barometer = require('../barometer');
const map = require("../map");

describe("Barometer Tests", function () {
	describe("History", function () {
		it("It should equal 1hr", function () {
			//arrange
			let expected = 102110;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.1hr').value, expected);
		});
		it("It should equal 3hr", function () {
			//arrange
			let expected = 102210;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.3hr').value, expected);
		});
		it("It should equal 6hr", function () {
			//arrange
			let expected = 102310;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.6hr').value, expected);
		});
		it("It should equal 12hr", function () {
			//arrange
			let expected = 102410;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.12hr').value, expected);
		});
		it("It should equal 24hr", function () {
			//arrange
			let expected = 102510;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.24hr').value, expected);
		});
		it("It should equal 48hr", function () {
			//arrange
			let expected = 102610;
			//act
			let actual = map.mapProperties(jsonMock);
			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.48hr').value, expected);
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
		pressureOnly: "Pressure Only"
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
