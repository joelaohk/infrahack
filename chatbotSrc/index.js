'use strict'

const Slimbot = require('slimbot');
const slimbot = new Slimbot('626227083:AAGIC2lVQRnFkKN7RoD0JySSI7q_5fkbce4');


const https = require('https');
const awsdydb = require('aws-sdk');
const fs = require('fs');


awsdydb.config.update({
    region: "eu-west-2",
    endpoint: "apigateway.eu-west-2.amazonaws.com",
    accessKeyId: 'xxxx',
    secretAccessKey: 'xxxx'
  });
  

let originalDestCode = "CUS"; // cuddy sark from stratford international
let currentDest = originalDestCode;
let normalRecurrence = 1; // -1 no checking at all 0 check as abnormal 1 check as normal
let assetToFollowUp = null;
let currJourney = 0;
let zeit = 1556235986; // for demo

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
        if (i == 0)
            messageToSend += '\n' + 'Firstly take ' + journey.legs[i].instruction.summary;
        else if (i % 2 == 1)
            messageToSend += '\n' + 'Then take ' + journey.legs[i].instruction.summary;
        else
            messageToSend += '\n' + 'After that take ' + journey.legs[i].instruction.summary;
    }
    slimbot.sendMessage('820663765', messageToSend);
    // normalRecurrence = 1;
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
    
}

function dummyRouteGetter() //  to be replaced by actual request listening
{
    const baseURL = "https://api.tfl.gov.uk/journey/journeyresults";
    const currTime = new Date();
    let data = '';
    // console.log(currTime.getTime());
    https.get(baseURL + "/1003009/to/1002027?date=20190518&time=0900&journeyPreference=LeastWalking", (res) => 
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
        zeit += 1000;
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