var mongoose = require('mongoose');

var FlightInfos = mongoose.model('FlightInfos', mongoose.Schema({
  
    fromIata: String,
    toIata: String,
    fromDate: String,
    toDate: String,
    typeOfFlight:String,
    airportSize:String,
    tripDistance:String,
    flightSearched:String,
  
  }));

  module.exports =  FlightInfos;
  
  