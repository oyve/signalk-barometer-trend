'use strict'
const meta = require('./meta.json');
const schema = require('./schema');
const barometer = require('./src/barometer');
const globals = require('barometer-trend/src/globals');
const map = require('./src/map');
const persist = require('./src/persist');

module.exports = function (app) {
    var plugin = { };
    let persistTimer = null;
    let forecastUpdateTimer = null;
    let forecastUpdateRate = null;
    let allowPersist = false;
    const storage = new persist(offlineFilePath());

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
                (value) => persist(value)
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

        barometer.populate(storage.read);

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
        app.debug('Plugin stopping');
        clearInterval(persistTimer);
        clearInterval(forecastUpdateTimer);
        
        if(allowPersist) {
            barometer.persist(storage.write);
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
     * @param {boolean} enable Enable/disable persist
     */
    function persist(enable) {
        try {
            allowPersist = enable;
            if(allowPersist) {
                persistTimer = setInterval(function () {
                    barometer.persist(storage.write);
                    app.debug(`Persist plugin data enabled`);
                }, barometer.sampleRate); //as often as the sample rate
            } else {
                clearInterval(persistTimer);
                app.debug(`Persist plugin data disabled`);
            }
        } catch(error) {
            app.error(`Failed to ${enable ? 'enable' : 'disable'} Persist Plugin Data: ${error.message}`);
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

    function offlineFilePath() {
        return app.getDataDirPath() + "/offline.json";
    }

    return plugin;
};