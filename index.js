'use strict'
const meta = require('./meta.json');
const schema = require('./schema.json');
const barometer = require('./barometer');

module.exports = function (app) {
    var plugin = {};

    plugin.id = 'signalk-barometer-trend';
    plugin.name = 'Barometer Trend';
    plugin.description = 'Calculate tendency, trend and weather predictions of barometric pressure';

    var unsubscribes = [];
    plugin.start = function (options, restartPlugin) {
        app.debug('Plugin started');

        barometer.setSampleRate(options.rate * 1000);
        app.debug('Sample rate set to ' + options.rate + " seconds");
        barometer.setAltitudeCorrection(options.altitude);
        app.debug('Altitude offset set to ' + options.altitude + " metre(s)");

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

            //console.debug(JSON.stringify(signalk_delta));
            app.handleMessage(plugin.id, signalk_delta);
        }
    }

    return plugin;
};