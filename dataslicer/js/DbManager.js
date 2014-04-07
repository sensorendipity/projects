/**
 * Created by admin on 2/20/14.
 */
/**
 * Created by admin on 2/19/14.
 */
var DATABASE_NAME = "data_record12";
var DATABASE_VERSION = 1;
var RECORD_LIST_STORE = "record_list";
var RECORD_DATA_STORE = "record_data";

function convertDataObject(dataObject) {
    var sensorData = dataObject.sensors;
    var returnObject = {};
    for (var i=0; i<sensorData.length; i++) {
        returnObject[sensorData[i].type] = sensorData[i].values;
    }
    returnObject.time = dataObject.timestamp.values[1];
    return returnObject;
}

function Record(name, samplingRate) {
    this.name = name;
    this.startTime = Date.now();
    this.endTime = null;
    this.samplingRate = samplingRate;
}

function DbManager() {
    this.dbErrorHandler = function(e) {
        alert("Database Error: " + e.target.error.message);
    };

    this.recordTypes = "all";
    this.setRecordTypes = function(types) {
        this.recordTypes = types;
    };
    var self;

    this.init = function(callback) {
        // init variables
        self = this;
        var request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onsuccess = function(e) {
            console.log(DATABASE_NAME + " opened successfully");
            self.database = e.target.result;
            self.database.onerror = self.dbErrorHandler;
            callback();
        };
        request.onupgradeneeded = function(e) {
            // create new database if not existing
            console.log("Upgrading...");

            var db = e.target.result;
            if (!db.objectStoreNames.contains(RECORD_LIST_STORE)) {
                var record_list = db.createObjectStore(RECORD_LIST_STORE, {
                    keyPath : "name"
                });
            }
            if (!db.objectStoreNames.contains(RECORD_DATA_STORE)) {
                var record_data = db.createObjectStore(RECORD_DATA_STORE,  {
                    keyPath : "id",
                    autoIncrement : true
                });
                record_data.createIndex("recordName", "recordName", {unique: false});
                record_data.createIndex("time", "time", {unique: false});
                record_data.createIndex("label", "label", {unique: false});
            }

            console.log("Upgrade Done");
        };
        request.onerror = function(e) {
            alert(e.target.errorCode);
        };

        this.currentRecord = null;
        this.recordIP = null;
    };



    this.createNewRecord = function(name, samplingRate, ip) {
        if (this.currentRecord) {
            if (this.paused) {
                this.paused = false;
            } else {
                alert("Please stop the current recording first");
            }

        } else {
            this.currentRecord = new Record(name, samplingRate);
            var transaction = this.database.transaction([RECORD_LIST_STORE], "readwrite");
            var store = transaction.objectStore(RECORD_LIST_STORE);
            var request =  store.add(this.currentRecord);
            request.onsuccess = function(e) {
                console.log("New Record " + name + " added successfully");
                self.recordIP = ip;
                // start to set a time interval to retrieve data
                self.intervalHandler = setInterval(self.record, 1000 / samplingRate);
            };
        }
    };

    this.record = function() {
        if (self.paused) {
            // skip recording
        } else {
            var IP = self.recordIP;
            jQuery.get(IP, function(data) {

                if (!self.currentRecord) {
                    alert("No record is running");
                } else {
                    var dataObject = JSON.parse(data);
                    dataObject = convertDataObject(dataObject);
                    var newObject = {};
                    if (self.recordTypes === "all") {
                        newObject = dataObject;
                    } else {
                        for (var i =0; i<self.recordTypes.length; i++) {
                            var type = self.recordTypes[i];
                            newObject[type] = dataObject[type];
                        }
                    }
                    newObject.time = dataObject.time;
                    newObject.label = "default";
                    newObject.recordName = self.currentRecord.name;

                    var transaction = self.database.transaction([RECORD_DATA_STORE], "readwrite");
                    var store = transaction.objectStore(RECORD_DATA_STORE);
                    store.add(newObject).onsuccess = function(e) {
                        console.log("New Data Entry added successfully");
                    }
                }
            });
        }
    };

    this.pauseRecord = function() {
        this.paused = true;
    };

    this.stopRecord = function(callback) {
        var transaction = this.database.transaction(RECORD_LIST_STORE, "readwrite");
        var store = transaction.objectStore(RECORD_LIST_STORE);
        var request = store.get(this.currentRecord.name);
        request.onsuccess = function(e) {
            var result = e.target.result;
            result.endTime = Date.now();
            store.put(result);
            self.currentRecord = null;
            clearInterval(self.intervalHandler);
            if (callback)
                callback();
        };
    };

    this.getRecordList = function(callback) {
        var transaction = this.database.transaction(RECORD_LIST_STORE, "readonly");
        var store = transaction.objectStore(RECORD_LIST_STORE);
        var cursor = store.openCursor();
        var recordList = [];

        cursor.onsuccess = function(e) {
            var res = e.target.result;
            if (res) {
                recordList.push(res.value);
                res.continue();
            } else {
                callback(recordList);
            }
        }
    }

    this.getRecordData = function(name, callback) {
        var transaction = this.database.transaction(RECORD_DATA_STORE, "readonly");
        var store = transaction.objectStore(RECORD_DATA_STORE);
        var index = store.index("recordName");

        var range = IDBKeyRange.bound(name, name);

        var newDataArray = [];

        index.openCursor(range).onsuccess = function(e) {

            var cursor = e.target.result;
            if (cursor) {
                newDataArray.push(cursor.value);
                cursor.continue();
            } else {
                if (callback) {
                    callback(newDataArray);
                }

            }
        };
    }

    this.updateRecordLabel = function(startTime, endTime, label, callback) {

        var transaction = this.database.transaction(RECORD_DATA_STORE, "readwrite");
        var store = transaction.objectStore(RECORD_DATA_STORE);
        var index = store.index("time");
        var range = IDBKeyRange.bound(+startTime, +endTime);

        index.openCursor(range).onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                cursor.value.label = label;

                cursor.update(cursor.value);
                cursor.continue();
            } else {
                if (callback)
                    callback();
            }
        };
    };

    this.removeRecord = function(name, callback) {
        // remove in record list store
        var transaction = this.database.transaction(RECORD_DATA_STORE, "readwrite");
        var range = IDBKeyRange.bound(name, name);
        var store = transaction.objectStore(RECORD_DATA_STORE)
        var cursor = store.index("recordName").openCursor(range);
        cursor.onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var key = cursor.value.id;
                cursor.source.objectStore.delete(key).onsuccess = function() {
                    cursor.continue();
                }
            } else {
                var transaction = self.database.transaction(RECORD_LIST_STORE, "readwrite");
                var store = transaction.objectStore(RECORD_LIST_STORE)
                store.delete(name).onsuccess = function() {
                    console.log("Record Deleted");
                    if (callback)
                        callback();
                    // refresh the table
                }
            }
        };
    }
}

