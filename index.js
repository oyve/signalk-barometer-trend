'use strict'
const fs = require('fs');
const meta = require('./meta.json');
const schema = require('./schema.json');
const barometer = require('./barometer');

module.exports = function (app) {
    var plugin = { };
    let persistTimer = null;

    plugin.id = 'signalk-barometer-trend';
    plugin.name = 'Barometer Trend';
    plugin.description = 'Calculate tendency, trend and weather predictions of barometric pressure';

    var unsubscribes = [];
    plugin.start = function (options, restartPlugin) {
        app.debug('Plugin started');
        
        barometer.setSampleRate(options.rate);
        app.debug('Sample rate set to ' + options.rate + " seconds");
        barometer.setAltitudeCorrection(options.altitude);
        app.debug('Altitude offset set to ' + options.altitude + " metre(s)");

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
        clearInterval(persistTimer)
        barometer.persist(write);

        unsubscribes.forEach(f => f());
        unsubscribes = [];
        app.debug('Plugin stopped');
    };

    plugin.schema = schema[0];

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
            } else {
                app.debug("Wrote plugin data to file " + offlineFilePath());
            }
        });
    }

    function read() {
        try {
            const content = fs.readFileSync(offlineFilePath(), 'utf-8');

            try {
                return JSON.parse(content);
            } catch (err) {
                app.error("Could not parse JSON : " + content);
                app.error(err.stack);
                return [];
            }
        } catch (e) {
            if (e.code && e.code === 'ENOENT') {
                return [];
            }
        }
        return [];
    }

    return plugin;
};