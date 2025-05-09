const fs = require('fs');

class PersistHandler {
    constructor(app) {
        this.app = app;
        this.path = null;
    }

    fileExists() {
        return fs.existsSync(this.getPath());
    }

    getPath() {
        return this.path = this.path ?? (this.app.getDataDirPath() + '/offline.json');
    }

    write(json) {
        try {
            let content = JSON.stringify(json, null, 2);

            fs.writeFile(this.getPath(), content, 'utf8', (error) => {
                if (error) {
                    this.app.debug(error.stack);
                    this.app.error(error);
                    this.deleteOfflineFile(); //try delete as it may be corrupted
                } else {
                    //this.app.debug(`Wrote plugin data to file: ${this.getPath()}`);
                }
            });
        } catch(error) {
            console.log("Failed to write json" + error);
        }
    }

    read() {
        try {
            if(this.fileExists()) {
                const content = fs.readFileSync(this.getPath(), 'utf-8');
                return !content ? null : this.JSONParser(content);
            } else {
                return null;
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            } else {
                this.app.error(`Error reading file: ${error}`);
                this.deleteOfflineFile();  //try delete as it may be corrupted

                return [];
            }
        }
    }

    JSONParser(content) {
        try {
            if (!content) return null;
            return JSON.parse(content, (key, value) => {
                if (key == "datetime") {
                    return new Date(value);
                } else {
                    return value;
                }
            })
        } catch(error) {
            console.log("Failed to parse JSON" + error);
        }
    };

    deleteOfflineFile() {
        try {
            if(this.fileExists()) {
                this.app.debug(`Deleting file: ${this.getPath()}`);
                fs.unlink(this.getPath(), (error) => {
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