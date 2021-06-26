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
    { signalK: "environment.outside.pressure.prediction.front.tendency", src: (json) => validateProperty(json.predictions.front.tendency) },
    { signalK: "environment.outside.pressure.prediction.front.prognose", src: (json) => validateProperty(json.predictions.front.prognose) },
    { signalK: "environment.outside.pressure.prediction.front.wind", src: (json) => validateProperty(json.predictions.front.wind) },

    { signalK: "environment.outside.pressure.system", src: (json) => validateProperty(json.system.name) },

    { signalK: "environment.outside.pressure.1hr", src: (json) => history(json, 1) },
    { signalK: "environment.outside.pressure.3hr", src: (json) => history(json, 3) },
    { signalK: "environment.outside.pressure.6hr", src: (json) => history(json, 6) },
    { signalK: "environment.outside.pressure.12hr", src: (json) => history(json, 12) },
    { signalK: "environment.outside.pressure.24hr", src: (json) => history(json, 24) },
    { signalK: "environment.outside.pressure.48hr", src: (json) => history(json, 48) }
]

/**
 * 
 * @param {Array<Object>} json barometer-trend (npm-package) JSON structure
 * @returns [{path: path, value: value}]
 */
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

    return deltaUpdates.length > 0 ? deltaUpdates : null;
}

const history = (json, hour) => { return validateProperty(json.history.find((h) => h.hour === hour).pressure.meta.value) }
const defaultPropertyValue = null;

function validateProperty(value, defaultValue = defaultPropertyValue) {
    return (value !== null || value !== undefined) ? value : defaultValue;
}

function buildDeltaUpdate(path, value) {
    return {
        path: path,
        value: value
    }
}

module.exports = {
	mapProperties
}