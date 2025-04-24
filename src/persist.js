const fs = require('fs');

class Persist {
    constructor(path) {
        this.path = path;
    }

    write(json) {
        let content = JSON.stringify(json, null, 2);

        fs.writeFile(this.path, content, 'utf8', (err) => {
            if (err) {
                app.debug(err.stack);
                app.error(err);
                this.deleteOfflineFile(); //try delete as it may be corrupted
            } else {
                app.debug(`Wrote plugin data to file: ${this.path()}`);
            }
        });
    }

    read() {
        try {
            const content = fs.readFileSync(this.path, 'utf-8');
            return !content ? null : this.JSONParser(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            } else {
                app.error(`Error reading file: ${error.message}`);
                this.deleteOfflineFile();  //try delete as it may be corrupted

                return [];
            }
        }
    }

    JSONParser(content) {
        if (!content) return null;
        return JSON.parse(content, (key, value) => {
            if (key == "datetime") {
                return new Date(value);
            } else {
                return value;
            }
        })
    };

    deleteOfflineFile() {
        try {
            if(fs.existsSync(this.path)) {
                app.debug(`Deleting file: ${this.path}`);
                fs.unlink(this.path, (error) => {
                    if (error) {
                        app.error(`Error deleting file: ${error.message}`);
                        return;
                    }
                    app.debug('File deleted successfully!');
                });
            }
        }
        catch (error) {
            app.error(`Error deleting file: ${error.message}`);
            return;
        }
    }
}

module.exports = Persist;