'use strict'
const barometerTrend = require('barometer-trend');

const ENVIRONMENT_OUTSIDE_PRESSURE = 'environment.outside.pressure';
const ENVIRONMENT_OUTSIDE_TEMPERATURE = 'environment.outside.temperature';
const ENVIRONMENT_WIND_TWD = 'environment.wind.directionTrue';
const NAVIGATION_POSITION = 'navigation.position';
const NAVIGATION_ALTITUDE = 'navigation.gnss.antennaAltitude';

const ONE_MINUTE_MILLISECONDS = 60 * 1000;
const TEN_SECONDS_MILLISECONDS = 10 * 1000;

const KELVIN = 273.15;

const SUBSCRIPTIONS = [
    { path: ENVIRONMENT_WIND_TWD, period: TEN_SECONDS_MILLISECONDS, policy: "instant", minPeriod: ONE_MINUTE_MILLISECONDS },
    { path: NAVIGATION_POSITION, period: ONE_MINUTE_MILLISECONDS, policy: "instant", minPeriod: ONE_MINUTE_MILLISECONDS },
    { path: NAVIGATION_ALTITUDE, period: ONE_MINUTE_MILLISECONDS, policy: "instant", minPeriod: ONE_MINUTE_MILLISECONDS },
    { path: ENVIRONMENT_OUTSIDE_TEMPERATURE, period: ONE_MINUTE_MILLISECONDS, policy: "instant", minPeriod: ONE_MINUTE_MILLISECONDS },
    { path: ENVIRONMENT_OUTSIDE_PRESSURE, period: ONE_MINUTE_MILLISECONDS }
];

const pathPrefix = "environment.outside.pressure.";

const OUTPUT_PATHS = {
    "TREND_TENDENCY_COMBINED": pathPrefix + "trend",
    "TREND_TENDENCY": pathPrefix + "trend.tendency",
    "TREND_TREND": pathPrefix + "trend.trend",
    "TREND_SEVERITY": pathPrefix + "trend.severity",
    "TREND_DIFFERENCE_FROM": pathPrefix + "trend.from",
    "TREND_DIFFERENCE_TO": pathPrefix + "trend.to",
    "TREND_DIFFERENCE": pathPrefix + "trend.difference",
    "TREND_DIFFERENCE_RATIO": pathPrefix + "trend.difference.ratio",
    "TREND_DIFFERENCE_PERIOD": pathPrefix + "trend.difference.period",

    "PREDICTION_PRESSURE": pathPrefix + "prediction.pressureOnly",
    "PREDICTION_QUADRANT": pathPrefix + "prediction.quadrant",
    "PREDICTION_SEASON": pathPrefix + "prediction.season",
    "PREDICTION_BEAUFORT": pathPrefix + "prediction.beaufort",

    "PREDICTION_FRONT_TENDENCY": pathPrefix + "prediction.front.tendency",
    "PREDICTION_FRONT_PROGNOSE": pathPrefix + "prediction.front.prognose",
    "PREDICTION_FRONT_WIND": pathPrefix + "prediction.front.wind"
}

const latest = {
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

const pathHandles = [
    { path: ENVIRONMENT_OUTSIDE_PRESSURE, handle: (value) => onPressureUpdated(value) },
    { path: ENVIRONMENT_WIND_TWD, handle: (value) => onTrueWindUpdated(value) },
    { path: NAVIGATION_POSITION, handle: (value) => onPositionUpdated(value) },
    { path: NAVIGATION_ALTITUDE, handle: (value) => onAltitudeUpdated(value) },
    { path: ENVIRONMENT_OUTSIDE_TEMPERATURE, handle: (value) => onTemperatureUpdated(value) }
];

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
            let onDeltaUpdated = pathHandles.find((d) => d.path === value.path);

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
    latest.temperature.value = toKelvinIfCelcius(value);
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
 * @param {number} pressure Pressure
 * @returns returns Pascal if pressure is recieved in hPa
 */
function toPaIfHpa(pressure) {
    if (Math.trunc(pressure).toString().length <= 4) {
        pressure *= 100;
    }

    return pressure;
}

/**
 * 
 * @param {number} temperature Temperature
 * @returns returns Kelvin if temperature is recieved in Celcius
 */
function toKelvinIfCelcius(temperature) {
    if (Math.trunc(temperature).toString().length <= 2) {
        temperature += KELVIN;
    }

    return temperature;
}

/**
 * 
 * @param {number} value Pressure value in (Pa) Pascal.
 * @returns {Array<[{path:path, value:value}]>} Delta JSON-array of updates
 */
function onPressureUpdated(value) {
    if (value == null) throw new Error("Cannot add null value");

    barometerTrend.addPressure(
        new Date(),
        toPaIfHpa(value),
        latest.altitude.value,
        latest.temperature.value,
        hasTWDWithinOneMinute() ? latest.twd.value : null);

    let forecast = barometerTrend.getPredictions(isNortherHemisphere());

    return forecast !== null ? prepareUpdate(forecast) : null;
}

function prepareUpdate(forecast) {
    const waitingMessage = "Waiting..";
    return [
        buildDeltaUpdate(OUTPUT_PATHS.TREND_TENDENCY_COMBINED, forecast !== null ? forecast.trend.tendency + "." + forecast.trend.trend : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_TENDENCY, forecast !== null ? forecast.trend.tendency : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_TREND, forecast !== null ? forecast.trend.trend : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_SEVERITY, forecast !== null ? forecast.trend.severity : waitingMessage),

        buildDeltaUpdate(OUTPUT_PATHS.TREND_DIFFERENCE_FROM, forecast !== null ? forecast.trend.from : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_DIFFERENCE_TO, forecast !== null ? forecast.trend.to : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_DIFFERENCE, forecast !== null ? forecast.trend.difference : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_DIFFERENCE_PERIOD, forecast !== null ? forecast.trend.period : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.TREND_DIFFERENCE_RATIO, forecast !== null ? forecast.trend.ratio : waitingMessage),

        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_PRESSURE, forecast !== null ? forecast.predictions.pressureOnly : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_QUADRANT, forecast !== null ? forecast.predictions.quadrant : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_SEASON, forecast !== null ? forecast.predictions.season : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_BEAUFORT, forecast !== null ? forecast.predictions.beaufort : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_FRONT_TENDENCY, forecast !== null ? forecast.predictions.front.tendency : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_FRONT_PROGNOSE, forecast !== null ? forecast.predictions.front.prognose : waitingMessage),
        buildDeltaUpdate(OUTPUT_PATHS.PREDICTION_FRONT_WIND, forecast !== null ? forecast.predictions.front.wind : waitingMessage),
    ];
}

function buildDeltaUpdate(path, value) {
    return {
        path: path,
        value: value
    }
}

function clear() {
    barometerTrend.clear();

    latest.twd.time = null;
    latest.twd.value = null;
    latest.position.time = null;
    latest.position.value = null;
    latest.altitude.value = null;
    latest.temperature.value = null;
}

function preLoad() {
    return prepareUpdate(null);
}

function hasTWDWithinOneMinute() {
    return latest.twd.time !== null ? (Date.now() - latest.twd.time) <= ONE_MINUTE_MILLISECONDS : false;
}

function hasPositionWithinOneMinute() {
    return latest.position.time !== null ? (Date.now() - latest.position.time) <= ONE_MINUTE_MILLISECONDS : false;
}

function isNortherHemisphere() {
    let position = hasPositionWithinOneMinute() ? latest.position.value : null;
    if (position === null) return true; //default to northern hemisphere

    return position.latitude < 0 ? false : true;
}

module.exports = {
    SUBSCRIPTIONS,
    OUTPUT_PATHS,
    hasTWDWithinOneMinute,
    isNortherHemisphere,
    hasPositionWithinOneMinute,
    onDeltasUpdate,
    clear,
    preLoad,
    latest,
    toKelvinIfCelcius,
    toPaIfHpa
}
