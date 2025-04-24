const schema = 
  {
	"$schema": "http://json-schema.org/draft-07/schema#",
	"$id": "https://github.com/oyve/signalk-barometer-trend/blob/main/schema.json",
	"title": "Barometer Trend Plugin Settings",
	"type": "object",
	"properties": {
		"noteSection": {
			"type": "null",
			"title": "Note",
			"description": "The plugin needs 1–3 hours of pressure data to detect trends and make useful forecasts. Accuracy improves with more data. Settings can be adjusted anytime"
		},
		"generalSettingsSection": {
			"type": "object",
			"title": "General Settings",
			"description": "Configure general settings for the barometer trend.",
			"required": ["sampleRate", "forecastUpdateRate", "altitude"],
			"properties": {
				"sampleRate": {
					"type": "integer",
					"title": "Pressure Sample Rate (seconds)",
					"description": "Pressure reading interval in seconds. Min: 60 (1 min), Max: 1200 (20 min). Default: 180 (3 min).",
					"default": 180,
					"minimum": 60,
					"maximum": 1200,
					"multipleOf": 60
				},
				"forecastUpdateRate": {
					"type": "integer",
					"title": "Forecast Update Rate (seconds)",
					"description": "Forecast update interval in seconds. Must be greater than Sample Rate. Min: 600 (10 min), Max: 3600 (60 min). Default: 600 (10 min).",
					"default": 600,
					"minimum": 600,
					"maximum": 3600,
					"multipleOf": 60
				},
				"altitude": {
					"type": "integer",
					"title": "Sensor Altitude Offset (meters)",
					"description": "Set barometer sensor altitude offset relative to GPS altitude. (Default: 0 meters)",
					"default": 0
				}
			}
		},
		"optionalSettingsSection": {
			"type": "object",
			"title": "Optional Settings",
			"description": "Configure optional settings for the barometer trend.",
			"properties": {
				"save": {
					"type": "boolean",
					"title": "Enable Save Plugin Data",
					"description": "Save internal plugin data to disk to preserve state across restarts and during short downtimes (<3 hours).",
					"default": false
				},
				"diurnal": {
					"type": "boolean",
					"title": "Enable Diurnal Correction",
					"description": "Apply diurnal correction to pressure trend. (Default: false)",
					"default": false
				},
				"smoothing": {
					"type": "boolean",
					"title": "Enable Smoothing",
					"description": "Reduces sudden peaks and drops in pressure readings and internal calculations for a more stable trend. (Default: false).",
					"default": false
				}
			}
		},
		"helpSection": {
			"type": "object",
			"title": "Help",
		  	"properties": {
				"prerequisitesSection": {
					"type": "null",
					"title": "Prerequisites",
					"description": "This plugin requires 'environment.outside.pressure' to do any calculations."
				},
				"enhancedForecastsText": {
					"type": "null",
					"title": "Enhanced Forecasts",
					"description": "For more detailed and accurate forecasts, readings for Temperature ('environment.outside.temperature'), Wind Direction ('environment.wind.directionTrue'), and Humidity ('environment.outside.humidity') are recommended. The plugin uses the latest available values from SignalK, and falls back to a mean average if values are missing. It's recommended to use the temperature from a sensor located at the same place as pressure readings."
				},
				"altitudeOffsetText": {
					"type": "null",
					"title": "Sensor Altitude Offset",
					"description": "Sensor Altitude Offset allows you to align your barometer's altitude with the station's GPS altitude. This is particularly useful when the sensor is installed at a different location than the GPS, such as on a mast. Applying the correct offset ensures that pressure readings are accurately adjusted to sea level, improving the overall calculations. Default value (0) represents sea level."
				},
				"diurnalText": {
					"type": "null",
					"title": "Diurnal Correction",
					"description": "Diurnal correction adjusts the pressure trend to account for natural daily variations in atmospheric pressure caused by Earth's atmospheric cycle. It uses an approximate model based on your latitude (requires 'navigation.position'), time of day, and time of year. Note that accuracy may vary by location due to local geography and weather conditions. You can enable or disable this feature at any time to switch between normal and diurnally corrected pressure."
				},
				"smoothingText": {
					"type": "null",
					"title": "Smoothing",
					"description": "Smoothing reduces sudden spikes and drops in the pressure trend, offering a more stable view of atmospheric pressure. It's especially useful in environments with rapid fluctuations—e.g., opening doors or windows, or sensor anomalies. Allow a few readings for smoothing to stabilize. Enabling this will overwrite internal pressure values, affecting calculations like diurnal correction and sea-level adjustment. Toggling may temporarily impact trend and forecast accuracy."
				}
			}
	  	},
		"glossarySection": {
			"type": "object",
			"title": "Glossary",
		  	"properties": {
				"veering": {
					"type": "null",
					"title": "Veering (wind)",
					"description": "The changing of the wind direction clockwise, e.g. SW to W."
				},
				"backing": {
					"type": "null",
					"title": "Backing (wind)",
					"description": "The changing of the wind in the opposite direction to veering (anticlockwise), e.g. SE to NE."
				}
			}
	  	}
	}
}

const uiSchema =  {
    helpSection: {
        'ui:field': 'collapsible',
        'ui:options': { collapsed: true },
        collapse: {
            field: 'ObjectField',
            wrapClassName: 'panel-group'
        }
    },
    glossarySection: {
        'ui:field': 'collapsible',
        'ui:options': { collapsed: true },
        collapse: {
            field: 'ObjectField',
            wrapClassName: 'panel-group'
        }
    }
};

module.exports = {
	schema,
	uiSchema
}