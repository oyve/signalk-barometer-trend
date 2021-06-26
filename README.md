![Node.js Package](https://github.com/oyve/signalk-barometer-trend/workflows/Node.js%20Package/badge.svg)

# signalk-barometer-trend
Calculate pressure trend and get weather predictions from a barometer over time. Are there foul weather on the way?

## Prerequisites
- A barometer connected to SignalK, i.e. the [bme680](https://www.google.com/search?client=firefox-b-d&q=bme680), outputting the SignalK-sentence `'environment.outside.pressure'` to SignalK
- SignalK GPS-coordinates to determinate northern|southern hemisphere
- Temperature sensor and GPS-altitude for increased precision (optional)

## Install
Install the plugin through the SignalK plugin interface. 'Enable' it through the Plugin Config interface.

## Use
It might take a couple of minutes before the plugin show any data, as it need to collect pressure readings to calculate a trend. The plugin will not change the pressure readings you observe in SignalK - only internally for calculations.

The plugin outputs several new SignalK-values, such as:

```
'environment.outside.pressure.trend.tendency'
'environment.outside.pressure.trend.severity'
'environment.outside.pressure.prediction.pressureOnly'
...
```

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

![SignalK Data Browser](/images/signalk_barometer_trend.png)

## Contribute
Please feel free to contribute to this plugin by creating a *Pull Request* including test code.

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