const deltaHandler = require('./deltaHandler');

const basePath = "environment.barometer";

const mappings = [
    { signalKPath: `${basePath}.now.label`, src: (json) => setPropertyOrDefault(json.models.label.label) },
    // { signalKPath: `${basePath}.now.labelDescription`, src: (json) => setPropertyOrDefault(json.models.label.description) },

    { signalKPath: `${basePath}.pressureTendency`, src: (json) => setPropertyOrDefault(json.trend.tendency) },
    { signalKPath: `${basePath}.pressureTrend`, src: (json) => setPropertyOrDefault(json.trend.trend.key) },
    { signalKPath: `${basePath}.pressureSeverity`, src: (json) => setPropertyOrDefault(json.trend.trend.severity) },
    //{ signalKPath: `${basePath}.dataQuality`, src: (json) => setPropertyOrDefault(json.dataQuality) },
    
    
    // { signalKPath: `${basePath}.pressurePeriod`, src: (json) => validateProperty(json.trend.period * 60) },
    // { signalKPath: `${basePath}.pressurePeriodFrom`, src: (json) => validateProperty(json.trend.from.value) },
    // { signalKPath: `${basePath}.pressurePeriodTo`, src: (json) => validateProperty(json.trend.to.value) },

    // { signalKPath: `${basePath}.pressureSmoothed`, src: (json) => setPropertyOrDefault(json.pressure.calculated.smoothed) },
    // { signalKPath: `${basePath}.pressureAtSeaLevel`, src: (json) => setPropertyOrDefault(json.pressure.calculated.pressureASL) },
    // { signalKPath: `${basePath}.pressureDiurnal`, src: (json) => setPropertyOrDefault(json.pressure.calculated.diurnalPressure) },
    // { signalKPath: `${basePath}.pressureDiurnalAtSeaLevel`, src: (json) => setPropertyOrDefault(json.pressure.calculated.diurnalPressureASL) },
    
    { signalKPath: `${basePath}.beaufortForce`, src: (json) => setPropertyOrDefault(json.models.beaufort.byPressure.force) },
    { signalKPath: `${basePath}.beaufortDescription`, src: (json) => setPropertyOrDefault(json.models.beaufort.byPressure.description) },
    // { signalKPath: `${basePath}.beaufortWindCategory`, src: (json) => validateProperty(json.models.beaufort.byWind.category) },
    // { signalKPath: `${basePath}.beaufortWindForce`, src: (json) => validateProperty(json.models.beaufort.byWind.force) },
    
    { signalKPath: `${basePath}.forecastDetailed`, src: (json) => setPropertyOrDefault(json.models.forecastText) },
    
    { signalKPath: `${basePath}.forecast.pressureOnly`, src: (json) => setPropertyOrDefault(json.models.pressureOnly) },
    { signalKPath: `${basePath}.forecast.pressureAndWind`, src: (json) => setPropertyOrDefault(json.models.quadrant, "No wind data") },
    { signalKPath: `${basePath}.forecast.pressureAndSeason`, src: (json) => setPropertyOrDefault(json.models.season) },

    // { signalKPath: `${basePath}.forecast.frontTendency`, src: (json) => setPropertyOrDefault(json.models.front.tendency) },
    // { signalKPath: `${basePath}.forecast.frontPrognose`, src: (json) => setPropertyOrDefault(json.models.front.prognose) },
    // { signalKPath: `${basePath}.forecast.frontWind`, src: (json) => setPropertyOrDefault(json.models.front.wind) },

    { signalKPath: `${basePath}.forecast.pressureSystemCurrent`, src: (json) => setPropertyOrDefault(json.models.pressureSystem.current.name) },
    { signalKPath: `${basePath}.forecast.pressureSystemTrending`, src: (json) => setPropertyOrDefault(json.models.pressureSystem.trending.name) }
];

/**
 * Maps properties from the JSON structure to Signal K delta updates.
 * 
 * @param {Array<Object>} json - barometer-trend (npm-package) JSON structure
 * @returns {Array<Object>|null} - Array of delta updates or null if no updates
 */
function mapJSON(json) {
    if(json === null || typeof json !== 'object') {
        throw new Error("Invalid JSON structure provided for mapping properties.");
    }
    const deltaUpdates = [];
    mappings.forEach((p) => {
        let value = null;
        if(json != null) {
            try {
                value = p.src(json);
                let deltaUpdate = deltaHandler.buildDeltaPath(p.signalKPath, value);
                deltaUpdates.push(deltaUpdate);
            } catch(error) {
                console.debug("Failed to map property: " + p.signalK + ". Error: " + error.message);
                console.debug(error);
                //ignore, map other properties
            }
        } else {
            console.debug("JSON cannot be null.");
            throw new Error("JSON cannot be null.");
        }
    });

    return deltaUpdates.length > 0 ? deltaUpdates : null;
}

function isValidJsonPath(obj, path) {
    const keys = path.split('.');  // Split the path into keys based on dot notation

    // Loop through the keys to check if each part exists in the object
    for (let i = 0; i < keys.length; i++) {
        // If the key doesn't exist or is undefined, return false
        if (obj === null || obj === undefined || !obj.hasOwnProperty(keys[i])) {
            return false;
        }
        // Move to the next level of the object
        obj = obj[keys[i]];
    }
    return true; // If we reach the end of the path and no issues, the path is valid
}

const defaultPropertyValue = null;

/**
 * Validates a property value, returning a default value if the property is null or undefined.
 * 
 * @param {any} value - The property value to validate
 * @param {any} [defaultValue=defaultPropertyValue] - The default value to return if the property is invalid
 * @returns {any} - The validated property value or the default value
 */
function setPropertyOrDefault(value, defaultValue = defaultPropertyValue) {
    return (value != null) ? value : defaultValue;
}

module.exports = {
    mapJSON
};