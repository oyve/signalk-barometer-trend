'use strict'
const barometerTrend = require('barometer-trend');
const map = require('./map');
/**
 * 
 * @param {number} rate Pressure sample rate in milliseconds
 */
function setSampleRate(rate) {
    if (rate > 3600) rate = secondsToMilliseconds(3600);
    if (rate < 60) rate = secondsToMilliseconds(60);

    SAMPLE_RATE = rate;
}

const minutesToMilliseconds = (minutes) => secondsToMilliseconds(minutes * 60);
const secondsToMilliseconds = (seconds) => seconds * 1000;

let SAMPLE_RATE = secondsToMilliseconds(60); //default
let ALTITUDE_CORRECTION = 0;

const SUBSCRIPTIONS = [
    { path: 'environment.wind.directionTrue', period: secondsToMilliseconds(10), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onTrueWindUpdated(value) },
    { path: 'navigation.position', period: secondsToMilliseconds(10), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onPositionUpdated(value) },
    { path: 'navigation.gnss.antennaAltitude', period: secondsToMilliseconds(10), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onAltitudeUpdated(value) },
    { path: 'environment.outside.temperature', period: secondsToMilliseconds(10), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onTemperatureUpdated(value) },
    { path: 'environment.outside.pressure', period: SAMPLE_RATE, handle: (value) => onPressureUpdated(value) }
];

const TEMPLATE_LATEST = {
    twd: {
        time: null,
        value: null
    },
    position: {
        time: null,
        value: null
    },
    altitude: {
        value: null
    },
    temperature: {
        value: null
    }
}

let latest = TEMPLATE_LATEST;

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
            let onDeltaUpdated = SUBSCRIPTIONS.find((d) => d.path === value.path);

            if (onDeltaUpdated !== null) {
                let updates = onDeltaUpdated.handle(value.value);
                if (updates !== null && updates !== undefined) {
                    updates.values.forEach((u) => deltaMessages.push(u));
                }
            }
        });
    });

    return deltaMessages;
}

function onPositionUpdated(value) {
    latest.position.time = Date.now();
    latest.position.value = value;
}

function onTemperatureUpdated(value) {
    latest.temperature.value = value;
}

function onAltitudeUpdated(value) {
    latest.altitude.value = value + ALTITUDE_CORRECTION;
}

function onTrueWindUpdated(value) {
    latest.twd.time = Date.now();
    latest.twd.value = value;
}

/**
 * 
 * @param {number} value Pressure value in (Pa) Pascal.
 * @returns {Array<[{path:path, value:value}]>} Delta JSON-array of updates
 */
function onPressureUpdated(value) {
    if (value === null || value === undefined) throw new Error("Cannot add null value");

    barometerTrend.addPressure(
        new Date(),
        value,
        latest.altitude.value,
        latest.temperature.value,
        hasTWDWithinOneMinute() ? latest.twd.value : null);

    let json = barometerTrend.getPredictions(isNorthernHemisphere());

    return json !== null ? map.mapProperties(json) : null;
}


function clear() {
    barometerTrend.clear();

    //latest = ...latestTemplate;
    latest.twd.time = null;
    latest.twd.value = null;
    latest.position.time = null;
    latest.position.value = null;
    latest.altitude.value = null;
    latest.temperature.value = null;
}

function preLoad() {
    return map.mapProperties(null);
}

function hasTWDWithinOneMinute() {
    return latest.twd.time !== null ? (Date.now() - latest.twd.time) <= secondsToMilliseconds(60) : false;
}

function hasPositionWithinOneMinute() {
    return latest.position.time !== null ? (Date.now() - latest.position.time) <= secondsToMilliseconds(60) : false;
}

function isNorthernHemisphere() {
    let position = hasPositionWithinOneMinute() ? latest.position.value : null;
    if (position === null) return true; //default to northern hemisphere

    return position.latitude < 0 ? false : true;
}

module.exports = {
    SUBSCRIPTIONS,
    hasTWDWithinOneMinute,
    isNortherHemisphere: isNorthernHemisphere,
    hasPositionWithinOneMinute,
    onDeltasUpdate,
    clear,
    preLoad,
    setAltitudeCorrection: (altitude) => ALTITUDE_CORRECTION = altitude
}
