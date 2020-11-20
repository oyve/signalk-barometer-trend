'use strict'
const barometer = require('barometer-trend');

const ENVIRONMENT_OUTSIDE_PRESSURE = 'environment.outside.pressure';
const ONE_MINUTE_MILLISECONDS = 60 * 1000;

const SUBSCRIPTIONS = [
    { path: ENVIRONMENT_OUTSIDE_PRESSURE, period: ONE_MINUTE_MILLISECONDS }
];

const OUTPUT_PATHS = {
    "PRESSURE_TREND": "environment.outside.pressure.trend"
}

/**
 * 
 * @param {Array<Object>} deltas Delta array of updates from SignalK
 * @returns {Array<Object>} Delta array of message updates
 */
function onDeltasUpdate(deltas) {
    if (deltas === null && !Array.isArray(deltas) && deltas.length === 0) {
        throw "Deltas cannot be null";
    }

    let deltaMessages = [];

    deltas.updates.forEach(u => {
        u.values.forEach((value) => {
            if (value.path === ENVIRONMENT_OUTSIDE_PRESSURE) {
                let updates = onPressureUpdated(value.value);
                if (updates !== null) {
                    updates.forEach((u) => deltaMessages.push(u));
                }
            }
        });
    });

    return deltaMessages;
}

/**
 * 
 * @param {number} value Pressure value in (Pa) Pascal.
 * @returns {Array<[{path:path, value:value}]>} Delta JSON-array of updates
 */
function onPressureUpdated(value) {
    if (value == null) throw new Error("Cannot add null value");

    barometer.addPressure(new Date(), value);

    let trend = barometer.getTrend();

    if (trend != null) {
        let deltaPressureTrend = buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_TREND, trend);

        return [deltaPressureTrend];
    }

    return null;
}

function buildDeltaUpdate(path, value) {
    return {
        path: path,
        value: value
    }
}

function clear() {
    barometer.clear();
}

module.exports = {
    SUBSCRIPTIONS,
    OUTPUT_PATHS,
    onDeltasUpdate,
    clear
}
