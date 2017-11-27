var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/test5', {
  useMongoClient: true,
  promiseLibrary: global.Promise
});

var Flight = mongoose.model('Flight', mongoose.Schema({
  name: String,
  fromDepartureTime: String,
  fromArrivalTime: String,
  fromTown: String,
  toTown: String,
  fromIata: String,
  toIata: String,
  // toDepartureTime: String,
  // toArrivalTime: String,
  price: String,
  fromCompany: String,
  //toCompany: String,
  fromDate: String,
  toDate: String,
  longitude_from: String,
  latitude_from: String,
  longitude_to: String,
  latitude_to: String,


}));

var newSchema= mongoose.Schema({
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

newSchema.index( { location : "2dsphere" } );
var LiveSearch = mongoose.model('AirportsAlls',newSchema);


module.exports = {
  Flight,
  LiveSearch
}
