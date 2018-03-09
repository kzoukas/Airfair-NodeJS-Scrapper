var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/airports', {
  useMongoClient: true,
  promiseLibrary: global.Promise
});

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

var FlightInfos = mongoose.model('FlightInfos', mongoose.Schema({
  
  fromIata: String,
  toIata: String,
  fromDate: String,
  toDate: String,
  typeOfFlight:String,
  flightSearched:String,

}));


var newSchema = mongoose.Schema({
  iata: String,
  lon: String,
  iso: String,
  status: String,
  name: String,
  continent: String,
  type: String,
  lat: String,
  size: String,
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [Number]
  }

});

newSchema.index({
  location: "2dsphere"
});

var LiveSearch = mongoose.model('AirportsAll', newSchema);


module.exports = {
  Flight,
  LiveSearch,
  FlightInfos

}