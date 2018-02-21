var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/airports', {
  useMongoClient: true,
  promiseLibrary: global.Promise
});

var Flight = mongoose.model('Flight', mongoose.Schema({
  //name: String,
  fromDepartureTime: String,
  fromArrivalTime: String,
  fromTown: String,
  toTown: String,
  fromIata: String,
  toIata: String,
 // duration :String,
  //station:String,
  // toDepartureTime: String,
  // toArrivalTime: String,
  price: Number,
  fromCompany: String,
  //toCompany: String,
  fromDate: String,
  toDate: String,
  // longitude_from: String,
  // latitude_from: String,
  // longitude_to: String,
  // latitude_to: String,


}));

var FlightInfos = mongoose.model('FlightInfos', mongoose.Schema({
  

  fromTown: String,
  toTown: String,
  fromIata: String,
  toIata: String,
  fromDate: String,
  toDate: String,
  roundTrip:String,

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

var LiveSearch = mongoose.model('AllAirports', newSchema);


module.exports = {
  Flight,
  LiveSearch,
  FlightInfos

}