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
            barometer.onDeltasUpdate(createDeltaMock(1015));
            barometer.onDeltasUpdate(createDeltaMock(1016));
            //act
            let actual = barometer.onDeltasUpdate(createDeltaMock(1017));
            //assert
            assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.PRESSURE_TENDENCY).value, expectedTendency);
            assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.PRESSURE_TREND).value, expectedTrend);
            assert.strictEqual(actual.find((f) => f.path === barometer.OUTPUT_PATHS.PRESSURE_SEVERITY).value, 0);
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
            let actual = barometer.onDeltasUpdate(createDeltaMock(300));
            //assert
            assert.notStrictEqual(actual, null);
        });


        describe("preLoad", function () {
            it("it should be ok", function () {
                //arrange
                //act
                barometer.preLoad();
                //assert
                assert.ok(true, "it's ok");
            });
        });
    });
});

function createDeltaMock(pressure) {
    return {
        updates: [
            {
                values: [
                    {
                        path: 'environment.outside.pressure',
                        value: pressure
                    }
                ]
            }
        ]
    }
}