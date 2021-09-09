'use strict'
const barometerTrend = require('barometer-trend');
const map = require('./map');
const lodash = require('lodash');
// const storage = require('./storage');

const secondsToMilliseconds = (seconds) => seconds * 1000;
const DEFAULT_SAMPLE_RATE = secondsToMilliseconds(60);
const DEFAULT_ALTITUDE_CORRECTION = 0;

let sampleRate = DEFAULT_SAMPLE_RATE; //default
let altitudeCorrection = DEFAULT_ALTITUDE_CORRECTION;

/**
 * 
 * @param {number} rate Pressure sample rate in milliseconds
 */
function setSampleRate(rate) {
    if (!rate) return;
    if (rate > 1200) rate = 1200;
    if (rate < 60) rate = 60;

    sampleRate = rate * 1000;
    return sampleRate;
}

/**
 * 
 * @param {number} altitude Set Altitude correction in meters
 * @returns 
 */
function setAltitudeCorrection(altitude = DEFAULT_ALTITUDE_CORRECTION) {
    if (altitude === null && altitude === undefined) return;
    altitudeCorrection = altitude
}

const SUBSCRIPTIONS = [
    { path: 'environment.wind.directionTrue', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onTrueWindUpdated(value) },
    { path: 'navigation.position', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onPositionUpdated(value) },
    { path: 'navigation.gnss.antennaAltitude', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onAltitudeUpdated(value) },
    { path: 'environment.outside.temperature', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onTemperatureUpdated(value) },
    { path: 'environment.outside.pressure', period: sampleRate, handle: (value) => onPressureUpdated(value) }
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

let latest = null;
latest = lodash.cloneDeep(TEMPLATE_LATEST);

/**
 * 
 * @param {Array<Object>} deltas Delta array of updates from SignalK
 * @returns {Array<Object>} Delta array of message updates
 */
function onDeltasUpdate(deltas) {
    if (deltas === null && !Array.isArray(deltas) && deltas.length === 0) {
        throw "Deltas cannot be null";
    }

    let deltaValues = [];

    deltas.updates.forEach(u => {
        u.values.forEach((value) => {
            let onDeltaUpdated = SUBSCRIPTIONS.find((d) => d.path === value.path);

            if (onDeltaUpdated !== null) {
                let updates = onDeltaUpdated.handle(value.value);
                console.debug("Handle: " + JSON.stringify(value));

                if (updates && updates.length > 0) {
                    //console.debug(JSON.stringify(updates));
                    updates.forEach((update) => deltaValues.push(update));
                }
            }
        });
    });

    return deltaValues;
}

function onPositionUpdated(value) {
    latest.position.time = Date.now();
    latest.position.value = value;
}

function onTemperatureUpdated(value) {
    latest.temperature.value = value;
}

function onAltitudeUpdated(value) {
    latest.altitude.value = value + altitudeCorrection;
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
    if (!value) return;

    addPressure(
        new Date(),
        value,
        latest.altitude.value,
        latest.temperature.value,
        hasTWDWithinOneMinute() ? latest.twd.value : null);

    let json = barometerTrend.getPredictions(isNorthernHemisphere());

    return map.mapProperties(json);
}

function addPressure(datetime, value, altitude, temperature, twd) {
    barometerTrend.addPressure(datetime, value, altitude, temperature, twd);
}

function clear() {
    barometerTrend.clear();
    latest = lodash.cloneDeep(TEMPLATE_LATEST);
    setAltitudeCorrection(DEFAULT_ALTITUDE_CORRECTION);
    setSampleRate(DEFAULT_SAMPLE_RATE);
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

function persist(persistCallback) {
    let json = barometerTrend.getAll(); //[{ prop: "test" },{ prop: "test2" }]
    persistCallback(json);
}

function populate(populateCallback) {
    let barometerData = populateCallback();

    if (barometerData) {
        console.debug(barometerData);
        barometerData.forEach((bd) => {
            if (bd) {
                addPressure(bd.datetime, bd.meta.value, bd.meta.altitude, bd.meta.temperature, bd.meta.twd);
                console.debug("Added pressure: " + bd.meta.value)
            }
        });
    }
}

module.exports = {
    SUBSCRIPTIONS,
    hasTWDWithinOneMinute,
    isNortherHemisphere: isNorthernHemisphere,
    hasPositionWithinOneMinute,
    onDeltasUpdate,
    clear,
    getLatest: () => latest,
    setSampleRate,
    setAltitudeCorrection,
    persist,
    populate
}
