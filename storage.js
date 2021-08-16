const fs = require('fs');

function write(path, barometer) {
    let barometerData = barometer.getAll();

	let barometerDataJSON = JSON.stringify(barometerData);

	fs.writeFile(getFilePath(), barometerDataJSON, (err) => {
		if (err) {
			throw err;
		}
		console.debug("Barometer data saved.");
	});
}

function getFilePath(path) {
	return path + 'barometer.json';
}

function read(path, barometer) {
	return fs.readFile(getFilePath, 'utf-8', (err, data) => {
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