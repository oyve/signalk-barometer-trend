const meta = require('./meta.json');
const utils = require('./utils');
const barometer = require('./barometer');

const DEFAULT_SAMPLE_RATE = utils.minutesToMilliseconds(2);

let sampleRate = DEFAULT_SAMPLE_RATE; //default

const DEFAULT_PERIOD = utils.secondsToMilliseconds(30);
const DEFAULT_MIN_PERIOD = utils.secondsToMilliseconds(60);
const DEFAULT_POLICY = "instant";
const DEFAULT_FORMAT = "delta";

const SUBSCRIPTIONS = [
    { path: 'environment.wind.directionTrue', period: DEFAULT_PERIOD, policy: DEFAULT_POLICY, minPeriod: DEFAULT_MIN_PERIOD, handle: (timestamp, value) => barometer.onTrueWindUpdated(timestamp, value), "format": DEFAULT_FORMAT },
    { path: 'environment.wind.speedTrue', period: DEFAULT_PERIOD, policy: DEFAULT_POLICY, minPeriod: DEFAULT_MIN_PERIOD, handle: (timestamp, value) => barometer.onWindSpeedUpdated(timestamp, value), "format": DEFAULT_FORMAT },
    { path: 'navigation.position', period: DEFAULT_PERIOD, policy: DEFAULT_POLICY, minPeriod: DEFAULT_MIN_PERIOD, handle: (timestamp, value) => barometer.onPositionUpdated(timestamp, value), "format": DEFAULT_FORMAT },
    { path: 'navigation.gnss.antennaAltitude', period: DEFAULT_PERIOD, policy: DEFAULT_POLICY, minPeriod: DEFAULT_MIN_PERIOD, handle: (timestamp, value) => barometer.onAltitudeUpdated(timestamp, value), "format": DEFAULT_FORMAT },
    { path: 'environment.outside.temperature', period: DEFAULT_PERIOD, policy: DEFAULT_POLICY, minPeriod: DEFAULT_MIN_PERIOD, handle: (timestamp, value) => barometer.onTemperatureUpdated(timestamp, value), "format": DEFAULT_FORMAT },
    { path: 'environment.outside.humidity', period: DEFAULT_PERIOD, policy: DEFAULT_POLICY, minPeriod: DEFAULT_MIN_PERIOD, handle: (timestamp, value) => barometer.onHumidityUpdated(timestamp, value), "format": DEFAULT_FORMAT },
    { path: 'environment.outside.pressure', period: sampleRate, handle: (timestamp, value) => barometer.onPressureUpdated(timestamp, value) }
];

function buildRaiseAlertMessage() {
    message = {
        state: 'alarm', // could be 'normal', 'alert', or 'alarm'
        method: ['visual', 'sound'], // how it should be presented
        message: `No pressure reading for ${barometer.sampleRate/60000} minutes! Check sensor.`
      };

    return buildDeltaPath('notifications.pressure.outside', message);
}

function buildClearRaiseAlertMessage() {
    return buildDeltaPath('notifications.pressure.outside', null);
}

function handleIncomingDelta(delta) {
    try {
        if(delta && delta.updates) {
            let delta_updates = processDeltaUpdate(delta)
            
            if(!delta_updates || delta_updates.length === 0) return; //no delta messages returned to update in signalk
            
            return buildDelta(delta_updates);
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        console.error(`Failed to process delta: ${error.message}`);
    }
}

function processDeltaUpdate(delta) {
    if (!delta || !Array.isArray(delta.updates) || delta.updates.length === 0) {
        throw new Error("Invalid delta: must contain updates.");
    }

    let deltaValues = [];

    delta.updates.forEach(update => {
        if (!update.values) return;
        
        try {
            const timestamp = new Date(update.timestamp);
            update.values.forEach((value) => {
                let subscription = SUBSCRIPTIONS.find((d) => d.path === value.path);
                if (subscription) {
                    let handle = subscription.handle;
                    if (typeof handle !== 'function') {
                        throw new Error(`Invalid handler for path ${value.path}`);
                    }
                    try {
                        let updates = handle(timestamp, value.value);
                        if (updates && updates.length > 0) {
                            deltaValues.push(...updates);
                        }
                    } catch(error) {
                        console.log(`Could not handle delta path update: ${value.path}`)
                        throw new Error(error);
                    }
                }
            });
        } catch (error) {
            throw error
        }
    });

    return deltaValues;
}

/**
 * Builds a delta path object for Signal K.
 * 
 * @param {string} path - The Signal K path
 * @param {any} value - The value to set at the path
 * @returns {Object} - The delta path object
 */
function buildDeltaPath(path, value) {
    return {
        path: path,
        value: value
    };
}

function buildDelta(deltaValues, context = "self") {
    if (deltaValues != null && deltaValues.length > 0) {
        const deltaMessage = {
            context: `vessels.${context}`,
            updates: [
                {
                    timestamp: new Date().toISOString(),
                    values: deltaValues,
                    meta,
                }
            ]
        };

        return deltaMessage;
    } 
}

module.exports = {
    SUBSCRIPTIONS,
    buildRaiseAlertMessage,
    buildClearRaiseAlertMessage,
    handleIncomingDelta,
    processDeltaUpdate,
    buildDeltaPath,
    buildDelta
}