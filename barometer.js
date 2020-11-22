'use strict'
const barometer = require('barometer-trend');

const ENVIRONMENT_OUTSIDE_PRESSURE = 'environment.outside.pressure';
const ONE_MINUTE_MILLISECONDS = 60 * 1000;

const SUBSCRIPTIONS = [
    { path: ENVIRONMENT_OUTSIDE_PRESSURE, period: ONE_MINUTE_MILLISECONDS }
];

const pathPrefix = "environment.outside.pressure.trend.";

const OUTPUT_PATHS = {
    "PRESSURE_TENDENCY": pathPrefix + "tendency",
    "PRESSURE_TREND": pathPrefix + "trend",
    "PRESSURE_INDICATOR": pathPrefix + "indicator",
    "PRESSURE_SEVERITY": pathPrefix + "severity"
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
        return [
            buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_TENDENCY, trend.tendency),
            buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_TREND, trend.trend),
            buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_INDICATOR, trend.indicator),
            buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_SEVERITY, trend.severity)
        ];
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

function preLoad() {
    return [
        buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_TENDENCY, 'Waiting...'),
        buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_TREND, 'Waiting...'),
        buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_INDICATOR, 'Waiting...'),
        buildDeltaUpdate(OUTPUT_PATHS.PRESSURE_SEVERITY, 0),
    ];
}

module.exports = {
    SUBSCRIPTIONS,
    OUTPUT_PATHS,
    onDeltasUpdate,
    clear,
    preLoad
}
