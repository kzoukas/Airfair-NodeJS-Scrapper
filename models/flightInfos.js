var mongoose = require('mongoose');

var FlightInfosSchema=mongoose.Schema({
  
  fromIata: String,
  toIata: String,
  checkin: String,
  checkout: String,
  typeOfFlight:String,
  adultNum:String,
  childNum:String,
  airportSize:String,
  tripDistance:String,
  flightSearched:String,
},{timestamps: true});

FlightInfosSchema.index({createdAt: 1},{expireAfterSeconds:600});

var FlightInfos = mongoose.model('FlightInfos', FlightInfosSchema);

module.exports =  FlightInfos;
  