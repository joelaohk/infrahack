'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const https = require('https');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    
    let startStationCode = event.start;
    let endStationCode = event.end;
    
    //console.log(endStationCode);
    
    queryStation(startStationCode).then(function (data) {
        let start = data.Items[0];
        queryStation(endStationCode).then(function (data) {
            let end = data.Items[0];
            
            // make a journey planner
            planJourney(start.ics, end.ics).then(function(data) {
                //console.log(data);
                let journeys = data.journeys;
                //console.log(journeys)
                for (var i = 0; i < journeys.length; i++) {
                    let stopPoints = getStopPoints(journeys[i]);
                    //console.log(stopPoints);
                    // for each stop point, consider the lift stiuation
                    let faultyLiftStations = getFaultyLiftStations(stopPoints);
                    //console.log(faultyLiftStations);
                    if (faultyLiftStations.length > 0) {
                        journeys[i].result = "bad";
                        journeys[i].faultyLiftStations = faultyLiftStations;
                    } else {
                        journeys[i].faultyLiftStations = [];
                        journeys[i].result = "fine";
                    }
                }
                
                const response = {
                    "statusCode": 200,
                    "headers": {},
                    "isBase64Encoded": false,
                    "body": JSON.stringify(journeys),
                };
                console.log(response);
                callback(null, response);
            }).catch(()=>{});
        
            
        });
    });
    
    
    
};


function planJourney(startId, endId) {
    let key = getTflApiKeys();
    let journeyApi = `https://api.tfl.gov.uk/Journey/JourneyResults/${startId}/to/${endId}?app_key=${key.app_key}&app_id=${key.app_id}&accessibilityPreference=StepFreeToPlatform,StepFreeToVehicle`;
    
    //console.log(journeyApi);
    
    return new Promise(function(resolve, reject) {
        let data = ""
        https.get(journeyApi, function(result) {
            
            result.on('end', () => {
                resolve(JSON.parse(data));
            });
            
            result.on('data', (d) => {
                data += d;
            });
            
            result.on('error', (err) => {
                console.log(err.message);
            });
            
        });
    });
}

function getTflApiKeys() {
    let rawdata = fs.readFileSync('tfl-api-key.json');  
    let key = JSON.parse(rawdata);
    return key;
}

function getStopPoints(journey) {
    let result = [];

    for (var i = 0; i < journey.legs.length; i++) {
        if (i == 0) {
            result.push(journey.legs[i].departurePoint.icsCode);
        }
        result.push(journey.legs[i].arrivalPoint.icsCode);
    }

    return result;
}

function getFaultyLiftStations(stations) {

    getLiftsInfo().then((data) => {
        let liftInfo = data.data;
        //console.log(liftInfo);
        let result = [];
        for (var i = 0; i < stations.length; i++) {
            if (!liftsWorkAt(liftInfo, stations[i])) {
                result.push(stations[i]);
            }
        }
        //console.log(result);
        return result;
    });
    
}

function getLiftsInfo() {
    let endpoint = "https://europe-west1-infrahack.cloudfunctions.net/lifts-tfl?timestamp=auto&time_speedup=0&events_lookback_period_sec=3600";
    let data = "";
    return new Promise(function(resolve, reject) {
        https.get(endpoint, function(result) {
            result.on('data', (d) => {
                data += d;
            });
            
            result.on('end', () => {
                resolve(JSON.parse(data));
            });
            
            result.on('error', (err) => {
                console.log(err.message);
            });
            
        });
    });
}

function liftsWorkAt(liftInfo, station) {
    getStationCodeFromIcs(station).then(function (data) {
        console.log(data);
        const stationCode = data.Items[0].code;
        //console.log(stationCode);
        for (var i = 0; i < liftInfo.length; i++) {
            if (liftInfo[i].lift_id.includes(stationCode)) {
                if (liftInfo[i].signals.length > 0) {
                    return false;
                } else {
                    return true;
                }
            }
        }
        return false;
    }).catch(()=>{});
    
}

function queryStation(stationCode) {
    //console.log(stationCode);
    var params = {
        TableName : "stations",
        KeyConditionExpression: "code = :stationCode",
        ExpressionAttributeValues: {
            ":stationCode": stationCode
        }
    };
    return ddb.query(params).promise();
}

function getStationCodeFromIcs(stationIcs) {
    //console.log(stationIcs);
    var params = {
        TableName : "stations",
        KeyConditionExpression: "ics = :ics",
        ExpressionAttributeValues: {
            ":ics": stationIcs
        }
    };
    return ddb.query(params).promise();
    
}

