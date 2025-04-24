'use strict'
const meta = require('./meta.json');
const schema = require('./schema');
const barometer = require('./src/barometer');
const globals = require('barometer-trend/src/globals');
const map = require('./src/map');
const PersistHandler = require('./src/persistHandler');

module.exports = function (app) {
    var plugin = { };
    let persistTimer = null;
    let forecastUpdateTimer = null;
    let forecastUpdateRate = null;
    let allowPersist = false;
    const storage = new PersistHandler(app);

    plugin.id = 'signalk-barometer-trend';
    plugin.name = 'Barometer Trend';
    plugin.description = 'Calculate pressure trends and weather forecasts using barometric pressure and atmospheric variables.';

    var unsubscribes = [];
    plugin.start = function (settings, restartPlugin) {
        app.debug('Plugin started');

        if (settings.generalSettingsSection !== undefined && settings.optionalSettingsSection !== undefined) {
            applySetting(
                'Sample Rate',
                settings.generalSettingsSection.sampleRate,
                (value) => barometer.setSampleRate(value)
            );
            applySetting(
                'Forecast Rate',
                settings.generalSettingsSection.forecastUpdateRate,
                (value) => setForecastUpdateRate(value) //to milliseconds
            );
            applySetting(
                'Altitude Offset',
                settings.generalSettingsSection.altitude,
                (value) => barometer.setAltitudeCorrection(value)
            );
            applySetting(
                'Save',
                settings.optionalSettingsSection.save,
                (value) => togglePersist(value)
            );
            applySetting(
                'Diurnal',
                settings.optionalSettingsSection.diurnal,
                (value) => globals.setApplyDiurnalRythm(value)
            );
            applySetting(
                'Smoothing',
                settings.optionalSettingsSection.smoothing,
                (value) => globals.setApplySmoothing(value)
            );
        }

        barometer.populate(storage.read.bind(storage));

        let localSubscription = {
            context: '*',
            subscribe: barometer.SUBSCRIPTIONS
        };

        app.subscriptionmanager.subscribe(
            localSubscription,
            unsubscribes,
            subscriptionError => {
                app.error('Error:' + subscriptionError);
            },
            delta => sendDelta(barometer.onDeltasUpdate(delta))
        );
    };

    plugin.stop = function () {
        app.debug('Plugin stopping... cleaning up!');
        clearInterval(persistTimer);
        clearInterval(forecastUpdateTimer);
        
        if(allowPersist) {
            barometer.persist(storage.write.bind(storage));
            app.debug('Saved latest Plugin data to offline storage');
        }

        unsubscribes.forEach(f => f());
        unsubscribes = [];
        app.debug('Plugin stopped');
    };

    plugin.schema = schema.schema;
    plugin.uiSchema = schema.uiSchema;

    /**
     * 
     * @param {number} seconds Set forecast rate in seconds
     */
    function setForecastUpdateRate(seconds) {
        try {
            forecastUpdateRate = seconds * 1000;

            clearInterval(forecastUpdateTimer);

            forecastUpdateTimer = setInterval(function () {
                const json = barometer.getForecast();
                var deltaValues = map.mapProperties(json);
                sendDelta(deltaValues);
                app.debug(`Forecast Update Rate set to ${seconds} seconds`);
            }, forecastUpdateRate);
        } catch(error) {
            app.error(`Failed to set Forecast Update Rate: ${error.message}`);
        }
    }

    /**
     * 
     * @param {boolean} isEnabled True or false
     */
    function togglePersist(isEnabled) {
        try {
            allowPersist = isEnabled;
            clearInterval(persistTimer);

            if(allowPersist) {
                persistTimer = setInterval(function () {
                    barometer.persist(storage.write.bind(storage));
                }, barometer.sampleRate); //as often as the sample rate
            }

            app.debug(`Save Plugin Data is ${allowPersist ? 'enabled' : 'disabled'} `);
        } catch(error) {
            app.error(`Failed to ${isEnabled ? 'enable' : 'disable'} Save Plugin Data: ${error.message}`);
        }
    }

    function applySetting(settingName, settingValue, applyCallback) {
        if (settingValue === null || settingValue === '') {
            app.error(`${settingName} is invalid: null, undefined, or empty.`);
            return;
        }
        
        try {
            applyCallback(settingValue);
            app.debug(`${settingName} set to ${settingValue}`);
        } catch (error) {
            app.error(`Error setting ${settingName}: ${error.message}`);
        }
    }
      
    function sendDelta(deltaValues) {
        if (deltaValues !== null && deltaValues.length > 0) {
            let signalk_delta = {
                context: "vessels." + app.selfId,
                updates: [
                    {
                        timestamp: new Date().toISOString(),
                        values: deltaValues,
                        meta,
                    }
                ]
            };

            app.handleMessage(plugin.id, signalk_delta);
        } 
    }

    return plugin;
};