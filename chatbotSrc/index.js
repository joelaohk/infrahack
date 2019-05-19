'use strict'

const Slimbot = require('slimbot');
const slimbot = new Slimbot('626227083:AAGIC2lVQRnFkKN7RoD0JySSI7q_5fkbce4');


const https = require('https');
const awsdydb = require('aws-sdk');
const fs = require('fs');

const threeCode = [
    {
      "code": "ABR",
      "noCode": 1003006,
      "name": "Abbey Road"
    },
    {
      "code": "ALS",
      "noCode": 1002003,
      "name": "All Saints"
    },
    {
      "code": "BAN",
      "noCode": 1000013,
      "name": "Bank"
    },
    {
      "code": "BEC",
      "noCode": 1002011,
      "name": "Beckton"
    },
    {
      "code": "BEP",
      "noCode": 1002012,
      "name": "Beckton Park"
    },
    {
      "code": "BLA",
      "noCode": 1002018,
      "name": "Blackwall"
    },
    {
      "code": "BOC",
      "noCode": 1002019,
      "name": "Bow Church"
    },
    {
      "code": "CAT",
      "noCode": 1000039,
      "name": "Canning Town"
    },
    {
      "code": "CAW",
      "noCode": 1003008,
      "name": "Canary Wharf"
    },
    {
      "code": "CRO",
      "noCode": 1002025,
      "name": "Crossharbour"
    },
    {
      "code": "CUH",
      "noCode": 1001079,
      "name": "Custom House"
    },
    {
      "code": "CUS",
      "noCode": 1002027,
      "name": "Cutty Sark"
    },
    {
      "code": "CYP",
      "noCode": 1002028,
      "name": "Cyprus"
    },
    {
      "code": "DEB",
      "noCode": 1002029,
      "name": "Deptford Bridge"
    },
    {
      "code": "DER",
      "noCode": 1002030,
      "name": "Devons Road"
    },
    {
      "code": "EAI",
      "noCode": 1002033,
      "name": "East India"
    },
    {
      "code": "ELR",
      "noCode": 1002035,
      "name": "Elverson Road"
    },
    {
      "code": "GAR",
      "noCode": 1002039,
      "name": "Gallions Reach"
    },
    {
      "code": "GRE",
      "noCode": 1001123,
      "name": "Greenwich"
    },
    {
      "code": "HEQ",
      "noCode": 1002046,
      "name": "Heron Quays"
    },
    {
      "code": "ISG",
      "noCode": 1002048,
      "name": "Island Gardens"
    },
    {
      "code": "KGV",
      "noCode": 1002009,
      "name": "King George V"
    },
    {
      "code": "LAP",
      "noCode": 1002034,
      "name": "Langdon Park"
    },
    {
      "code": "LCA",
      "noCode": 1002000,
      "name": "London City Airport"
    },
    {
      "code": "LEW",
      "noCode": 1001177,
      "name": "Lewisham"
    },
    {
      "code": "LIM",
      "noCode": 1001180,
      "name": "Limehouse"
    },
    {
      "code": "MUD",
      "noCode": 1002061,
      "name": "Mudchute"
    },
    {
      "code": "PDK",
      "noCode": 1002099,
      "name": "Pontoon Dock"
    },
    {
      "code": "PML",
      "noCode": 1002066,
      "name": "Pudding Mill Lane"
    },
    {
      "code": "POP",
      "noCode": 1002064,
      "name": "Poplar"
    },
    {
      "code": "PRR",
      "noCode": 1002065,
      "name": "Prince Regent"
    },
    {
      "code": "ROA",
      "noCode": 1002070,
      "name": "Royal Albert"
    },
    {
      "code": "ROV",
      "noCode": 1002071,
      "name": "Royal Victoria"
    },
    {
      "code": "SHA",
      "noCode": 1000202,
      "name": "Shadwell"
    },
    {
      "code": "SHS",
      "noCode": 1003007,
      "name": "Stratford High Street"
    },
    {
      "code": "SOQ",
      "noCode": 1002074,
      "name": "South Quay"
    },
    {
      "code": "STI",
      "noCode": 1003009,
      "name": "Stratford International"
    },
    {
      "code": "STL",
      "noCode": 1003005,
      "name": "Star Lane"
    },
    {
      "code": "STR",
      "noCode": 1000226,
      "name": "Stratford Regional"
    },
    {
      "code": "TOG",
      "noCode": 1002076,
      "name": "Tower Gateway"
    },
    {
      "code": "WEH",
      "noCode": 1000262,
      "name": "West Ham"
    },
    {
      "code": "WES",
      "noCode": 1002083,
      "name": "Westferry"
    },
    {
      "code": "WIQ",
      "noCode": 1002084,
      "name": "West India Quay"
    },
    {
      "code": "WOA",
      "noCode": 1003000,
      "name": "Woolwich Arsenal"
    },
    {
      "code": "WST",
      "noCode": 1002098,
      "name": "West Silvertown"
    }
  ];
/*
awsdydb.config.update({
    region: "eu-west-2",
    endpoint: "stations",
    accessKeyId: 'AKIAJVP7Q374TCMYPJKA',
    // secretAccessKey: 'xxxx'
  });
*/

let originalDestCode = "ABC"; // cuddy sark from stratford international
let currentDest = originalDestCode;
let normalRecurrence = 1; // -1 no checking at all 0 check as abnormal 1 check as normal
let assetToFollowUp = null;
let currJourney = 0;
let zeit = 1555661922; // for demo

function routeSearcher(source, dest, preference, mode)
{
    return new Promise(function(res, rej)
    {
        const baseURL = "https://api.tfl.gov.uk/journey/journeyresults";
        const currTime = new Date();
        
        const month = (1+currTime.getMonth()).toString().length < 2 ? '0' + (1+currTime.getMonth()).toString() : (1+currTime.getMonth()).toString();
        const day = currTime.getDate().toString().length < 2 ? '0' + currTime.getDate().toString() : currTime.getDate().toString();
        const hours = currTime.getHours().toString().length < 2 ? '0' + currTime.getHours().toString() : currTime.getHours().toString();
        const minutes = currTime.getMinutes().toString().length < 2 ? '0' + currTime.getMinutes().toString() : currTime.getMinutes().toString();
        
        const dateTimeOpt = '?date=' + currTime.getFullYear() + month + day + '&time=' + hours + minutes;
        const preferenceOpt = !!preference ? '&journeyPreference=' + preference : '';
        const modeOpt = !!mode ? '&mode=' + mode : '';
        
        let data = '';
        // console.log(dateTimeOpt);;
        https.get(baseURL + '/' + source + '/to/' + dest + dateTimeOpt + preferenceOpt + modeOpt, (result) => 
        {
            result.on('data', (d) => {
                data += d;
            });

            result.on('end', () => {
                // console.log(JSON.parse(data));
                res(JSON.parse(data));
            });

        });

    });
}

function suggestShower(result)
{
    const journey = result.journeys[0];
    // console.log(journey);
    let stepsArray = [];
    let response;
    
    setInterval(()=>{}, 2000);
    let messageToSend = "Rerouting information is here ;) No worries ;)";
    setInterval(()=>{}, 2000);
    for (var i = 0; i < journey.legs.length; i++)
    {
        if (i == 0 && journey.legs.length > 1)
            messageToSend += '\n' + 'Firstly take ' + journey.legs[i].instruction.summary;
        else if (i == 0)
            messageToSend += '\n' + 'Take ' + journey.legs[i].instruction.summary;
        else if (i % 2 == 1)
            messageToSend += '\n' + 'Then take ' + journey.legs[i].instruction.summary;
        else
            messageToSend += '\n' + 'After that take ' + journey.legs[i].instruction.summary;
        messageToSend += '\n' + ' from ' + journey.legs[i].departurePoint.commonName;
    }
    slimbot.sendMessage('820663765', messageToSend);
    normalRecurrence = 1;
    const filtered = threeCode.filter(a => a['noCode'] == journey.legs[0].departurePoint);
    currentDest = filtered;
    /*
    for (var i = 0; i < journey.legs.length; i++)
    {
        response = {instruction: journey.legs[i].instruction, 
            departurePoint: journey.legs[i].departurePoint, 
            arrivalPoint: journey.legs[i].arrivalPoint
        }
        stepsArray.push(response);
    }
    */
    // normalRecurrence = 1;
    // currentDest =
}

function routeSearcherCallBack(legNo, stopNo, result, lastLegRoute)
{
    if (result.$type == "Tfl.Api.Presentation.Entities.JourneyPlanner.ItineraryResult, Tfl.Api.Presentation.Entities")
    {
        // console.log(result.$type);
        suggestShower(result);
    }
    else if (result.$type == "Tfl.Api.Presentation.Entities.JourneyPlanner.DisambiguationResult, Tfl.Api.Presentation.Entities")
    {
        // console.log(result.$type);
        let origin = lastLegRoute.path.stopPoints[stopNo].name;
        if (result.toLocationDisambiguation.matchStatus == "list")
            origin = result.toLocationDisambiguation.disambiguationOptions[0].icsCode;
        routeSearcher(origin, lastLegRoute.arrivalPoint.icsCode, null, 'bus').then(function (result) {
            if (result.$type == "Tfl.Api.Presentation.Entities.JourneyPlanner.ItineraryResult, Tfl.Api.Presentation.Entities")
            { // break all loops
                suggestShower(result);
            }
        })}
    else
    {
        console.log("ERR");
        stopNo--;
        suggestLoader(legNo, stopNo);
    }
}

function suggestLoader(legNo, stopNo)
{
    let isRerouting = true;
    const lastLegRoute = currJourney.legs[legNo];
   
    if (stopNo < 0)
        legNo--;
    if (legNo < 0)
        return;
    
    routeSearcher(lastLegRoute.path.stopPoints[stopNo].name, lastLegRoute.arrivalPoint.icsCode, null, 'bus').then(function(result) {routeSearcherCallBack(legNo, stopNo, result, lastLegRoute)});

}

function getThreeDigitCode(icsCode)
{
    const filtered = threeCode.filter(a => a['noCode'] == icsCode);
    originalDestCode = filtered[0]['code'];
    currentDest = originalDestCode
    console.log(originalDestCode);
}

function dummyRouteGetter() //  to be replaced by actual request listening
{
    const baseURL = "https://api.tfl.gov.uk/journey/journeyresults";
    const currTime = new Date();
    let data = '';
    // console.log(currTime.getTime());
    https.get(baseURL + "/1003009/to/1002000?date=20190518&time=0900&journeyPreference=LeastWalking", (res) => 
    {
        res.on('data', (d) => {
            data += d;
        });

        res.on('end', () => {
            currJourney = JSON.parse(data).journeys[0];
            getThreeDigitCode(currJourney.legs[currJourney.legs.length-1].arrivalPoint.icsCode)
        });

        res.on('error', (err) => 
        {
            if (retryCount < 5)
            {
                checkStatusConnection(++retryCount);
            }
            else
            {
                console.log("No connection");
            }
            
        });

    });
}

function checkIfACKLogged(listStatus)
{
    // console.log("ACK inspection!");
    const matched = listStatus.data.filter(r => r.lift_id.split(' ')[0] == currentDest);
    // console.log(matched);
    let defectiveLift = [];
    for (var i = 0; i < assetToFollowUp.length; i++)
    {
        // console.log(assetToFollowUp[i]);
        const indivLift = matched.filter(r => r.lift_id == assetToFollowUp[i])[0];
        // console.log(indivLift);
        // console.log(indivLift.signals[0]);
        // console.log(indivLift.signals[1]);
        if (indivLift.latest_non_operational_signal != null && indivLift.latest_non_operational_signal.cause == "Alarm_Acknowledged")
        {
            if (indivLift.currently_operational)
                assetToFollowUp.splice(i, 1);
            else
                defectiveLift.push(indivLift);
        }
    }

    if (defectiveLift.length > 0)
    {
        // suggestReroute(defectiveLift);
        const lastLegRoute = currJourney.legs[currJourney.legs.length-1];
        let stopNo = lastLegRoute.path.stopPoints.length - 1;
        
        slimbot.sendMessage('820663765', "Seems that the lift at " + lastLegRoute.path.stopPoints[stopNo].name + " has failed :(");
        suggestLoader(currJourney.legs.length-1, stopNo);
        normalRecurrence = -1;
    }

}

function checkIfLiftIsOperational(listStatus)
{
    assetToFollowUp = [];
    const matched = listStatus.data.filter(r => r.lift_id.split(' ')[0] == currentDest);
    // console.log(matched);
    for (var i = 0; i < matched.length; i++)
        if (!matched[i].currently_operational)
        {
            assetToFollowUp.push(matched[i].lift_id);
            normalRecurrence = 0;
        }
    // console.log("Matched lift " + matched.length);
    // console.log("Potentially defective lift " + assetToFollowUp.length);
}

function checkStatusConnection(retryCount)
{
    const baseURL = "https://europe-west1-infrahack.cloudfunctions.net/lifts-tfl";
    const currTime = new Date();
    let data = '';
    // console.log(currTime.getTime());
    // https.get(baseURL + '?timestamp=' + currTime.getTime() + '&events_lookback_period_sec=' + 1200, (res) => // aktuell
    https.get(baseURL + '?timestamp=' + zeit + '&events_lookback_period_sec=' + 1200, (res) =>
    {
        res.on('data', (d) => {
            data += d;
        });

        res.on('end', () => {
            if (normalRecurrence == 1)
                checkIfLiftIsOperational(JSON.parse(data));
            else
                checkIfACKLogged(JSON.parse(data));
        });

        res.on('error', (err) => 
        {
            if (retryCount < 5)
            {
                checkStatusConnection(++retryCount);
            }
            else
            {
                console.log("No connection");
            }
            
        });

    });
}

function faultyCheckRecur() // time shortenedfor demo purpose
{
    setInterval(function() {
        zeit += 2;
        if (normalRecurrence == 0)
            checkStatusConnection(0);
    }, 1000);
}


function regularCheckRecur() // time shortened for demo purpose
{   
    setInterval(function() {
        if (normalRecurrence == 1)
            checkStatusConnection(0);
    }, 6000);
}

regularCheckRecur();
faultyCheckRecur();
dummyRouteGetter();
// checkStatusConnection(0);

    /*
    let legNo = currJourney.legs.length-1;
    while (legNo >= 0)
    {
        const lastLegRoute = currJourney.legs[legNo];
        let stopNo = lastLegRoute.path.stopPoints.length - 1;
        while (stopNo >= 0)
        {
            routeSearcher(lastLegRoute.path.stopPoints[stopNo].name, lastLegRoute.arrivalPoint.icsCode, null, 'bus').then(function (result) {
                // console.logconsole.log(result);
                if (result.$type == "Tfl.Api.Presentation.Entities.JourneyPlanner.ItineraryResult, Tfl.Api.Presentation.Entities")
                {
                   // console.log(result.$type);
                    stopNo = -1; legNo = -1; // break all loops
                    suggestShower(result);
                }
                else if (result.$type == "Tfl.Api.Presentation.Entities.JourneyPlanner.DisambiguationResult, Tfl.Api.Presentation.Entities")
                {
                    // console.log(result.$type);
                    let origin = lastLegRoute.path.stopPoints[stopNo].name;
                    if (result.toLocationDisambiguation.matchStatus == "list")
                        origin = result.toLocationDisambiguation.disambiguationOptions[0].icsCode;
                    routeSearcher(origin, lastLegRoute.arrivalPoint.icsCode, null, 'bus').then(function (result) {
                        if (result.$type == "Tfl.Api.Presentation.Entities.JourneyPlanner.ItineraryResult, Tfl.Api.Presentation.Entities")
                        {
                            stopNo = -1; legNo = -1; // break all loops
                            suggestShower(result);
                        }
                    })}
                else
                    console.log("ERR");
                
            });
            stopNo--;
        }
        legNo--;
    }
    */