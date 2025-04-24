'use strict'
const barometerTrend = require('barometer-trend');
const readingStore = require('barometer-trend/src/readingStore');
const lodash = require('lodash');

const secondsToMilliseconds = (seconds) => seconds * 1000;
const DEFAULT_SAMPLE_RATE = secondsToMilliseconds(180);
const DEFAULT_ALTITUDE_CORRECTION = 0;

let sampleRate = DEFAULT_SAMPLE_RATE; //default
let altitudeCorrection = DEFAULT_ALTITUDE_CORRECTION;

/**
 * 
 * @param {number} rate Pressure sample rate in milliseconds
 */
function setSampleRate(rate) {
    if (!rate) return;

    // Ensure rate is within the range 60 - 1200 and convert to milliseconds
    return sampleRate = Math.min(Math.max(rate, 60), 1200) * 1000;
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
    { path: 'environment.wind.speedTrue', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onWindSpeedUpdated(value) },
    { path: 'navigation.position', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onPositionUpdated(value) },
    { path: 'navigation.gnss.antennaAltitude', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onAltitudeUpdated(value) },
    { path: 'environment.outside.temperature', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onTemperatureUpdated(value) },
    { path: 'environment.outside.humidity', period: secondsToMilliseconds(30), policy: "instant", minPeriod: secondsToMilliseconds(60), handle: (value) => onHumidityUpdated(value) },
    { path: 'environment.outside.pressure', period: sampleRate, handle: (value) => onPressureUpdated(value) }
];

const TEMPLATE_LATEST = {
    twd: {
        time: null,
        value: null
    },
    tws: {
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
    },
    humidity: {
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
        if (!u.values) {
            return;
        }
        u.values.forEach((value) => {
            let onDeltaUpdated = SUBSCRIPTIONS.find((d) => d.path === value.path);

            if (onDeltaUpdated !== null) {
                let updates = onDeltaUpdated.handle(value.value);

                if (updates && updates.length > 0) {
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

function onHumidityUpdated(value) {
    latest.humidity.value = value;
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

function onWindSpeedUpdated(value) {
    latest.tws.time = Date.now();
    latest.tws.value = value;
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
        latest.humidity.value,
        hasTWDWithinOneMinute() ? latest.twd.value : null,
        hasDataWithinSampleRate('tws') ? latest.tws.value : null,
        latest.position?.value?.latitude);
}

/**
 * 
 * @returns Forecast
 */
function getForecast()
{
    return barometerTrend.getForecast(isNorthernHemisphere());
}

function addPressure(datetime, pressure, altitude, temperature, humidity, twd, tws, latitude) {
    barometerTrend.addPressure(datetime, pressure, {
        altitude: altitude,
        temperature: temperature,
        humidity: humidity,
        trueWindDirection: twd,
        trueWindSpeed: tws,
        latitude: latitude
    });
}

function clear() {
    barometerTrend.clear();
    latest = lodash.cloneDeep(TEMPLATE_LATEST);
    setAltitudeCorrection(DEFAULT_ALTITUDE_CORRECTION);
    setSampleRate(DEFAULT_SAMPLE_RATE);
}

function hasDataWithinSampleRate(propertyPath) {
    const entry = propertyPath.split('.').reduce((obj, key) => obj?.[key], latest);
    return entry?.time != null ? (Date.now() - entry.time) <= sampleRate : false;
}

function hasTWDWithinOneMinute() {
    return latest.twd.time !== null ? (Date.now() - latest.twd.time) <= sampleRate : false;
}

function hasPositionWithinOneMinute() {
    return latest.position.time !== null ? (Date.now() - latest.position.time) <= sampleRate : false;
}

function isNorthernHemisphere() {
    let position = hasPositionWithinOneMinute() ? latest.position.value : null;
    if (position === null) return true; //default to northern hemisphere

    return position.latitude < 0 ? false : true;
}

function getAll() {
    return readingStore.getAll();
}

function persist(persistCallback) {
    let json = getAll();
    persistCallback(json);
}

function populate(populateCallback) {
    let barometerData = populateCallback();

    if (!barometerData) return;

    barometerData.forEach((reading) => {
        addPressure(
            reading.datetime,
            reading.pressure,
            reading.meta.altitude,
            reading.meta.temperature,
            reading.meta.humidity,
            reading.meta.trueWindDirection,
            reading.meta.trueWindSpeed,
            reading.meta.latitude);
    });
}

module.exports = {
    SUBSCRIPTIONS,
    hasTWDWithinOneMinute,
    isNortherHemisphere: isNorthernHemisphere,
    hasPositionWithinOneMinute,
    onDeltasUpdate,
    clear,
    getLatest: () => latest,
    sampleRate,
    setSampleRate,
    setAltitudeCorrection,
    persist,
    populate,
    getAll,
    getForecast
}
