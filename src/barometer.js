'use strict'
const utils = require('./utils');

const barometerTrend = require('barometer-trend');
const readingStore = require('barometer-trend/src/readingStore');
const lodash = require('lodash');

const DEFAULT_SAMPLE_RATE = utils.minutesToMilliseconds(2);
const DEFAULT_ALTITUDE_OFFSET = 0;
let lastSentPressureReading = null;

class Barometer {
    constructor() {
        this.trend = barometerTrend;
        this.readingStore = readingStore;
    }

    sampleRate = DEFAULT_SAMPLE_RATE; //default

    /**
     * 
     * @param {number} rate Pressure sample rate in milliseconds
     */
    setSampleRate(rate) {
        if (!rate) return;

        // Ensure rate is within the range 60 - 1200 and convert to milliseconds
        return this.sampleRate = Math.min(Math.max(rate, 60), 1200) * 1000;
    }

    /**
     * 
     * @param {number} offset Set Altitude correction in meters
     * @returns 
     */
    setAltitudeOffset(offset = DEFAULT_ALTITUDE_OFFSET) {
        if (offset === null && offset === undefined) return;
        this.getLatest().altitude.offset = offset
        
        barometerTrend.changeAltitude(this.getCalculatedAltitude());
    }

    TEMPLATE_LATEST = {
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
            time: null,
            value: 0, //updated automatically from GNSS
            offset: 0 //updated manually from SignalK plugin settings
        },
        temperature: {
            time: null,
            value: null
        },
        humidity: {
            time: null,
            value: null
        }
    }

    getCalculatedAltitude() {
        return this.getLatest().altitude.value + this.getLatest().altitude.offset;
    }

    latest = null;
    getLatest() {
        return this.latest = this.latest ?? lodash.cloneDeep(this.TEMPLATE_LATEST);
    }

    getLastSent() {{
        return lastSentPressureReading;
    }}

    updateLatestProperty(property, timestamp, value) {
        const target = this.getLatest()[property];
        if (target) {
            target.time = timestamp;
            target.value = value;
        }
    }

    onPositionUpdated(timestamp, value) {
        this.updateLatestProperty('position', timestamp, value);
    }

    onHumidityUpdated(timestamp, value) {
        this.updateLatestProperty('humidity', timestamp, value);
    }

    onTemperatureUpdated(timestamp, value) {
        this.updateLatestProperty('temperature', timestamp, value);
    }

    onAltitudeUpdated(timestamp, value) {
        this.updateLatestProperty('altitude', timestamp, value);
    }

    onTrueWindUpdated(timestamp, value) {
        this.updateLatestProperty('twd', timestamp, value);
    }

    onWindSpeedUpdated(timestamp, value) {
        this.updateLatestProperty('tws', timestamp, value);
    }

    /**
     * 
     * @param {number} value Pressure value in (Pa) Pascal.
     * @returns {Array<[{path:path, value:value}]>} Delta JSON-array of updates
     */
    onPressureUpdated(timestamp, value) {
        if (!value) return;

        if(timestamp <= lastSentPressureReading) return; //there is no newer reading from sensor

        this.addPressure(
            timestamp,
            value,
            this.getCalculatedAltitude(),
            this.getLatest().temperature.value,
            this.getLatest().humidity.value,
            this.hasDataWithinSampleRate('twd') ? this.getLatest().twd.value : null,
            this.hasDataWithinSampleRate('tws') ? this.getLatest().tws.value : null,
            this.getLatest().position?.value?.latitude);
    }

    /**
     * 
     * @returns Forecast
     */
    getForecast()
    {
        return barometerTrend.getForecast(this.isNorthernHemisphere());
    }

    addPressure(datetime, pressure, altitude, temperature, humidity, twd, tws, latitude) {
        if (!datetime || !pressure) {
            console.error("datetime and pressure are required");
            return;
        }

        barometerTrend.addPressure(datetime, pressure, {
            altitude: altitude,
            temperature: temperature,
            humidity: humidity,
            trueWindDirection: twd,
            trueWindSpeed: tws,
            latitude: latitude
        });

        lastSentPressureReading = datetime;
    }

    clear() {
        barometerTrend.clear();
        this.latest = null;
        this.setAltitudeOffset(DEFAULT_ALTITUDE_OFFSET);
        this.setSampleRate(DEFAULT_SAMPLE_RATE);
    }

    hasDataWithinSampleRate(propertyPath) {
        const entry = propertyPath.split('.').reduce((obj, key) => obj?.[key], this.latest);
        return entry?.time != null ? (Date.now() - entry.time) <= this.sampleRate : false;
    }

    hasTWDWithinOneMinute() {
        return this.latest.twd.time !== null ? (Date.now() - this.latest.twd.time) <= this.sampleRate : false;
    }

    hasPositionWithinOneMinute() {
        return this.latest.position.time !== null ? (Date.now() - this.latest.position.time) <= this.sampleRate : false;
    }

    isNorthernHemisphere() {
        let position = this.hasDataWithinSampleRate('position') ? this.latest.position.value : null;
        if (position === null) return true; //default to northern hemisphere

        return position.latitude < 0 ? false : true;
    }

    getAll() {
        return this.readingStore.getAll();
    }

    hasRecentPressureUpdate() {
        let lastSent = this.getLastSent();
        if(!lastSent) return;
        const diffMs = Math.abs(Date.now() - lastSent.getTime()); // difference in milliseconds
        const diffMin = Math.floor(diffMs / 60000); //minutes
        return (diffMin <= (this.sampleRate/60000 * 1.2)) //20% difference
    }

    persist(persistCallback) {
        try {
            let json = this.getAll();
            persistCallback(json);
        } catch(error) {
            console.log("Failed to persist:" + error);
        }
    }

    populate(populateCallback) {
        // if (typeof populateCallback !== 'function') {
        //     console.error("populateCallback must be a function");
        //     return;
        // }

        const barometerData = populateCallback();
        if(!barometerData) return;
        if (!Array.isArray(barometerData)) {
            console.error("populateCallback must return an array");
            return;
        }

        try {
            barometerData.forEach(({ datetime, pressure, meta }) => {
                const { altitude, temperature, humidity, trueWindDirection, trueWindSpeed, latitude } = meta || {};
                this.addPressure(datetime, pressure, altitude, temperature, humidity, trueWindDirection, trueWindSpeed, latitude);
            });
        } catch(error) {
            console.error("Failed to populate data:" + error);
        }
    }
}  

const BarometerAsSingleton = new Barometer();
module.exports = BarometerAsSingleton;
