const fs = require('fs');

class PersistHandler {
    constructor(app) {
        this.app = app;
        this.path = app.getDataDirPath() + 'offline.json';;
    }

    fileExists() {
        return fs.existsSync(this.path);
    }

    write(json) {
        let content = JSON.stringify(json, null, 2);

        fs.writeFile(this.path, content, 'utf8', (err) => {
            if (err) {
                this.app.debug(err.stack);
                this.app.error(err);
                this.deleteOfflineFile(); //try delete as it may be corrupted
            } else {
                this.app.debug(`Wrote plugin data to file: ${this.path()}`);
            }
        });
    }

    read() {
        try {
            if(this.fileExists()) {
                const content = fs.readFileSync(this.path, 'utf-8');
                return !content ? null : this.JSONParser(content);
            } else {
                return null;
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            } else {
                this.app.error(`Error reading file: ${error.message}`);
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
            if(this.fileExists()) {
                this.app.debug(`Deleting file: ${this.path}`);
                fs.unlink(this.path, (error) => {
                    if (error) {
                        this.app.error(`Error deleting file: ${error.message}`);
                        return;
                    }
                    this.app.debug('File deleted successfully!');
                });
            }
        }
        catch (error) {
            this.app.error(`Error deleting file: ${error.message}`);
            return;
        }
    }
}

module.exports = PersistHandler;