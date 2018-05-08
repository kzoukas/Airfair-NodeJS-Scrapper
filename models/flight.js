var mongoose = require('mongoose');

var Flight = mongoose.model('Flight', mongoose.Schema({
    //name: String,
    flightSearchFromIata:String,
    flightSearchToIata:String,
    fromDepartureTime: String,
    fromArrivalTime: String,
    fromTown: String,
  
    stationArrivalTime: String,
    stationArrivalDate: String,
    waitingTime:String,
    stationDepTime: String,
    stationDepDate: String,
    stationTown: String,
    
  
    toTown: String,
    fromIata: String,
    toIata: String,
    duration :String,
    station:String,
    price: Number,
    fromCompany: String,
    airlineImgSrc:String,
    fromDate: String,
    toDate: String,
    toTime:String,
    
  }));
  module.exports = Flight;
  