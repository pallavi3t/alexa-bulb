'use strict';

//
// Setup Alexa
//
var Alexa = require('alexa-sdk');
var APP_ID =  "amzn1.ask.skill.<#>";
var SKILL_NAME = "myBulb";
var LAUNCH_MESSAGE = "Launched!";
var HELP_MESSAGE = "You can turn on or off the bulb and change its color... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";

var speechOut = [
    "The bulb is turned on.",
    "The bulb is turned off.",
    "The color of bulb changed to Red.",
    "The color of bulb changed to White.",
    "The color of bulb changed to Blue.",
];
var POWER_STATE_MESSAGE = "The bulb is powered unknown and color is unknown.";
var speechOutState = POWER_STATE_MESSAGE;

//
// Setup AWS SDK for communicating with ASW IOT
//
var config = {};
config.IOT_BROKER_ENDPOINT      = "<#>.iot.us-east-1.amazonaws.com";
config.IOT_BROKER_REGION        = "us-east-1";
config.IOT_THING_NAME           = "myBulb";
config.params                   = { thingName: 'myBulb' };

var AWS = require('aws-sdk');
AWS.config.region = config.IOT_BROKER_REGION;
var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});

var bulbPayload = [
    { "state": { "desired": {"power": "on"} } },
    { "state": { "desired": {"power": "off"} } },
    { "state": { "desired": {"color": "red"} } },
    { "state": { "desired": {"color": "white"} } },
    { "state": { "desired": {"color": "blue"} } }
];

//=========================================================================================================================================
//Editing anything below this line might break your skill.  
//=========================================================================================================================================
exports.handler = function(event, context, callback) {
    
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);

    //  Select the payload string
    var index = 0;
    switch (event.request.intent.name) {
    case 'PowerOnIntent': 
    	index = 0;
    	break;
    case 'PowerOffIntent': 
    	index = 1;
    	break;
    case 'ChangeToRedIntent': 
    	console.log('ChangeToRedIntent');
    	index = 2;
    	break;
    case 'ChangeToWhiteIntent': 
    	console.log('ChangeToWhiteIntent');
    	index = 3;
    	break;
    case 'ChangeToBlueIntent': 
    	console.log('ChangeToBlueIntent');
    	index = 4;
    	break;
    case 'GetBulbStateIntent': 
        index = 5;
    	break;
    default:
    	console.log('default');
    	index = -1;
    	break;
    }
    
    if (index === -1) {
        alexa.execute();
    }
    else if (index === 5) {
        speechOutState = POWER_STATE_MESSAGE;
        var paramsGet = {
            thingName : config.IOT_THING_NAME
        };
        return iotData.getThingShadow(paramsGet, function(err, data) {
            if (err) 
                console.log("get error: ", err);
            else {
                var obj = JSON.parse(data.payload, function (key, value) {
                    return value;
                });
                speechOutState = "The bulb is powered " + obj.state.desired.power + " and color is " + obj.state.desired.color + ".";
                console.log("State:", speechOutState);
            }
            alexa.execute();
        });
    }
    else {
        var paramsPublish = {
            topic : '$aws/things/myBulb/shadow/update',
            payload : JSON.stringify(bulbPayload[index]),
            qos : 0
        };
        return iotData.publish(paramsPublish, function(err, data) {
            if (err) console.log("publish error: ", err);
            else console.log("publish success");
            alexa.execute();
        });
    }
};

var handlers = {
    'PowerOnIntent': function () {
        this.emit(':tellWithCard', speechOut[0], SKILL_NAME, speechOut[0]);
    },
    
    'PowerOffIntent': function () {
        this.emit(':tellWithCard', speechOut[1], SKILL_NAME, speechOut[1]);
    },
    
    'ChangeToRedIntent': function () {
        this.emit(':tellWithCard', speechOut[2], SKILL_NAME, speechOut[2]);
    },
    
    'ChangeToWhiteIntent': function () {
        this.emit(':tellWithCard', speechOut[3], SKILL_NAME, speechOut[3]);
    },
    
    'ChangeToBlueIntent': function () {
        this.emit(':tellWithCard', speechOut[4], SKILL_NAME, speechOut[4]);
    },
    
    'GetBulbStateIntent': function () {
        this.emit(':tellWithCard', speechOutState, SKILL_NAME, speechOutState);
    },
    
    'LaunchRequest': function () {
        this.emit(':tell', LAUNCH_MESSAGE);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', HELP_MESSAGE, HELP_REPROMPT);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    }
};

