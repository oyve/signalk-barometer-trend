'use strict'
const fs = require('fs');
const meta = require('./meta.json');
const schema = require('./schema.json');
const barometer = require('./src/barometer');
const globals = require('barometer-trend/src/globals');

module.exports = function (app) {
    var plugin = { };
    let persistTimer = null;

    plugin.id = 'signalk-barometer-trend';
    plugin.name = 'Barometer Trend';
    plugin.description = 'Calculate the pressure trend and other weather forecasts based on barometric pressure.';

    var unsubscribes = [];
    plugin.start = function (settings, restartPlugin) {
        app.debug('Plugin started');

        if (settings.generalSettingsSection !== undefined && settings.optionalSettingsSection !== undefined) {
            applySetting(
                'Sample Rate',
                settings.generalSettingsSection.rate,
                (value) => barometer.setSampleRate(value)
            );
            applySetting(
                'Altitude Offset',
                settings.generalSettingsSection.altitude,
                (value) => barometer.setAltitudeCorrection(value)
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

        barometer.populate(read);

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

        persistTimer = setInterval(function () {
            barometer.persist(write);
        }, 1000 * 60 * 3); //every 3 minutes        
    };

    plugin.stop = function () {
        app.debug('Plugin stopping');
        clearInterval(persistTimer);
        barometer.persist(write);

        unsubscribes.forEach(f => f());
        unsubscribes = [];
        app.debug('Plugin stopped');
    };

    plugin.schema = schema[0];

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

    function write(json) {
        let content = JSON.stringify(json, null, 2);

        fs.writeFile(offlineFilePath(), content, 'utf8', (err) => {
            if (err) {
                app.debug(err.stack);
                app.error(err);
                deleteOfflineFile(); //try delete as it may be corrupted
            } else {
                app.debug(`Wrote plugin data to file: ${offlineFilePath()}`);
            }
        });
    }

    function read() {
        try {
            const content = fs.readFileSync(offlineFilePath(), 'utf-8');
            return !content ? null : barometer.JSONParser(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            } else {
                app.error(`Error reading file: ${error.message}`);
                deleteOfflineFile();  //try delete as it may be corrupted

                return [];
            }
        }
    }

    function deleteOfflineFile() {
        try {
            if(fs.existsSync(offlineFilePath())) {
                app.debug(`Deleting file: ${offlineFilePath()}`);
                fs.unlink(offlineFilePath(), (error) => {
                    if (error) {
                        app.error(`Error deleting file: ${error.message}`);
                        return;
                    }
                    app.debug('File deleted successfully!');
                });
            }
        }
        catch (error) {
            app.error(`Error deleting file: ${error.message}`);
            return;
        }
    }

    return plugin;
};