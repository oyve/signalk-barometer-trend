'use strict'
const assert = require('assert');
const barometer = require('../barometer');

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
            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            //act
            let actual = barometer.onDeltasUpdate(createDeltaMockPressure(1017));
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

            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            barometer.onDeltasUpdate(createDeltaMockPressure(1017));
            //act
            let actual = barometer.hasPositionWithinOneMinute();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Has no position defaults to northern hemisphere", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            barometer.onDeltasUpdate(createDeltaMockPressure(1017));
            //act
            let actual = barometer.isNortherHemisphere();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Is northern hemisphere", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPosition(mockPositionNorthernHemisphere()));

            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            barometer.onDeltasUpdate(createDeltaMockPressure(1017));
            //act
            let actual = barometer.isNortherHemisphere();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Is southern hemisphere", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockPosition(mockPositionSouthernHemisphere()));

            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            barometer.onDeltasUpdate(createDeltaMockPressure(1017));
            //act
            let actual = barometer.isNortherHemisphere();
            //assert
            assert.strictEqual(actual, false);
        });

        it("Has TWD within one minute", function () {
            //arrange
            barometer.clear();
            barometer.onDeltasUpdate(createDeltaMockWindDirection(225));

            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            barometer.onDeltasUpdate(createDeltaMockPressure(1017));
            //act
            let actual = barometer.hasTWDWithinOneMinute();
            //assert
            assert.strictEqual(actual, true);
        });

        it("Has not TWD within one minute", function () {
            //arrange
            barometer.clear();

            barometer.onDeltasUpdate(createDeltaMockPressure(1015));
            barometer.onDeltasUpdate(createDeltaMockPressure(1016));
            barometer.onDeltasUpdate(createDeltaMockPressure(1017));
            //act
            let actual = barometer.hasTWDWithinOneMinute();
            //assert
            assert.strictEqual(actual, false);
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