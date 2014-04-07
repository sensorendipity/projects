/**
 * Created by admin on 2/19/14.
 */
var ADDRESS_LABEL = "DEVICE_APP_ADDRESS";
var INIT_DONE =false;

var DATABASE_NAME = "data_record";
var DATABASE_VERSION = 1;
var RECORD_LIST_STORE = "record_list";
var RECORD_DATA_STORE = "record_data";

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

    var self = this;
    var request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onsuccess = function(e) {
        console.log(DATABASE_NAME + " opened successfully");
        self.database = e.target.result;
        self.database.onerror = self.dbErrorHandler;

    };
    request.onupgradeneeded = function(e) {
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

    this.start = function(name, samplingRate, ip) {
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
//            request.onerror = function(e) {
//                console.log(e.target.error.message);
//            }

        }
    };

    this.record = function(ip) {
        if (self.paused) {

        } else {
//            var IP = "http://" + sessionStorage.getItem(ADDRESS_LABEL);
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
                    newObject.label = 0;
                    var transaction = self.database.transaction([RECORD_DATA_STORE], "readwrite");
                    var store = transaction.objectStore(RECORD_DATA_STORE);

                    newObject.recordName = self.currentRecord.name;
                    //dataObject.time = new Date.now();

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

    this.stop = function() {


        var transaction = this.database.transaction(RECORD_LIST_STORE, "readwrite");
        var store = transaction.objectStore(RECORD_LIST_STORE);
        var request = store.get(this.currentRecord.name);
        request.onsuccess = function(e) {
            var result = e.target.result;
            result.endTime = Date.now();
            store.put(result);
        };

        this.currentRecord = null;

        clearInterval(this.intervalHandler);
    };

}
var recorder;

function convertDataObject(dataObject) {
    var sensorData = dataObject.sensors;
    var returnObject = {};
    for (var i=0; i<sensorData.length; i++) {
        returnObject[sensorData[i].type] = sensorData[i].values;
    }
    returnObject.time = dataObject.timestamp.values[1];
    return returnObject;
}