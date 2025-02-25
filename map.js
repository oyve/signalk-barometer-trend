const NO_FRONT_DETECTED = "No front detected";

const propertyMap = [
    { signalK: "environment.outside.pressure.trend.tendency", src: (json) => validateProperty(json.trend.tendency) },
    { signalK: "environment.outside.pressure.trend.trend", src: (json) => validateProperty(json.trend.trend) },
    { signalK: "environment.outside.pressure.trend.severity", src: (json) => validateProperty(json.trend.severity) },
    { signalK: "environment.outside.pressure.trend.period", src: (json) => validateProperty(json.trend.period * 60) },
    { signalK: "environment.outside.pressure.trend.period.from", src: (json) => validateProperty(json.trend.from.meta.value) },
    { signalK: "environment.outside.pressure.trend.period.to", src: (json) => validateProperty(json.trend.to.meta.value) },
    
    { signalK: "environment.outside.pressure.prediction.pressureOnly", src: (json) => validateProperty(json.predictions.pressureOnly) },
    { signalK: "environment.outside.pressure.prediction.quadrant", src: (json) => validateProperty(json.predictions.quadrant) },
    { signalK: "environment.outside.pressure.prediction.season", src: (json) => validateProperty(json.predictions.season) },
    { signalK: "environment.outside.pressure.prediction.beaufort", src: (json) => validateProperty(json.predictions.beaufort.force) },
    { signalK: "environment.outside.pressure.prediction.beaufort.description", src: (json) => validateProperty(json.predictions.beaufort.description) },
    { signalK: "environment.outside.pressure.prediction.front.tendency", src: (json) => validateProperty(json.predictions.front.tendency, NO_FRONT_DETECTED) },
    { signalK: "environment.outside.pressure.prediction.front.prognose", src: (json) => validateProperty(json.predictions.front.prognose, NO_FRONT_DETECTED) },
    { signalK: "environment.outside.pressure.prediction.front.wind", src: (json) => validateProperty(json.predictions.front.wind, NO_FRONT_DETECTED) },

    { signalK: "environment.outside.pressure.system", src: (json) => validateProperty(json.system.name) },

    { signalK: "environment.outside.pressure.1hr", src: (json) => history(json, 1) },
    { signalK: "environment.outside.pressure.3hr", src: (json) => history(json, 3) },
    { signalK: "environment.outside.pressure.6hr", src: (json) => history(json, 6) },
    { signalK: "environment.outside.pressure.12hr", src: (json) => history(json, 12) },
    { signalK: "environment.outside.pressure.24hr", src: (json) => history(json, 24) },
    { signalK: "environment.outside.pressure.48hr", src: (json) => history(json, 48) }
];

/**
 * Maps properties from the JSON structure to Signal K delta updates.
 * 
 * @param {Array<Object>} json - barometer-trend (npm-package) JSON structure
 * @returns {Array<Object>|null} - Array of delta updates or null if no updates
 */
function mapProperties(json) {
    const deltaUpdates = [];
    propertyMap.forEach((p) => {
        try {
            let value = (json !== null) ? p.src(json) : defaultPropertyValue;
            let deltaUpdate = buildDeltaPath(p.signalK, value);
            deltaUpdates.push(deltaUpdate);
        } catch (error) {
            console.debug("Failed to map property: " + p.signalK + " Error: " + error.message);
        }
    });

    return deltaUpdates.length > 0 ? deltaUpdates : null;
}

/**
 * Retrieves the pressure value from the history for a specific hour.
 * 
 * @param {Object} json - JSON structure containing history data
 * @param {number} hour - The hour for which to retrieve the pressure
 * @returns {number|null} - The pressure value or null if not found
 */
const history = (json, hour) => {
    try {
        let pressure = json.history.find((h) => h.hour === hour).pressure;
        return pressure !== null ? validateProperty(pressure.meta.value) : null;
    } catch (error) {
        console.debug("Failed to retrieve history for hour: " + hour + " Error: " + error.message);
        return null;
    }
};

const defaultPropertyValue = null;

/**
 * Validates a property value, returning a default value if the property is null or undefined.
 * 
 * @param {any} value - The property value to validate
 * @param {any} [defaultValue=defaultPropertyValue] - The default value to return if the property is invalid
 * @returns {any} - The validated property value or the default value
 */
function validateProperty(value, defaultValue = defaultPropertyValue) {
    return (value !== null && value !== undefined) ? value : defaultValue;
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

module.exports = {
    mapProperties
};