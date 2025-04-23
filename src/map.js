const NO_FRONT_DETECTED = "No front detected";

const propertyMap = [
    { signalK: "environment.outside.pressureTendency", src: (json) => validateProperty(json.trend.tendency) },
    { signalK: "environment.outside.pressureTrend", src: (json) => validateProperty(json.trend.trend) },
    { signalK: "environment.outside.pressureSeverity", src: (json) => validateProperty(json.trend.severity) },
    { signalK: "environment.outside.pressurePeriod", src: (json) => validateProperty(json.trend.period * 60) },
    { signalK: "environment.outside.pressurePeriodFrom", src: (json) => validateProperty(json.trend.from.meta.value) },
    { signalK: "environment.outside.pressurePeriodTo", src: (json) => validateProperty(json.trend.to.meta.value) },
    
    { signalK: "environment.forecast.pressureOnly", src: (json) => validateProperty(json.models.pressureOnly) },
    { signalK: "environment.forecast.pressureAndWind", src: (json) => validateProperty(json.models.quadrant) },
    { signalK: "environment.forecast.pressureAndSeason", src: (json) => validateProperty(json.models.season) },
    { signalK: "environment.forecast.beaufortForce", src: (json) => validateProperty(json.models.beaufort.force) },
    { signalK: "environment.forecast.beaufortDescription", src: (json) => validateProperty(json.models.beaufort.description) },
    { signalK: "environment.forecast.frontTendency", src: (json) => validateProperty(json.models.front.tendency, NO_FRONT_DETECTED) },
    { signalK: "environment.forecast.frontPrognose", src: (json) => validateProperty(json.models.front.prognose, NO_FRONT_DETECTED) },
    { signalK: "environment.forecast.frontWind", src: (json) => validateProperty(json.models.front.wind, NO_FRONT_DETECTED) },

    { signalK: "environment.forecast.pressureSystem", src: (json) => validateProperty(json.models.system.name) },

    { signalK: "environment.outside.pressureMinus01hr", src: (json) => history(json, 1) },
    { signalK: "environment.outside.pressureMinus03hr", src: (json) => history(json, 3) },
    { signalK: "environment.outside.pressureMinus06hr", src: (json) => history(json, 6) },
    { signalK: "environment.outside.pressureMinus12hr", src: (json) => history(json, 12) },
    { signalK: "environment.outside.pressureMinus24hr", src: (json) => history(json, 24) },
    { signalK: "environment.outside.pressureMinus48hr", src: (json) => history(json, 48) }
];

/**
 * Maps properties from the JSON structure to Signal K delta updates.
 * 
 * @param {Array<Object>} json - barometer-trend (npm-package) JSON structure
 * @returns {Array<Object>|null} - Array of delta updates or null if no updates
 */
function mapProperties(json) {
    if(json === null || typeof json !== 'object') {
        throw new Error("Invalid JSON structure provided for mapping properties.");
    }

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
    mapProperties,
    buildDeltaPath
};