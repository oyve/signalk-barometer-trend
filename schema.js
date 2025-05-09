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
			"required": ["forecastUpdateRate", "altitudeOffset"],
			"properties": {
				"forecastUpdateRate": {
					"type": "integer",
					"title": "Forecast Update Rate (minutes)",
					"description": "Forecast update interval, 1–60 minutes. (Default: 2 min).",
					"default": 2,
					"minimum": 2,
					"maximum": 60,
					"multipleOf": 1
				},
				"altitudeOffset": {
					"type": "integer",
					"title": "Altitude Offset (meters)",
					"description": "Offset relative to GPS altitude, or offset to Sea Level (0) if no GPS altitude. Change will affect all previous readings! (Default: 0 meters).",
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
					"description": "Save internal plugin data to disk to keep state across restarts and downtimes up to 3 hours.",
					"default": true
				},
				"diurnal": {
					"type": "boolean",
					"title": "Enable Diurnal Correction (experimental)",
					"description": "Apply diurnal correction to pressure trend. (Default: false).",
					"default": false
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