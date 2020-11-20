# signalk-barometer-trend
Calculate the pressure trend of a barometer. Are there foul weather on the way?

## Install & Use
Note: To use this plugin you need a barometer connected to SignalK, i.e. the [bme680](https://www.google.com/search?client=firefox-b-d&q=bme680), outputting the sentence `'environment.outside.pressure'`.

Install the plugin through the SignalK plugin interface.\
After installation you may want to 'Activate' it through the SignalK Plugin Config interface.

The plugin will output two new SignalK values:
```
'environment.outside.pressure.trend'
'environment.outside.pressure.trend.text'
```

From the `environment.outside.pressure.trend` value you could for example setup an alarm (using another plugin) if the trend is changing fast, possibly indicating foul weather.

PS: It might take a couple of minutes before the plugin show any data, as it need to collect pressure readings to calculate a trend. The plugin is setup to read the pressure every 1 minute. Pressure readings older than three hours will be discarded.

## A real world example
This is actual data while developing the plugin. A tropical wave, OT-48, was moving through the Caribbean creating local heavy rainfall and stormy wind in Guadeloupe.

![SigK Pressure Trend](/images/sigk_pressuretrend.jpg)

![Meteo France - Guadeloupe Radar](/images/anim_radar_guad_mf_com.gif)
<img src="/images/noaa_carib_anim.gif" width="600" alt="NOAA Satelitte Photo">

The above GIF-animation is actual radar image from [Meteo France](http://www.meteo.fr/temps/domtom/antilles/pack-public/animation/anim_radar_mart_mf_com.html) at the time.\
The above satelitte photo animation is from [NOAA](https://www.nhc.noaa.gov/satellite.php).

## Possible values are (severity in parentheses)

FALLING: | RISING:
------------ | -------------
FALLING.STEADY (0) | RISING.STEADY (0)
FALLING.SLOW (-1) | RISING.SLOW (1)
FALLING.CHANGING (-2) | RISING.CHANGING (2)
FALLING.QUICKLY (-3) | RISING.QUICKLY (3)
FALLING.RAPIDLY (-4) | RISING.RAPIDLY (4)

Based on the severity you could set an alarm, i.e. with the [Simple Notification](https://github.com/sbender9/signalk-simple-notifications)-plugin.

## Contribute
Please feel free to contribute to this plugin by creating a *Pull Request* including test code.

## Disclaimer
This plugin is based on the GitHub project ['barometer-trend'](https://github.com/oyve/barometer-trend), also by the same author.

### External links
* [GitHub: barometer-trend](https://github.com/oyve/barometer-trend)
* [SignalK](http://signalk.org/)
* Plugin inspired by: [How to use a barometer when sailing](https://www.jollyparrot.co.uk/blog/how-to-use-barometer-when-sailing)
