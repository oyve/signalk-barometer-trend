'use strict'
const assert = require('assert');
const barometer = require('../barometer');
const KELVIN = 273.15;

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
            let actual = barometer.onDeltasUpdate(createDeltaMockPressure(101500 + 3));
            //assert
            assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.TREND_TENDENCY).value, expectedTendency);
            assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.TREND_TREND).value, expectedTrend);
            assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.TREND_SEVERITY).value, 0);
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

        describe("preLoad", function () {
            it("it should be waiting", function () {
                //arrange
                //act
                let actual = barometer.preLoad();
                //assert
                assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.TREND_TENDENCY).value, "Waiting..");
            });
        });

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
            assert.strictEqual(barometer.latest.temperature.value, expected);
        });

        it("Has altitude", function () {
            //arrange
            const expected = 100;
            barometer.clear();
            //act
            barometer.onDeltasUpdate(createDeltaMockAltitude(expected));
            //assert
            assert.strictEqual(barometer.latest.altitude.value, expected);
        });

        it("Has altitude", function () {
            //arrange
            const expected = 100;
            barometer.clear();
            //act
            barometer.onDeltasUpdate(createDeltaMockAltitude(expected));
            //assert
            assert.strictEqual(barometer.latest.altitude.value, expected);
        });

        it("To Kelvin if Celcius", function () {
            //arrange
            const expected = 30 + KELVIN;
            barometer.clear();
            //act
            let actual = barometer.toKelvinIfCelcius(30);
            //assert
            assert.strictEqual(actual, expected);
        });

        it("Not to Kelvin if Kelvin", function () {
            //arrange
            const expected = KELVIN;
            barometer.clear();
            //act
            let actual = barometer.toKelvinIfCelcius(expected);
            //assert
            assert.strictEqual(actual, expected);
        });

        it("To Pa if hPa", function () {
            //arrange
            const expected = 101513;
            barometer.clear();
            //act
            let actual = barometer.toPaIfHpa(1015.13);
            //assert
            assert.strictEqual(actual, expected);
        });

        it("Not to Pa if Pa", function () {
            //arrange
            const expected = 101513;
            barometer.clear();
            //act
            let actual = barometer.toPaIfHpa(expected);
            //assert
            assert.strictEqual(actual, expected);
        });
    });


});

function createDeltaMockPressure(value) {
    return {
        updates: [
            {
                values: [
                    {
                        path: 'environment.outside.pressure',
                        value: value
                    }
                ]
            }
        ]
    }
}

function createDeltaMockTemperature(temperature) {
    return {
        updates: [
            {
                values: [
                    {
                        path: 'environment.outside.temperature',
                        value: temperature
                    }
                ]
            }
        ]
    }
}

function createDeltaMockAltitude(altitude) {
    return {
        updates: [
            {
                values: [
                    {
                        path: 'navigation.gnss.antennaAltitude',
                        value: altitude
                    }
                ]
            }
        ]
    }
}

function createDeltaMockWindDirection(value) {
    return {
        updates: [
            {
                values: [
                    {
                        path: 'environment.wind.directionTrue',
                        value: value
                    }
                ]
            }
        ]
    }
}

function createDeltaMockPosition(position) {
    return {
        updates: [
            {
                values: [
                    {
                        path: 'navigation.position',
                        value: position
                    }
                ]
            }
        ]
    }
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