var mongoose = require('mongoose');

var flightSchema = mongoose.Schema({
  flightSearchFromIata:String,
  flightSearchToIata:String,
  checkin:String,
  checkout:String,
  adultNum:String,
  childNum:String,
  typeOfFlight:String,
  airportSize:String,
  tripDistance:String,
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
  fromCompanyAfterStation: String,
  airlineImgSrc:String,
  fromDate: String,
  toDate: String,
  toTime:String,
  
},{timestamps: true});

flightSchema.index({createdAt: 1},{expireAfterSeconds:60000});

var Flight = mongoose.model('Flight', flightSchema);

  module.exports = Flight;
  