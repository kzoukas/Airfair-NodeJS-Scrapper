var mongoose = require('mongoose');

var airLogosSchema=mongoose.Schema({
  
  companyName: String,
  airLogoSrc: String,
 
});

var AirLogos = mongoose.model('AirLogos', airLogosSchema);
module.exports =  AirLogos;
  