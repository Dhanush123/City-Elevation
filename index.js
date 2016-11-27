'use strict';

var Alexa = require('alexa-sdk');
var GoogleMapsAPI = require('googlemaps');

var APP_ID = 'ADD THING HERE'; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
var SKILL_NAME = 'City Elevation';

//use same project as City Distance in Google APIs console
var publicConfig = {
    key: 'ADD SERVER KEY HERE',
    stagger_time:       100, // for elevationPath
    encode_polylines:   false,
    secure:             true, // use https
    //  proxy:              'http://127.0.0.1:9999' // optional, set a proxy for HTTP requests
};

var gmAPI = new GoogleMapsAPI(publicConfig);

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        console.log("went in newsession function");

        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME + '. You can ask a question like, what is the elevation of San Francisco? Please tell me a city you would like to find the elevation of.';

        this.attributes['repromptSpeech'] = 'To find an elevation, say something like: what is the elevation of San Diego?';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    },
    'GetElevation': function () {
        console.log("went in GetElevation function");

        if(this.event.request.intent.slots.cityE.value != undefined){
            var self = this;
            var elevSlot = this.event.request.intent.slots.cityE.value;
            if(elevSlot == undefined){
                self.emit('Unhandled')
            }
            else{
              console.log("elevSlot value: " + elevSlot);
              var params = {
                "address": elevSlot,
                "components": "components=country:US",
                "language":   "en",
                "region":     "us"
              };

            gmAPI.geocode( params, function(err, result) {
              console.log("err: "+err);
              console.log("result: "+result);
              // if(result.results[0].location.lat == undefined || result.results[0].location.long == undefined){
              if(result.results[0].geometry.location == undefined){
                self.emit('Unhandled');
              }
              else{
                console.log("result.results[0]: "+result.results[0]);
                console.log("result.results[0].geometry.location: "+result.results[0].geometry.location);
                console.log("result.results[0].geometry.location.lat: "+result.results[0].geometry.location.lat);
                console.log("result.results[0].geometry.location.lng: "+result.results[0].geometry.location.lng);
                var latAndLong = "" + result.results[0].geometry.location.lat + "," + result.results[0].geometry.location.lng + "";
                var params = {
                  "locations":  latAndLong,
                  "components": "components=country:US",
                  "language":   "en",
                  "region":     "us"
                };

                gmAPI.elevationFromLocations(params, function(err, result){
                  console.log("err: "+err);
                  console.log("result: "+result);
                  if(result.results[0].elevation == undefined){
                    self.emit('Unhandled');
                  }
                  else{
                    var elevationM = result.results[0].elevation; //meters
                    var elevationF = elevationM * 3.2808398950131; //feet
                    console.log("elevationM is: "+elevationM);
                    console.log("elevationF is: "+elevationF);
                    var totalResult = "The elevation of " + elevSlot + " is " + parseFloat(elevationF).toFixed(3) + " feet or " + parseFloat(elevationM).toFixed(3) + " meters.";
                    self.emit(':tell',totalResult);
                  }
                });
              }
            });
          }
        }
        else if(this.event.request.intent.slots.cityE.value == undefined){
                console.log("city undefined logic");
                this.emit('Unhandled');
        }
        else if(this.event.request.intent.slots.cityE.value == "help"){
                console.log("help if logic");
                this.emit('HelpMe');
        }
        else{
          // If the user either does not reply to the welcome message or says something that is not
          // understood, they will be prompted again with this text.
          this.attributes['speechOutput'] = 'Welcome to ' + SKILL_NAME + '. You can ask a question like, what is the elevation of Seattle? Please tell me a city you would like to find the elevation of.';

          this.attributes['repromptSpeech'] = 'To find a city elevation, say something like: what is the elevation of Berkeley?';
          this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
        }
    },
    'AMAZON.HelpIntent': function() {
      console.log("went in Amazon.HelpIntent");
      // If the user either does not reply to the welcome message or says something that is not
      // understood, they will be prompted again with this text.
      this.attributes['speechOutput'] = 'You can ask a question like, what is the elevation of Boston? Please tell me a city you would like to find the elevation of.'
      this.attributes['repromptSpeech'] = 'You can ask a question like, what is the elevation of Boston? Please tell me a city you would like to find the elevation of.'
      this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest':function () {
        this.emit(':tell', 'Goodbye!');
    },
    'Unhandled': function() {
      this.emit(':tell', 'Sorry, I was unable to understand and process your request. Please try again.');
      this.emit('SessionEndedRequest');
    },
    'HelpMe': function() {
      console.log("went in HelpMe");
      this.attributes['speechOutput'] = 'You can ask a question like, what is the elevation of Los Angeles? Please tell me a city you would like to find the elevation of.'
      this.attributes['repromptSpeech'] = 'You can ask a question like, what is the elevation of Los Angeles? Please tell me a city you would like to find the elevation of.'
      this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    }
};
