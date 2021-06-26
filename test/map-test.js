'use strict'
const assert = require('assert');
const map = require("../map");

describe("Barometer Tests", function () {
	describe("History", function () {
		it("It should equal 1hr", function () {
			//arrange
			let expected = 102100;
			//act
			let actual = map.mapProperties(jsonMock);

			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.1hr').value, expected);
		});
		it("It should equal 3hr", function () {
			//arrange
			let expected = 102200;
			//act
			let actual = map.mapProperties(jsonMock);

			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.3hr').value, expected);
		});
		it("It should equal 6hr", function () {
			//arrange
			let expected = 102300;
			//act
			let actual = map.mapProperties(jsonMock);

			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.6hr').value, expected);
		});
		it("It should equal 12hr", function () {
			//arrange
			let expected = 102400;
			//act
			let actual = map.mapProperties(jsonMock);

			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.12hr').value, expected);
		});
		it("It should equal 24hr", function () {
			//arrange
			let expected = 102500;
			//act
			let actual = map.mapProperties(jsonMock);

			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.24hr').value, expected);
		});
		it("It should equal 48hr", function () {
			//arrange
			let expected = 102600;
			//act
			let actual = map.mapProperties(jsonMock);

			//assert
			assert.strictEqual(actual.find((m) => m.path === 'environment.outside.pressure.48hr').value, expected);
		});
	});
});

const jsonMock = {
	trend: {
		tendency: 'RISING',
		trend: 'QUICKLY',
		severity: 3,
		from: { meta: { value: 102100 } },
		to: { meta: { value: 102600 } },
		period: 10800
	},
	predictions: {
		pressureOnly: "Pressure Only"
	},
	history: [
		{ hour: 1, pressure: 102100 },
		{ hour: 3, pressure: 102200 },
		{ hour: 6, pressure: 102300 },
		{ hour: 12, pressure: 102400 },
		{ hour: 24, pressure: 102500 },
		{ hour: 48, pressure: 102600 },
	]
}