![Node.js Package](https://github.com/oyve/signalk-barometer-trend/workflows/Node.js%20Package/badge.svg)

# signalk-barometer-trend
Calculate pressure trend and get weather predictions from a barometer over time. Are there foul weather on the way?

## Prerequisites
- A barometer, i.e. the [bme280](https://www.google.com/search?client=firefox-b-d&q=bme280), outputting `'environment.outside.pressure'` to SignalK
- Optional: GPS-coordinates to determinate if located in northern | southern hemisphere (default: northern)
- Optional: Temperature sensor and GPS-altitude for increased precision

## Install & setup
Install the plugin through the SignalK plugin interface. 'Enable' it through the Plugin Config interface.

![SignalK Plugin Config](/images/pluginConfig.png)

- Sample Rate: More | fewer readings. This may result in a more | less "jumpy" barometer-trend. (Default = 60).
- Altitude Offset: Ajust for any differences between your sensor altitude to GPS-altitude. (Default = 0).

## Use
It might take a couple of minutes before the plugin show any data, as it need to collect pressure readings to calculate a trend. The plugin will not change the pressure readings you observe in SignalK - only internally for calculations.

The plugin outputs several new SignalK-values, such as:

```
'environment.outside.pressure.trend.tendency'
'environment.outside.pressure.trend.severity'
'environment.outside.pressure.prediction.pressureOnly'
...
```

The plugin saves all barometer readings every 3 minutes and when the plugin is disabled. Within a timeframe of 3 hours it should be able to read meaningful data when the plugin is started again.

![SignalK Data Browser](/images/signalk_barometer_trend.png)

## Alarms
Based on the severity value it's possible to set an alarm, using the [Simple Notification](https://github.com/sbender9/signalk-simple-notifications)-plugin (see severity table below).

`'environment.outside.pressure.trend.severity'`

FALLING: | RISING:
------------ | -------------
(0) FALLING.STEADY | (0) RISING.STEADY
(-1) FALLING.SLOW | (1) RISING.SLOW
(-2) FALLING.CHANGING | (2) RISING.CHANGING
(-3) FALLING.QUICKLY | (3) RISING.QUICKLY
(-4) FALLING.RAPIDLY | (4) RISING.RAPIDLY

## Contribute
Please feel free to contribute to this plugin by creating an issue and/or a *Pull Request* including test code.

## Disclaimer
- See all disclaimers by reading the README at the GitHub project ['barometer-trend'](https://github.com/oyve/barometer-trend), also by the same author, to understand the limitations of this plugin.

### External links
* [GitHub: barometer-trend](https://github.com/oyve/barometer-trend)
* [SignalK](http://signalk.org/)

## Real world example
This is actual data while developing the plugin. A tropical wave, OT-48, was moving through the Caribbean creating local heavy rainfall and stormy winds in Guadeloupe.

![SigK Pressure Trend](/images/sigk_pressuretrend.jpg)

![Meteo France - Guadeloupe Radar](/images/anim_radar_guad_mf_com.gif)
<img src="/images/noaa_carib_anim.gif" width="600" alt="NOAA Satelitte Photo">

The above GIF-animation is actual radar image from [Meteo France](http://www.meteo.fr/temps/domtom/antilles/pack-public/animation/anim_radar_mart_mf_com.html) at the time.\
The above satelitte photo animation is from [NOAA](https://www.nhc.noaa.gov/satellite.php).