'use strict'
const utils = require('./src/utils');
const schema = require('./schema');
const barometer = require('./src/barometer');
const globals = require('barometer-trend/src/globals');
const deltaPathMapper = require('./src/deltaPathMapper');
const PersistHandler = require('./src/persistHandler');
const deltaHandler = require('./src/deltaHandler');

module.exports = function (app) {
    var plugin = { };
    let persistTimer = null;
    let forecastUpdateTimer = null;
    let pressureUpdateTimer = null;
    let allowPersist = false;
    const storage = new PersistHandler(app);

    plugin.id = 'signalk-barometer-trend';
    plugin.name = 'Barometer Trend';
    plugin.description = 'Calculate pressure trends and weather forecasts using barometric pressure and atmospheric variables.';

    var unsubscribes = [];
    plugin.start = function (settings, restartPlugin) {
        app.debug('Plugin started.');
        if(restartPlugin) app.debug('Plugin restarted.');

        if (settings.generalSettingsSection !== undefined && settings.optionalSettingsSection !== undefined) {
            applySetting(
                'Forecast Rate',
                settings.generalSettingsSection.forecastUpdateRate,
                (value) => setForecastUpdateRate(utils.minutesToSeconds(value))
            );
            applySetting(
                'Altitude Offset',
                settings.generalSettingsSection.altitudeOffset,
                (value) => barometer.setAltitudeOffset(value)
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
        }

        barometer.populate(storage.read.bind(storage));

        let localSubscription = {
            context: 'vessels.self',
            subscribe: deltaHandler.SUBSCRIPTIONS
        };

        app.subscriptionmanager.subscribe(
            localSubscription,
            unsubscribes,
            subscriptionError => {
                app.error(`Subscription Error: ${subscriptionError}`);
            },
            delta => {
                let result = deltaHandler.handleIncomingDelta(delta);
                
                // if(result != null) {
                //     sendToSignalK(result);
                // }
            }
        );

        createPressureWatch()
    };

    let isAlarmRaised = false;
    function createPressureWatch() {
        if(pressureUpdateTimer === null) {
            pressureUpdateTimer = setInterval(function () {
                try {
                    if(!barometer.hasRecentPressureUpdate()) {
                        if(isAlarmRaised) return;
                        let deltaMessage = deltaHandler.buildRaiseAlertMessage();
                        if(!deltaMessage) return;
                        sendToSignalK(deltaMessage);
                        app.error(`No environment.outside.pressure update for ${barometer.sampleRate/60000} minutes.`);
                        isAlarmRaised = true;
                    } else {
                        let message = deltaHandler.buildClearRaiseAlertMessage();
                        app.handleMessage(plugin.id, message);
                        isAlarmRaised = false;
                        app.error(`Cleared notification for environment.outside.pressure.`);
                    }
                } catch(error) {
                    app.error(`Failed build/clear raise alert message: ${error}`);
                }
            }, barometer.sampleRate * 1.2); //every sampleRate + 20% time
        }
    }

    plugin.stop = function () {
        app.debug('Plugin stopping... cleaning up!');
        clearInterval(persistTimer);
        clearInterval(forecastUpdateTimer);
        clearInterval(pressureUpdateTimer);
        
        if(allowPersist) {
            barometer.persist(storage.write.bind(storage));
            app.debug('Saved Plugin data to offline storage');
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
        const forecastUpdateRate = utils.secondsToMilliseconds(seconds)

        clearInterval(forecastUpdateTimer);

        forecastUpdateTimer = setInterval(function () {
            try {
                if(!barometer.hasRecentPressureUpdate()) return;
                const json = barometer.getForecast();
                if(json != null) {
                    let deltaValues = deltaPathMapper.mapJSON(json);
                    let result = deltaHandler.buildDelta(deltaValues);
                    if(result != null) {
                        sendToSignalK(result);
                    }
                    app.debug(`New Forecast JSON available`);
                } else {
                    //no forecast received, do nothing
                    //app.error(`Forecast JSON is null`);    
                }
            } catch(error) {
                app.error(`Failed to getForecast: ${error}`);
            }

        }, forecastUpdateRate);
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

    function sendToSignalK(deltaMessage) {
        app.handleMessage(plugin.id, deltaMessage);
    }

    return plugin;
};