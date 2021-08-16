const fs = require('fs');

function write(path, barometer) {
    let barometerData = barometer.getAll();

	let barometerDataJSON = JSON.stringify(barometerData);

	fs.writeFile(getFilePath(path), barometerDataJSON, (err) => {
		if (err) {
			throw err;
		}
		console.debug("Barometer data saved.");
	});
}

function getFilePath(path) {
	path = path + "barometer.json";
	console.debug("path: " + path)
	return path;
}

function read(path) {
	return fs.readFile(getFilePath(path), 'utf-8', (err, data) => {
		if (err) {
			throw err;
		}
	
		return JSON.parse(data.toString());
	});
}

module.exports = {
	write,
	read
}