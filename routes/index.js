// import { setTimeout } from 'timers';

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var file_importer = require('./test.js')
const puppeteer = require('puppeteer');
const Models = require('./mongoModels');
const Flight = Models.Flight;
const LiveSearch = Models.LiveSearch;
const AirportsAll = Models.AirportsAll;

function scrollPage (){
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);
}

function countResults() {
  // return document.querySelector(".result-container")?document.querySelector(".result-container").children:0;
  if (document.querySelector(".result-container")) {
    return document.querySelectorAll(".result-container").length;
  } else {
    return 0;

  }
}
function resultsReady(){
  return !document.querySelector('.loader-line')
}
function computeResults() {

  var results = Array.from(document.querySelectorAll(".result-container"));
  console.log('----------------------------------------------------------')
  console.log(results)
  return results.map((r) => {
    var times = r.querySelectorAll('.time')
    var town = r.querySelectorAll('.town')

    var infos = r.querySelectorAll('.connection-info span')

    return {
      fromDepartureTime: times[0].textContent.trim(),
      fromArrivalTime: times[1].textContent.trim(),
      fromTown: town[0].textContent.trim(),
      toTown: town[2].textContent.trim(),
      // toDepartureTime: times[2].textContent.trim(),
      // toArrivalTime: times[3].textContent.trim(),
      price: r.querySelector(".result-widget-price").textContent,
      fromCompany: infos[1].textContent.trim(),
      //toCompany: infos[5].textContent.trim(),
      fromDate: infos[2].textContent.trim(),
      toDate: infos[2].textContent.trim(),
      //toDate: infos[6].textContent.trim(),
    }
  })
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/airports', function (req, res, next) {
  file_importer.parseFile('./views/airports.json', function (err, data) {
    if (err) return console.log(err);
    res.end(data);

  });
});
router.get('/load/:_search', function (req, res) {
  var search1 = req.params._search;
  var name = "name";
  var query = {};
  query[name] = {
    $regex: search1
  };
  LiveSearch.find(query, function (err, rows, fields) {
    if (err) throw err;
    res.end(JSON.stringify(rows));
  });

});

router.get('/allFlightss', function (req, res) {
  res.render('index');

});

router.post('/allFlightss', function (req, res, next) {


  var arrayFromDest = req.body.search;
  var fromDestSplited = arrayFromDest.split(',');
  const fromName = fromDestSplited[0].trim();
  const from = fromDestSplited[1].trim();

  var arrayToDest = req.body.search2;
  var toDestSplited = arrayToDest.split(',');
  const toName = toDestSplited[0].trim();
  const to = toDestSplited[1].trim();

  var arrayDate = req.body.daterange;
  var dateSplited = arrayDate.split('-');
  const start = dateSplited[0].trim();
  const end = dateSplited[1].trim();
  const start_date = start.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2");
  const return_date = end.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2");

  var longitudeFrom = parseInt(fromDestSplited[2].trim());
  var latitudeFrom = parseInt(fromDestSplited[3].trim());
  var longitudeTo = parseInt(toDestSplited[2].trim());
  var latitudeTo = parseInt(toDestSplited[3].trim());

  const longitudeMiddle = (longitudeFrom + longitudeTo) / 2;
  const latitudeMiddle = (latitudeFrom + latitudeTo) / 2;



  // window.location.href = "http://localhost:8080/";
  // window.location.replace("http://localhost:8080/");
  // var search1=req.params._search;
  // var name = "name";
  // var query = {};
  //query[name] = "Brewarrina Airport";

  LiveSearch.find({
    location: {
      $geoWithin: {
        $center: [
          [longitudeMiddle, latitudeMiddle], 6
        ]
      }
    },
    size: "large"
  }, async (err, rows, fields) => {
    if (err) throw err;
    res.end(JSON.stringify(rows));
    console.log(rows);
    console.log(rows.length);

    var browser = await puppeteer.launch({
      headless: false
    });
    var searches = rows.map(async (row) => {
      var toNew = row.iata;
      var page = await browser.newPage();
      await page.goto(
        `https://tp24.airtickets.com/results#search/${from}/${toNew}/obDate/${start_date}/ibDate/${start_date}/isRoundtrip/1/passengersAdult/1/passengersChild/0/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
          waitUntil: 'networkidle'
      })

      return new Promise(async (resolve, reject) => {
        console.log(`Searching... from: ${from}, to: ${toNew}`)
        let pageReady = false
        while(!pageReady){
          pageReady = await page.evaluate(resultsReady)
          await wait(1000)
          await page.evaluate(scrollPage)
        }
        var resultsNum = await page.evaluate(countResults)
        console.log(`Finished loading, found ${resultsNum}`)
        if (resultsNum) {
          console.log("Getting data...")
          var data = await page.evaluate(computeResults);
          console.log('Data-------------------------------------------')
          console.log(data)
          console.log('----------------------------------------------')
          for (var i = 0; i < data.length; i++) {
            data[i].longitude_from = longitudeFrom;
            data[i].latitude_from = latitudeFrom;
            data[i].longitude_to = longitudeTo;
            data[i].latitude_to = latitudeTo;
          }

          await Flight.insertMany(data, function (error, docs) {
            if(error){
              console.log('Error inserting:', error)
            }else{
              console.log("Saving done! from " + fromName + " to " + toNew)
            }
          });
        } else {
          console.log("No flights  from " + fromName + " to " + toNew)
        }
        resolve(true)
      })
    })
    Promise.all(searches).then((responses) => {
      console.log('All searches finished?')
      console.log(responses)
      // browser.close();

    })
  });

  res.redirect("http://localhost:3000");

});
module.exports = router;