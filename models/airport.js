var mongoose = require('mongoose');

var airport = mongoose.Schema({
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
  
  airport.index({
    location: "2dsphere"
  });
  
  var LiveSearch = mongoose.model('AirportsAll', airport);

  module.exports = LiveSearch;