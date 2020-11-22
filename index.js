'use strict'
const barometer = require('./barometer');

module.exports = function (app) {
    var plugin = {};

    plugin.id = 'signalk-barometer-trend';
    plugin.name = 'SignalK Barometer Trend';
    plugin.description = 'Calculates barometric trend over time with prediction';

    var unsubscribes = [];
    plugin.start = function (options, restartPlugin) {

        app.debug('Plugin started');
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

        sendDelta([
            barometer.buildDeltaUpdate(barometer.OUTPUT_PATHS.PRESSURE_TENDENCY, 'Waiting...'),
            barometer.buildDeltaUpdate(barometer.OUTPUT_PATHS.PRESSURE_TREND, 'Waiting...'),
            barometer.buildDeltaUpdate(barometer.OUTPUT_PATHS.PRESSURE_INDICATOR, 'Waiting...'),
            barometer.buildDeltaUpdate(barometer.OUTPUT_PATHS.PRESSURE_SEVERITY, 0),
        ]);
    };

    plugin.stop = function () {
        unsubscribes.forEach(f => f());
        unsubscribes = [];
        app.debug('Plugin stopped');
    };

    plugin.schema = {
        // The plugin schema
    };

    /**
     * 
     * @param {Array<[{path:path, value:value}]>} messages 
     */
    function sendDelta(messages) {
        app.handleMessage('signalk-barometer-trend', {
            updates: [
                {
                    values: messages
                }
            ]
        })
    }

    return plugin;
};