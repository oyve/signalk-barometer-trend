const fs = require('fs');

function write(dir, barometer) {
    let barometerData = barometer.getAll();

	let barometerDataJSON = JSON.stringify(barometerData);

	fs.writeFile(getFilePath(dir), barometerDataJSON, 'utf-8', (err) => {
		if (err) {
			console.debug("An error occured while trying to write barometer data to file");
			throw err;
		}
		console.debug("Barometer data saved.");
	});
}

function getFilePath(dir) {
	let path = dir + "/offline.json";
	console.debug("file path: " + path)
	return path;
}

function read(dir) {
	return fs.readFile(getFilePath(dir), 'utf-8', (err, data) => {
		if (err) {
			console.debug("An error occured while trying to read  barometer data from file");
			throw err;
		}
	
		return JSON.parse(data.toString());
	});
}

module.exports = {
	write,
	read
}