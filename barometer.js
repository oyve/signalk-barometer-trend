'use strict'
const barometerTrend = require('barometer-trend');

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
                    updates.forEach((u) => deltaMessages.push(u));
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
    latest.altitude.value = value;
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

    let forecast = barometerTrend.getPredictions(isNorthernHemisphere());

    return forecast !== null ? mapProperties(forecast) : null;
}

const propertyMap = [
    { signalK: "environment.outside.pressure.trend.tendency", src: (json) => validateProperty(json.trend.tendency) },
    { signalK: "environment.outside.pressure.trend.trend", src: (json) => validateProperty(json.trend.trend) },
    { signalK: "environment.outside.pressure.trend.severity", src: (json) => validateProperty(json.trend.severity) },
    { signalK: "environment.outside.pressure.trend.from", src: (json) => validateProperty(json.trend.from.meta.value) },
    { signalK: "environment.outside.pressure.trend.to", src: (json) => validateProperty(json.trend.to.meta.value) },
    { signalK: "environment.outside.pressure.trend.period", src: (json) => validateProperty(json.trend.period) },

    { signalK: "environment.outside.pressure.prediction.pressureOnly", src: (json) => validateProperty(json.predictions.pressureOnly) },
    { signalK: "environment.outside.pressure.prediction.quadrant", src: (json) => validateProperty(json.predictions.quadrant) },
    { signalK: "environment.outside.pressure.prediction.season", src: (json) => validateProperty(json.predictions.season) },
    { signalK: "environment.outside.pressure.prediction.beaufort", src: (json) => validateProperty(json.predictions.beaufort.force) },
    { signalK: "environment.outside.pressure.prediction.beaufort.description", src: (json) => validateProperty(json.predictions.beaufort.force.description) },
    { signalK: "environment.outside.pressure.prediction.front.tendency", src: (json) => validateProperty(json.predictions.front.tendency) },
    { signalK: "environment.outside.pressure.prediction.front.prognose", src: (json) => validateProperty(json.predictions.front.prognose) },
    { signalK: "environment.outside.pressure.prediction.front.wind", src: (json) => validateProperty(json.predictions.front.wind) },

    { signalK: "environment.outside.pressure.system", src: (json) => validateProperty(json.system.name) },
    { signalK: "environment.outside.pressure.ASL", src: (json) => validateProperty(json.lastPressure.value) },

    { signalK: "environment.outside.pressure.1hr", src: (json) => history(json, 1) },
    { signalK: "environment.outside.pressure.3hr", src: (json) => history(json, 3) },
    { signalK: "environment.outside.pressure.6hr", src: (json) => history(json, 6) },
    { signalK: "environment.outside.pressure.12hr", src: (json) => history(json, 12) },
    { signalK: "environment.outside.pressure.24hr", src: (json) => history(json, 24) },
    { signalK: "environment.outside.pressure.48hr", src: (json) => history(json, 48) }
]

const history = (json, hour) => { validateProperty(json.history.find((h) => h.hour === hour)) }

const defaultPropertyValue = null;
function mapProperties(json) {

    const deltaUpdates = [];
    propertyMap.forEach((p) => {
        try {
            let value = (json !== null) ? p.src(json) : defaultPropertyValue;
            let deltaUpdate = buildDeltaUpdate(p.signalK, value);
            deltaUpdates.push(deltaUpdate);
        } catch {
            console.debug("Fail to read property: " + p.signalK);
        }
    });
    return deltaUpdates;
}

function validateProperty(value, defaultValue = defaultPropertyValue) {
    return (value === null || value === undefined) ? defaultValue : value;
}

function buildDeltaUpdate(path, value) {
    return {
        path: path,
        value: value
    }
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
    return mapProperties(null);
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
    latest,
    setSampleRate
}
