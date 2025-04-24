'use strict'
const assert = require('assert');
const barometer = require('../src/barometer');
const KELVIN = 273.15;
const persist = require('../src/persist')
const map = require('../src/map');


const storage = new persist();

describe("Barometer Tests", function () {
    describe("onDeltasUpdated", function () {
        it("Subscription should equal", function () {
            //arrange
            barometer.clear();
            let expected = 'environment.outside.pressure';
            //act
            let actual = barometer.SUBSCRIPTIONS;
            //assert
            assert.strictEqual(actual.find((f) => f.path === expected).path, expected);
        });

        it("Pressure should equal", function () {
            //arrange
            barometer.clear();
            const expectedTendency = "RISING";
            const expectedTrend = "STEADY";
            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            //act
            barometer.onDeltasUpdate(createDeltaMockPressure(101500 + 3));
            let json = barometer.getForecast();
            let actual = map.mapProperties(json);
            //assert
            assert.strictEqual(actual.find((f) => f.path === getPressurePath("pressureTendency")).value, expectedTendency);
            assert.strictEqual(actual.find((f) => f.path === getPressurePath("pressureTrend")).value, expectedTrend);
            assert.strictEqual(actual.find((f) => f.path === getPressurePath("pressureSeverity")).value, 1);
        });

        it("it should throw an exception", function () {
            //arrange
            barometer.clear();
            //act
            //assert
            assert.throws(() => { barometer.onDeltasUpdate(null) }, Error, "Deltas cannot be null");
        });


        it("it should be ok", function () {
            //arrange
            //act
            barometer.clear();
            let actual = barometer.onDeltasUpdate(createDeltaMockPressure(300));
            //assert
            assert.notStrictEqual(actual, null);
        });

        // describe("preLoad", function () {
        //     it("it should be waiting", function () {
        //         //arrange
        //         //act
        //         let actual = barometer.preLoad();
        //         //assert
        //         assert.strictEqual(actual.values.find((f) => f.path === getPath("trend.tendency")).value, "Waiting...");
        //     });
        // });

        it("Subscription should equal", function () {
            //arrange
            barometer.clear();
            let expected = 'environment.outside.pressure';
            //act
            let actual = barometer.SUBSCRIPTIONS;
            //assert
            assert.strictEqual(actual.find((f) => f.path === expected).path, expected);
        });

        it("Has position within one minute", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPosition(mockPositionNorthernHemisphere()));

            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));
            //act
            let actual = barometer.hasPositionWithinOneMinute();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Has no position defaults to northern hemisphere", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));
            //act
            let actual = barometer.isNortherHemisphere();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Is northern hemisphere", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPosition(mockPositionNorthernHemisphere()));

            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));
            //act
            let actual = barometer.isNortherHemisphere();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Is southern hemisphere", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPosition(mockPositionSouthernHemisphere()));

            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));
            //act
            let actual = barometer.isNortherHemisphere();
            //assert
            assert.strictEqual(actual, false);
        });

        it("Has TWD within one minute", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockWindDirection(225));

            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));
            //act
            let actual = barometer.hasTWDWithinOneMinute();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Has not TWD within one minute", function () {
            //arrange
            barometer.clear();

            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));
            //act
            let actual = barometer.hasTWDWithinOneMinute();
            //assert
            assert.strictEqual(actual, false);
        });

        it("Has temperature", function () {
            //arrange
            const expected = 30 + KELVIN;
            barometer.clear();
            //act
            barometer.onDeltasUpdate(createDeltaMockTemperature(expected));
            //assert
            assert.strictEqual(barometer.getLatest().temperature.value, expected);
        });

        it("Has altitude", function () {
            //arrange
            const expected = 100;
            barometer.clear();
            //act
            barometer.onDeltasUpdate(createDeltaMockAltitude(expected));
            //assert
            assert.strictEqual(barometer.getLatest().altitude.value, expected);
        });
    });

    describe("System Tests", function () {
		it("System is correct", function () {
			//arrange
			barometer.clear();
			const expected = "Normal";
			barometer.onDeltasUpdate(createDeltaMockPressure(101549));
			//act
			barometer.onDeltasUpdate(createDeltaMockPressure(101500));
			let json = barometer.getForecast();
			let actual = map.mapProperties(json);

			//assert
			assert.strictEqual(actual.find((f) => f.path === getForecastPath("pressureSystem")).value, expected);

		});
	});

    describe("Set Sample Rate", function () {
        it("It should equal", function () {
            //arrange
            barometer.clear();
            let expected = 80 * 1000;
            //act
            var actual = barometer.setSampleRate(80);
            //assert
            assert.strictEqual(actual, expected);
        });
        it("It should equal under threshold", function () {
            //arrange
            barometer.clear();
            let expected = 1200 * 1000;
            //act
            var actual = barometer.setSampleRate(1201);
            //assert
            assert.strictEqual(actual, expected);
        });
        it("It should equal above threshold", function () {
            //arrange
            barometer.clear();
            let expected = 60 * 1000;
            //act
            var actual = barometer.setSampleRate(59);
            //assert
            assert.strictEqual(actual, expected);
        });
    });

    describe("Set Altitude Correction", function () {
        it("It should equal positive", function () {
            //arrange
            barometer.clear();
            let expected = 104;
            //act
            barometer.setAltitudeCorrection(4);
            barometer.onDeltasUpdate(createDeltaMockAltitude(100));
            let actual = barometer.getLatest().altitude.value;
            //assert
            assert.strictEqual(actual, expected);
        });

        it("It should equal negative", function () {
            //arrange
            barometer.clear();
            let expected = 96;
            //act
            barometer.setAltitudeCorrection(-4);
            barometer.onDeltasUpdate(createDeltaMockAltitude(100));
            let actual = barometer.getLatest().altitude.value;
            //assert
            assert.strictEqual(actual, expected);
        });

        it("It should not equal", function () {
            //arrange
            barometer.clear();
            let expected = 100;
            //act
            barometer.setAltitudeCorrection(null);
            barometer.setAltitudeCorrection(undefined);
            barometer.onDeltasUpdate(createDeltaMockAltitude(100));
            let actual = barometer.getLatest().altitude.value;
            //assert
            assert.strictEqual(actual, expected);
        });
    });

    describe("persist", function () {
        it("Persist should persist", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));

            const all = barometer.getAll();

            let actual = null;
            const persistCallback = (json) => {
                actual = json;
            }
            //act
            barometer.persist(persistCallback);
            //assert
            assert.deepEqual(actual, all);
        });
    });

    describe("populate", function () {
        it("Populate should populate", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));

            const all = barometer.getAll();

            const populateCallback = () => {
                return all;
            }

            barometer.clear();

            //act
            barometer.populate(populateCallback)
            const actual = barometer.getAll();

            //assert
            assert.deepEqual(actual, all);
        });

        it("Populate should not fail with empty array", function () {
            //arrange
            barometer.clear();

            const populateCallback = () => {
                return [];
            }

            //act
            barometer.populate(populateCallback)

            //assert
            //assert.strictEqual(actual, all);
        });

        it("Populate should not fail with null", function () {
            //arrange
            barometer.clear();

            const populateCallback = () => {
                return null;
            }

            //act
            barometer.populate(populateCallback)

            //assert
            assert.ok(true);
        });

        it("Parse date into date objecft", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPressure(101500));
            barometer.onDeltasUpdate(createDeltaMockPressure(101600));
            barometer.onDeltasUpdate(createDeltaMockPressure(101700));

            const content = JSON.stringify(barometer.getAll());

            const populateCallback = () => {
                storage.JSONParser(content);
            }

            //act
            barometer.populate(populateCallback)

            //assert
            assert.ok(true);
        });
    });
});

function getPressurePath(path) {
    return "environment.outside." + path;
}
function getForecastPath(path) {
    return "environment.forecast." + path;
}

function createUpdateMock(path, value) {
    return {
        updates: [
            {
                values: [
                    {
                        path: path,
                        value: value
                    }
                ]
            }
        ]
    }
}

function createDeltaMockPressure(value) {
    return createUpdateMock('environment.outside.pressure', value);
}

function createDeltaMockTemperature(temperature) {
    return createUpdateMock('environment.outside.temperature', temperature);
}

function createDeltaMockAltitude(altitude) {
    return createUpdateMock('navigation.gnss.antennaAltitude', altitude);
}

function createDeltaMockWindDirection(value) {
    return createUpdateMock('environment.wind.directionTrue', value);
}

function createDeltaMockPosition(position) {
    return createUpdateMock('navigation.position', position);
}

function mockPositionNorthernHemisphere() {
    return {
        "longitude": -61.59,
        "latitude": 15.84
    }
}

function mockPositionSouthernHemisphere() {
    return {
        "longitude": -61.59,
        "latitude": -15.84
    }
}