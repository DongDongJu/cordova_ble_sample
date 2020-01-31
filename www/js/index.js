/// <reference path="../../plugins/cordova-plugin-bluetoothle/www/bluetoothle.js" />
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var foundDevices = [];

document.addEventListener('deviceready', function () {
    if (window.cordova.platformId === "android"){
        new Promise(function (resolve, reject) {

            bluetoothle.initialize(resolve, reject,
                { request: true, statusReceiver: false });
    
        }).then(initializeSuccess, handleError);
    }
});

//========================server==============================
function startAdvertise() {

    log("Starting advertise for samsungwatch...", "status");
    
    foundDevices = [];

    document.getElementById("devices").innerHTML = "";
    document.getElementById("services").innerHTML = "";
    document.getElementById("output").innerHTML = "";

    if (window.cordova.platformId === "windows") {

        bluetoothle.retrieveConnected(retrieveConnectedSuccess, handleError, {});
    }
    else{
        var params = {
            "request": false,
            "restoreKey": "unite"
        };
        log("start to init peripheral");
        bluetoothle.initializePeripheral(initializePeripheralSuccess, handleError, params);
    }
}
function initializePeripheralSuccess(result) {
    // status => enabled = Bluetooth is enabled
    // status => disabled = Bluetooth is disabled
    log(result);
    if (result.status === "enabled") {
        log("Bluetooth is enabled.");
        log(result);
        var params = {
            primary: true,
            service: "00001800-CB42-4CD6-BACC-84AEB898F69B",
            characteristics: [
              {
                uuid: "DF342B03-53F9-43B4-ACB6-62A63CA0615A",
                permissions: {
                  read: true,
                  write: true,
                  //readEncryptionRequired: true,
                  //writeEncryptionRequired: true,
                },
                properties : {
                  read: true,
                  writeWithoutResponse: true,
                  write: true,
                  notify: true,
                  indicate: true,
                  broadcast: true,
                  //authenticatedSignedWrites: true,
                  //notifyEncryptionRequired: true,
                  //indicateEncryptionRequired: true,
                },
                descriptors : {
                  uuid: "0003",
                  permissions: {
                    read: true,
                    write: true,
                  }
                },
            }
            ]
        };
        bluetoothle.addService(addServiceSuccess, handleError, params);
        

    }
    else if(result.status === "connected"){
        log(result);
    }
    else if(result.status === "readRequested"){
        log(result);
    }
    else if(result.status === "writeRequested"){
        log(result);
    }
    else {
        document.getElementById("start-scan").disabled = true;
        log("Bluetooth is not enabled:", "status");
        log(result, "status");
    }
}
function addServiceSuccess(result) {
    if (result.status === "serviceAdded"){
        log(result);
        log("success to added service");   
        var params = {
            services:["00001800-CB42-4CD6-BACC-84AEB898F69B"], //iOS
            service:"00001800-CB42-4CD6-BACC-84AEB898F69B", //Android
            name:"Unite",
            mode: "highLatency",
            timeout: 100000,
            connectable: true,
            powerLevel: "high",
            includeDeviceName: false,
          };
        bluetoothle.startAdvertising(startAdvertiseSuccess, handleError, params);
    }else{
        log("failed to added service");
    }
}

function startAdvertiseSuccess(result){
    if (result.status === "advertisingStarted"){
        log(result);
        log("success to start advertising");
    }else{
        log("failed to start advertising");
    }
}

//============================================================
function initializeSuccess(result) {

    if (result.status === "enabled") {
        log("Bluetooth is enabled.");
        log(result);
    }
    else {
        document.getElementById("start-scan").disabled = true;
        log("Bluetooth is not enabled:", "status");
        log(result, "status");
    }
}

function startScan() {

    log("Starting scan for devices...", "status");
    
    foundDevices = [];

    document.getElementById("devices").innerHTML = "";
    document.getElementById("services").innerHTML = "";
    document.getElementById("output").innerHTML = "";

    if (window.cordova.platformId === "windows") {

        bluetoothle.retrieveConnected(retrieveConnectedSuccess, handleError, {});
    }
    else {
//        bluetoothle.retrieveConnected(retrieveConnectedSuccess, handleError, {});
        bluetoothle.startScan(startScanSuccess, handleError, { services: ["00001800-cb42-4cd6-bacc-84aeb898f69b"],
        "scanMode": bluetoothle.SCAN_MODE_LOW_LATENCY });
    }
}

function retrieveConnectedSuccess(result) {

    log("retrieveConnectedSuccess()");
    log(result);

    result.forEach(function (device) {

        addDevice(device.name, device.address);

    });
}

function startScanSuccess(result) {

//    log("startScanSuccess(" + result.status + ")");

    if (result.status === "scanStarted") {

        log("Scanning for devices (will continue to scan until you select a device)...", "status");
    }
    else if (result.status === "scanResult") {

        if (!foundDevices.some(function (device) {

            return device.address === result.address;

        })) {

            log('FOUND DEVICE:');
            log(result);
            foundDevices.push(result);
            addDevice(result.name, result.address);
        }
    }
}

function addDevice(name, address) {

    var button = document.createElement("button");
    button.style.width = "100%";
    button.style.padding = "10px";
    button.style.fontSize = "16px";
    button.textContent = name + ": " + address;

    button.addEventListener("click", function () {

        document.getElementById("services").innerHTML = "";
        connect(address);
    });

    document.getElementById("devices").appendChild(button);
}
function addReadSender(name, address, charuuid) {

    var button = document.createElement("button");
    button.style.width = "100%";
    button.style.padding = "10px";
    button.style.fontSize = "16px";
    button.textContent = name;

    button.addEventListener("click", function () {
        document.getElementById("sender").innerHTML = "";
        log(address);
        log(name);
        log(charuuid);
        return new Promise(function (resolve, reject) {
            bluetoothle.read(resolve, reject,
                { address: address, service: name, characteristic: charuuid });
        }).then(readSuccess_value, handleError);
    });

    document.getElementById("devices").appendChild(button);
}

function connect(address) {

    log('Connecting to device: ' + address + "...", "status");

    if (cordova.platformId === "windows") {

        getDeviceServices(address);

    }
    else {
        
        stopScan();

        new Promise(function (resolve, reject) {

            bluetoothle.connect(resolve, reject, { address: address });

        }).then(connectSuccess, handleError);

    }
}

function connectSuccess(result) {

    log("- " + result.status);

    if (result.status === "connected") {

        getDeviceServices(result.address);
    }
    else if (result.status === "disconnected") {

        log("Disconnected from device: " + result.address, "status");
    }
}

function getDeviceServices(address) {

    log("Getting device services...", "status");

    var platform = window.cordova.platformId;

    if (platform === "android") {

        new Promise(function (resolve, reject) {

            bluetoothle.discover(resolve, reject,
                { address: address });

        }).then(discoverSuccess, handleError);

    }
    else if (platform === "windows") {

        new Promise(function (resolve, reject) {

            bluetoothle.services(resolve, reject,
                { address: address });

        }).then(servicesSuccess, handleError);

    }
    else {
        new Promise(function (resolve, reject) {

            bluetoothle.discover(resolve, reject,
                { address: address });

        }).then(discoverSuccess, handleError);
    }
}

function servicesSuccess(result) {

    log("servicesSuccess()");
    log(result);

    if (result.status === "services") {

        var readSequence = result.services.reduce(function (sequence, service) {

            return sequence.then(function () {

                console.log('Executing promise for service: ' + service);

                new Promise(function (resolve, reject) {

                    bluetoothle.characteristics(resolve, reject,
                        { address: result.address, service: service });

                }).then(characteristicsSuccess, handleError);

            }, handleError);

        }, Promise.resolve());

        // Once we're done reading all the values, disconnect
        readSequence.then(function () {

            new Promise(function (resolve, reject) {

                bluetoothle.disconnect(resolve, reject,
                    { address: result.address });

            }).then(connectSuccess, handleError);

        });
    }


    if (result.status === "services") {

        result.services.forEach(function (service) {

            new Promise(function (resolve, reject) {

                bluetoothle.characteristics(resolve, reject,
                    { address: result.address, service: service });

            }).then(characteristicsSuccess, handleError);

        });

    }
}

function characteristicsSuccess(result) {

    log("characteristicsSuccess()");
    log(result);

    
    if (result.status === "characteristics") {

        return addService(result.address, result.service, result.characteristics);
    }
}

function addService(address, serviceUuid, characteristics) {

    log('Adding service ' + serviceUuid + '; characteristics:');
    log(characteristics);
    if( serviceUuid === "1800")
        return;
    if( serviceUuid === "1801")
        return;
    var readSequence = Promise.resolve();

    var wrapperDiv = document.createElement("div");
    wrapperDiv.className = "service-wrapper";

    var serviceDiv = document.createElement("div");
    serviceDiv.className = "service";
    serviceDiv.textContent = uuids[serviceUuid] || serviceUuid;
    wrapperDiv.appendChild(serviceDiv);

    characteristics.forEach(function (characteristic) {

        var characteristicDiv = document.createElement("div");
        characteristicDiv.className = "characteristic";

        var characteristicNameSpan = document.createElement("span");
        characteristicNameSpan.textContent = (uuids[characteristic.uuid] || characteristic.uuid) + ":";
        characteristicDiv.appendChild(characteristicNameSpan);

        characteristicDiv.appendChild(document.createElement("br"));

        var characteristicValueSpan = document.createElement("span");
        characteristicValueSpan.id = serviceUuid + "." + characteristic.uuid;
        characteristicValueSpan.style.color = "blue";
        characteristicDiv.appendChild(characteristicValueSpan);

        wrapperDiv.appendChild(characteristicDiv);

        // readSequence = readSequence.then(function () { 
        //     return new Promise(function (resolve, reject) {
        //         bluetoothle.read(resolve, reject,
        //             { address: address, service: serviceUuid, characteristic: characteristic.uuid });

        //     }).then(readSuccess, handleError);

        // });
        readSequence = readSequence.then(function () {
            if(serviceUuid == "180A")
                new Promise(function (resolve, reject) {
                    bluetoothle.subscribe(resolve, reject,
                        { address: address, service: serviceUuid, characteristic: characteristic.uuid });
                }).then(subSuccess, subFail);
                return new Promise(function (resolve, reject) {
                    bluetoothle.read(resolve, reject,
                        { address: address, service: serviceUuid, characteristic: characteristic.uuid });
                }).then(readSuccess, handleError);
            return;
        });

    });

    document.getElementById("services").appendChild(wrapperDiv);

    return readSequence;
}
function subFail(e){
}

function subSuccess(data){
	alert("subscribe success");	
	if (data.status == "subscribed"){
        connected = true;
	}else if(data.status == "subscribedResult"){
		var returnedBytes = bluetoothle.encodedStringToBytes(data.value);
		alert("received: "+JSON.stringify(returnedBytes));
	}
}
function discoverSuccess(result) {

    log("Discover returned with status: " + result.status);

    if (result.status === "discovered") {

    var readSequence = result.services.reduce(function (sequence, service) {

        return sequence.then(function () {

            return addService(result.address, service.uuid, service.characteristics);
        });

    }, Promise.resolve());
    // readSequence.then(function () {

    //     new Promise(function (resolve, reject) {

    //         bluetoothle.disconnect(resolve, reject,
    //             { address: result.address });

    //     }).then(connectSuccess, handleError);

    // });

    }
}

function writeSuccess(result) {

    log("writeSuccess():");
    log(result);

    reportValue(result.service, result.characteristic, window.atob(result.value));
}

function readSuccess(result) {

    log("readSuccess():");
    log(result);

    if (result.status === "read") {
        reportValue(result.service, result.characteristic, window.atob(result.value));
    }
    addReadSender(result.service,result.address,result.characteristic);
}
function readSuccess_value(result) {

    log("readSuccess_value():");
    log(result);

    if (result.status === "read") {
        reportValue(result.service, result.characteristic, window.atob(result.value));
    }
}


function reportValue(serviceUuid, characteristicUuid, value) {

    document.getElementById(serviceUuid + "." + characteristicUuid).textContent = value;
}

// Stop scanning for bluetoothle devices.
function stopScan() {

    new Promise(function (resolve, reject) {

        bluetoothle.stopScan(resolve, reject,
            { address: result.address });

    }).then(stopScanSuccess, handleError);
}

function stopScanSuccess() {

    if (!foundDevices.length) {

        log("NO DEVICES FOUND");
    }
    else {

        log("Found " + foundDevices.length + " devices.", "status");
    }
}

function log(msg, level) {

    level = level || "log";

    if (typeof msg === "object") {

        msg = JSON.stringify(msg, null, "  ");
    }

    console.log(msg);

    if (level === "status" || level === "error") {

        var msgDiv = document.createElement("div");
        msgDiv.textContent = msg;

        if (level === "error") {

            msgDiv.style.color = "red";
        }

        msgDiv.style.padding = "5px 0";
        msgDiv.style.borderBottom = "rgb(192,192,192) solid 1px";
        document.getElementById("output").appendChild(msgDiv);
    }
}
// click event handler for start scan
document.getElementById("start-scan").addEventListener("click", function () {

//    for client
//    startScan();


//    for server
      startAdvertise();
});
function success(result) {
    self.log('BLE SUCCESS');
    var a;

    successCb(result);

    for (a=0; a<self.pendingConnectSuccessCbs.length; ++a) {
        self.pendingConnectSuccessCbs[a](result);
    }

    self.pendingConnectSuccessCbs = [];
    self.pendingConnectErrorCbs = [];
}

function fail(err, stage) {
    self.log('Error in ' + stage + ': ' + JSON.stringify(err));
    var a;

    errCb(err, stage);

    for (a=0; a<self.pendingConnectErrorCbs.length; ++a) {
        self.pendingConnectErrorCbs[a](err, stage);
    }

    self.pendingConnectSuccessCbs = [];
    self.pendingConnectErrorCbs = [];
}

function subscribeDevice(address, successCb, errCb) {
    self.log('SUBSCRIBING: ' + address);
    bluetoothle.subscribe(function(result) {
        if (result.status === 'subscribed') {
            self.log('Successfully subscribed');
            self.log(result);
            
            self.emit('connect');
            bluetoothle.stopScan();
            self.connectedAddress = result.address;
            self.initializing = false;
            if (successCb) {
                successCb(result);
            }
        } else if (result.status === 'subscribedResult') {
            var v = bluetoothle.bytesToString(bluetoothle.encodedStringToBytes(result.value));
            self.log('Received: ' + v);
            switch (v[0]) {
                case self.DataFlagChunkStart:
                    self.pendingSubscribeData = v.slice(1);
                    break;
                case self.DataFlagChunkMiddle:
                    self.pendingSubscribeData += v.slice(1);
                    break;
                case self.DataFlagChunkEnd:
                    self.pendingSubscribeData += v.slice(1);
                    self.receivedEventData(self.pendingSubscribeData);
                    self.pendingSubscribeData = '';
                    break;
                case self.DataFlagChunkFull:
                    self.pendingSubscribeData = v.slice(1);
                    self.receivedEventData(self.pendingSubscribeData);
                    self.pendingSubscribeData = '';
                    break;
            }
        }
    }, function(err) {
        self.initializing = false;
        if (errCb) {
            errCb(err, 'subscribe');
        }
    }, {
        address: address,
        serviceUuid: self.serviceUUID,
        characteristicUuid: self.NascentDataSyncCommandCharacteristicUUID,
        isNotification: true
    });
}

function handleError(error) {

    var msg;

    if (error.error && error.message) {

        var errorItems = [];

        if (error.service) {

            errorItems.push("service: " + (uuids[error.service] || error.service));
        }

        if (error.characteristic) {

            errorItems.push("characteristic: " + (uuids[error.characteristic] || error.characteristic));
        }

        msg = "Error on " + error.error + ": " + error.message + (errorItems.length && (" (" + errorItems.join(", ") + ")"));
    }

    else {

        msg = error;
    }

    log(msg, "error");

    if (error.error === "read" && error.service && error.characteristic) {

        reportValue(error.service, error.characteristic, "Error: " + error.message);
    }
}
