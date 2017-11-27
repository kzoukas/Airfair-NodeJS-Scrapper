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


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

function scrollPage() {
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

function resultsReady() {
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
      fromIata: town[1].textContent.trim(),
      toTown: town[2].textContent.trim(),
      toIata: town[3].textContent.trim(),
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
  res.render('Exploore _ Home Ver2');
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
  res.render('Exploore _ Home Ver2');

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


  const check_in = req.body.check_in;
  const check_out = req.body.check_out;
  // var arrayDate = req.body.daterange;
  // var dateSplited = arrayDate.split('-');
  // const start = dateSplited[0].trim();
  // const end = dateSplited[1].trim();
  // const start_date = check_in.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2");
  // const return_date = check_out.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2");

  var longitudeFrom = parseInt(fromDestSplited[2].trim());
  var latitudeFrom = parseInt(fromDestSplited[3].trim());
  var longitudeTo = parseInt(toDestSplited[2].trim());
  var latitudeTo = parseInt(toDestSplited[3].trim());

  const child_num=req.body.select_child_num;
  const adult_num = req.body.select_adult_num;
  console.log(child_num);
  console.log(adult_num);
  // console.log(arrayToDest);
  // console.log(fromName);
  // console.log(from);
  // console.log(toName);
  // console.log(to);
  // console.log(check_in);
  // console.log(check_out);
  // // console.log(start_date);
  // // console.log(return_date);
  // console.log(longitudeFrom);
  // console.log(latitudeFrom);
  // console.log(longitudeTo);
  // console.log(latitudeTo);
  var distance = getDistanceFromLatLonInKm(latitudeFrom, longitudeFrom, latitudeTo, longitudeTo);
  var middleDistance=distance/2;
  const longitudeMiddle = (longitudeFrom + longitudeTo) / 2;
  const latitudeMiddle = (latitudeFrom + latitudeTo) / 2;
  
   console.log(distance);
  // console.log(latitudeMiddle)
  LiveSearch.find({
    location: {
      $geoWithin: {
        $center: [
          [longitudeMiddle, latitudeMiddle], middleDistance / 100
        ]
      }
    },
    size: "large",
    name: {
      $ne: fromName
    }
  }, async(err, rows, fields) => {
    if (err) throw err;
    res.end(JSON.stringify(rows));
    console.log('Found ' + rows.length + ' middle airports');
    //var browser = await puppeteer.launch({headless:false});
    var browser = await puppeteer.launch();
    var searches = rows.map(async(row) => {
      var toNew = row.iata;
      var page = await browser.newPage();
      await page.goto(
        `https://tp24.airtickets.com/results#search/${from}/${toNew}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
          waitUntil: 'networkidle',
          timeout: 90000
        })

      return new Promise(async(resolve, reject) => {
        console.log(`Searching... from: ${from}, to: ${toNew}`)
        let pageReady = false
        while (!pageReady) {
          pageReady = await page.evaluate(resultsReady)
          await wait(1000)
          await page.evaluate(scrollPage)
          await wait(1000)
          await page.evaluate(scrollPage)
        }
        var resultsNum = await page.evaluate(countResults)
        console.log(`Finished loading from: ${from}, to: ${toNew}, found ${resultsNum}`)
        if (resultsNum) {
          console.log("Getting data...")
          var data = await page.evaluate(computeResults);
          //console.log('Data-------------------------------------------')
          // console.log(data)
          // console.log('----------------------------------------------')
          for (var i = 0; i < data.length; i++) {
            data[i].longitude_from = longitudeFrom;
            data[i].latitude_from = latitudeFrom;
            data[i].longitude_to = longitudeTo;
            data[i].latitude_to = latitudeTo;
          }

          await Flight.insertMany(data, function (error, docs) {
            if (error) {
              console.log('Error inserting:', error)
            } else {
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
      console.log('All searches1 finished!')
      console.log('-------------------------------------------------------------------------------')

      Flight.distinct('toIata', async(err, rows1, fields) => {
        if (err) throw err;
        res.end(JSON.stringify(rows1));
        console.log('Found ' + rows1.length + ' middle airports on database');

        var browser = await puppeteer.launch();
        var searches2 = rows1.map(async(row) => {
          var fromNew = row;
          var page = await browser.newPage();
          await page.goto(
            `https://tp24.airtickets.com/results#search/${fromNew}/${to}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
              waitUntil: 'networkidle',
              timeout: 90000
            })

          return new Promise(async(resolve, reject) => {
            console.log(`Searching... from: ${fromNew}, to: ${to}`)
            let pageReady = false
            while (!pageReady) {
              pageReady = await page.evaluate(resultsReady)
              await wait(1000)
              await page.evaluate(scrollPage)
            }
            var resultsNum = await page.evaluate(countResults)
            console.log(`Finished loading from: ${fromNew}, to: ${to}, found ${resultsNum}`)
            if (resultsNum) {
              console.log("Getting data...")
              var data = await page.evaluate(computeResults);
              //console.log('Data-------------------------------------------')
              // console.log(data)
              // console.log('----------------------------------------------')
              for (var i = 0; i < data.length; i++) {
                data[i].longitude_from = longitudeFrom;
                data[i].latitude_from = latitudeFrom;
                data[i].longitude_to = longitudeTo;
                data[i].latitude_to = latitudeTo;
              }

              await Flight.insertMany(data, function (error, docs) {
                if (error) {
                  console.log('Error inserting:', error)
                } else {
                  console.log("Saving done! from " + fromNew + " to " + to)
                }
              });
            } else {
              console.log("No flights  from " + fromNew + " to " + to)
            }
            resolve(true)
          })
        })
        Promise.all(searches2).then((responses) => {
          console.log('All searches2 finished!')
          //console.log(responses)
          // browser.close();

        })
      });

    });
    var browser = await puppeteer.launch();
    var page = await browser.newPage();
    await page.goto(
      `https://tp24.airtickets.com/results#search/${from}/${to}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
        waitUntil: 'networkidle',
        timeout: 90000
      })
    console.log(`Searching... from: ${from}, to: ${to}`)
    let pageReady = false
    while (!pageReady) {
      pageReady = await page.evaluate(resultsReady)
      await wait(1000)
      await page.evaluate(scrollPage)
      await wait(1000)
      await page.evaluate(scrollPage)
    }
    var resultsNum = await page.evaluate(countResults)
    console.log(`Finished loading from: ${from}, to: ${to}, found ${resultsNum}`)
    if (resultsNum) {
      console.log("Getting data...")
      var data = await page.evaluate(computeResults);
      //console.log('Data-------------------------------------------')
      // console.log(data)
      // console.log('----------------------------------------------')
      for (var i = 0; i < data.length; i++) {
        data[i].longitude_from = longitudeFrom;
        data[i].latitude_from = latitudeFrom;
        data[i].longitude_to = longitudeTo;
        data[i].latitude_to = latitudeTo;
      }

      await Flight.insertMany(data, function (error, docs) {
        if (error) {
          console.log('Error inserting:', error)
        } else {
          console.log("Saving done! from " + from + " to " + to)
        }
      });
    } else {
      console.log("No flights  from " + from + " to " + to)
    }
    console.log('ALL searches finished!')

  });

  //res.redirect("http://localhost:3000");

});
module.exports = router;