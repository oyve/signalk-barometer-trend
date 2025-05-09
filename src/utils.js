/**
 * 
 * @param {number} seconds - The number of seconds to convert
 * @returns {number} - The equivalent number of milliseconds
 */
function secondsToMilliseconds(seconds) { return seconds * 1000 };
/**
 * 
 * @param {number} minutes - The number of minutes to convert
 * @returns {number} - The equivalent number of milliseconds
 */
function minutesToMilliseconds(minutes) { return minutes * 60 * 1000; };
/**
 * 
 * @param {number} minutes - The number of minutes to convert
 * @returns {number} - The equivalent number of seconds
 */
function minutesToSeconds(minutes) { return minutes * 60; };

module.exports = {
    secondsToMilliseconds,
    minutesToMilliseconds,
    minutesToSeconds
};
