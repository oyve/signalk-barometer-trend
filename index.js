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

        barometer.setSampleRate(options.rate * 1000);
        app.debug('Sample rate set to ' + options.rate + " seconds");
        
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

        sendDelta(barometer.preLoad());
    };

    plugin.stop = function () {
        unsubscribes.forEach(f => f());
        unsubscribes = [];
        app.debug('Plugin stopped');
    };


    plugin.schema = {
        type: 'object',
        properties: {
            rate: {
                title: "Sample Rate (in seconds)",
                description: 'Example values: 60, 600, 1200 (1, 10, 20 minutes). Min: 60, Max = 3600',
                type: 'number',
                default: 60
            }
        }
    }

    /**
     * 
     * @param {Array<[{path:path, value:value}]>} deltas 
     */
    function sendDelta(deltas) {
        app.handleMessage('signalk-barometer-trend', {
            context: "vessels." + app.selfId,
            updates: [
                {
                    timestamp: new Date().toISOString(),
                    ...deltas
                }
            ]
        })
    }

    return plugin;
};