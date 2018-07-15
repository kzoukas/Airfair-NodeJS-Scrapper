const dotenv = require("dotenv");
dotenv.config();
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect((process.env.MONGO_URL), {
  useMongoClient: true,
  promiseLibrary: global.Promise
});
var file_importer = require('./test.js')
const puppeteer = require('puppeteer');
const Flight = require('../models/flight.js');
const LiveSearch = require('../models/airport.js');
const FlightInfos = require('../models/flightInfos.js');
const AirLogos = require('../models/airLogos.js');


function LatLon(lat, lon) {
  // allow instantiation without 'new'
  if (!(this instanceof LatLon)) return new LatLon(lat, lon);

  this.lat = Number(lat);
  this.lon = Number(lon);
}
LatLon.prototype.midpointTo = function (point) {
  if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

  // φm = atan2( sinφ1 + sinφ2, √( (cosφ1 + cosφ2⋅cosΔλ) ⋅ (cosφ1 + cosφ2⋅cosΔλ) ) + cos²φ2⋅sin²Δλ )
  // λm = λ1 + atan2(cosφ2⋅sinΔλ, cosφ1 + cosφ2⋅cosΔλ)
  // see mathforum.org/library/drmath/view/51822.html for derivation

  var φ1 = this.lat.toRadians(),
    λ1 = this.lon.toRadians();
  var φ2 = point.lat.toRadians();
  var Δλ = (point.lon - this.lon).toRadians();

  var Bx = Math.cos(φ2) * Math.cos(Δλ);
  var By = Math.cos(φ2) * Math.sin(Δλ);

  var x = Math.sqrt((Math.cos(φ1) + Bx) * (Math.cos(φ1) + Bx) + By * By);
  var y = Math.sin(φ1) + Math.sin(φ2);
  var φ3 = Math.atan2(y, x);

  var λ3 = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);

  return new LatLon(φ3.toDegrees(), (λ3.toDegrees() + 540) % 360 - 180); // normalise to −180..+180°
};

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

function rad2deg(rad) {
  return rad / (Math.PI / 180)
}

function scrollPage() {
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);
  window.scrollBy(0, window.innerHeight);

}

function countResults() {
  /* return document.querySelector(".result-container")?document.querySelector(".result-container").children:0;  */
  if (document.querySelector(".search-results-item")) {
    return document.querySelectorAll(".search-results-item").length;
  } else {
    return 0;

  }
}

function resultsReady() {
  return !document.querySelector('.progress-bar-title')
}
async function insertUniqueLogos(data) {
  for (var data2 of data) {

    await AirLogos.find({
      companyName: data2.fromCompany
    }, function (err, doc) {
      if (doc.length) {

      } else {

        var logo = {
          companyName: data2.fromCompany,
          airLogoSrc: data2.airlineImgSrc
        }
        if (data2.airlineImgSrc == "./Content/images/multiple-airlines-34x34.jpg") {
          console.log("vrikame multiple " + data2.fromCompany)
        } else {
          AirLogos.insertMany(logo, function (error) {
            if (error) {
              console.log('Error inserting infos:', error)
            } else {
              console.log("Saving infos done!")
            }
          });
        }
      }
    });
  }

}

function wrapComputeResults() {
  let data = [];
  var results = Array.from(document.querySelectorAll(".search-results-item"));
  console.log('----------------------------------------------------------')
  console.log(results)
  for (var result of results) {

    let priceEdit = result.querySelector(".price-text").textContent.trim();
    let price = priceEdit.substring(0, priceEdit.length - 2).replace(/\s/g, "");
    let companies = result.querySelectorAll(".info-box .code .operated-by");
    let times = result.querySelectorAll(".date .time");
    let dates = result.querySelectorAll(".date .mobile-hide");
    let townNames = result.querySelectorAll(".point-title span b");
    let iatas = result.querySelectorAll(".points-box .point .code");
    let durationEdit = result.querySelectorAll(".subtitle span");
    let duration, fromCompany, fromCompanyAfterStation;
    let station = result.querySelector(".mobile-hide").textContent.trim();
    let airlineImages = result.querySelectorAll('.img-box img');
    let airlineImgSrc = airlineImages[0].getAttribute('src');
    if (station == "Direct") {
      let fromIata = iatas[0].textContent.trim();
      let toIata = iatas[1].textContent.trim();
      let fromTown = townNames[0].textContent.trim();
      let toTown = townNames[1].textContent.trim();
      if (companies.length == 1) {
        fromCompany = companies[0].textContent.substring(12);
      } else {
        fromCompany = "undefined";
      }
      let fromDepartureTime = times[0].textContent.trim();
      let fromArrivalTime = times[1].textContent.trim();
      let fromDate = dates[1].textContent.trim();
      let toDate = dates[3].textContent.trim();
      if (durationEdit.length == 4) {
        duration = durationEdit[2].textContent.trim();
      } else if (durationEdit.length == 5) {
        duration = durationEdit[2].textContent.trim() + " " + durationEdit[3].textContent.trim();
      } else if (durationEdit.length == 6) {
        duration = durationEdit[2].textContent.trim() + " " + durationEdit[3].textContent.trim() + " " + durationEdit[4].textContent.trim();
      }

      data.push({
        fromIata,
        toIata,
        price,
        station,
        fromDepartureTime,
        fromArrivalTime,
        fromDate,
        toDate,
        fromTown,
        toTown,
        fromCompany,
        duration,
        airlineImgSrc
      });
    } else if (station == "1 Stop") {
      if (companies != null) {
        if (companies.length == 1) {
          fromCompany = companies[0].textContent.substring(12);
          fromCompanyAfterStation = companies[0].textContent.substring(12);
        } else {
          fromCompany = companies[0].textContent.substring(12);
          fromCompanyAfterStation = companies[1].textContent.substring(12);
        }
      } else {
        fromCompany = "Not operated";
        fromCompanyAfterStation = "Not operated";
      }
      let fromIata = iatas[0].textContent.trim();
      let toIata = iatas[3].textContent.trim();
      let fromTown = townNames[0].textContent.trim();
      let stationTown = townNames[1].textContent.trim();
      let toTown = townNames[3].textContent.trim();
      let fromDepartureTime = times[0].textContent.trim();
      let stationArrivalTime = times[1].textContent.trim();
      let stationDepTime = times[2].textContent.trim();
      let fromArrivalTime = times[3].textContent.trim();
      let fromDate = dates[1].textContent.trim();
      let stationArrivalDate = dates[3].textContent.trim();
      let stationDepDate = dates[5].textContent.trim();
      let toDate = dates[7].textContent.trim();
      let waitingTime = result.querySelector(".date-time span").textContent.trim();
      let toTime = times[3].textContent.trim();
      if (durationEdit.length == 5) {
        duration = durationEdit[2].textContent.trim();
      } else if (durationEdit.length == 6) {
        duration = durationEdit[2].textContent.trim() + " " + durationEdit[3].textContent.trim();
      } else if (durationEdit.length == 7) {
        duration = durationEdit[2].textContent.trim() + " " + durationEdit[3].textContent.trim() + " " + durationEdit[4].textContent.trim();
      }
      data.push({
        price,
        fromCompany,
        fromCompanyAfterStation,
        fromDepartureTime,
        fromArrivalTime,
        fromIata,
        toIata,
        fromTown,
        fromDate,
        toTown,
        stationTown,
        stationArrivalTime,
        stationDepTime,
        stationArrivalDate,
        waitingTime,
        stationDepDate,
        toDate,
        duration,
        station,
        airlineImgSrc
      });
    }
  }
  return data;

}

function searchToMiddleAndSave(rows, from, to, browser, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance,middleAirports) {

  var searches = rows.map(async (row) => {
    var toMiddle = row.iata;
    if (to != toMiddle) {
      var page = await browser.newPage();

      await page.goto(
        `http://flights.lonelyplanet.com/en-GB/flights#/result?originplace=${from}&destinationplace=${toMiddle}
      &outbounddate=${check_in}&inbounddate=&adults=${adult_num}&children=${child_num}&infants=0&cabinclass=Economy`, {
          waitLoad: true,
          waitNetworkIdle: true,
          timeout: 700000
        })
      var waitingTime=6000;
      if (middleAirports>30){
        waitingTime=8000;
      }else if(middleAirports>60){
        waitingTime=10000;
      }else if(middleAirports>90){
        waitingTime=20000;
      }
      await page.waitFor(waitingTime);
      return new Promise(async (resolve, reject) => {
        console.log(`Searching... from: ${from}, to: ${toMiddle}`)
        let pageReady = false
        setTimeout(checkForLoading, 50000)
        function checkForLoading() {
          if (!pageReady) {
            console.log("Den fortwne h selida apo " + from + "to" + toMiddle)
            pageReady=true;
          }
        }
        while (!pageReady) {
          await wait(3000)
          pageReady = await page.evaluate(resultsReady)
          await wait(3000)
        }
        if (pageReady) {
          var resultsNum = await page.evaluate(countResults)
          console.log(`Finished loading from: ${from}, to: ${toMiddle}, found ${resultsNum}`)
          if (resultsNum) {
            console.log("Getting data...")
            var data = await page.evaluate(wrapComputeResults);
            await Flight.insertMany(data.map(item => {
              return {
                flightSearchFromIata: from,
                flightSearchToIata: to,
                checkin: check_in,
                checkout: check_out,
                adultNum: adult_num,
                childNum: child_num,
                typeOfFlight: flight_type,
                airportSize: airport_size,
                tripDistance: trip_distance,
                ...item
              }
            }), function (error, docs) {
              if (error) {

                console.log('Error inserting:', error)

              } else {
                console.log("Saving done! from " + from + " to " + toMiddle)

              }
            });
            insertUniqueLogos(data);
          } else {
            console.log("No flights  from " + from + " to " + toMiddle)

          }
        }
        resolve(true)
      }).catch(error => {
        console.error(error) // add catch here
      })
    }
  })
  return searches;

}

function searchFromMiddleAndSave(rows, from, to, browser, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance,middleAirports) {

  var searches = rows.map(async (row) => {
    var fromMiddle = row;
    if (from != fromMiddle) {
      var page = await browser.newPage();

      await page.goto(
        `http://flights.lonelyplanet.com/en-GB/flights#/result?originplace=${fromMiddle}&destinationplace=${to}
      &outbounddate=${check_in}&inbounddate=&adults=${adult_num}&children=${child_num}&infants=0&cabinclass=Economy`, {
          waitLoad: true,
          waitNetworkIdle: true,
          timeout: 700000
        })
      var waitingTime=6000;
      if (middleAirports>30){
          waitingTime=8000;
      }else if(middleAirports>60){
          waitingTime=10000;
       }else if(middleAirports>90){
          waitingTime=20000;
      }
      await page.waitFor(waitingTime);
      return new Promise(async (resolve, reject) => {
        console.log(`Searching... from: ${fromMiddle}, to: ${to}`)
        let pageReady = false
        setTimeout(checkForLoading, 50000)
        function checkForLoading() {
          if (!pageReady) {
            console.log("Den fortwne h selida apo " + fromMiddle + "to" + to)
            pageReady = true;
          }
        }
        while (!pageReady) {
          await wait(3000)
          pageReady = await page.evaluate(resultsReady)
          await wait(5000)
        }
        if (pageReady) {
          var resultsNum = await page.evaluate(countResults)
          console.log(`Finished loading from: ${fromMiddle}, to: ${to}, found ${resultsNum}`)
          if (resultsNum) {
            console.log("Getting data...")
            var data = await page.evaluate(wrapComputeResults);
            await Flight.insertMany(data.map(item => {
              return {
                flightSearchFromIata: from,
                flightSearchToIata: to,
                checkin: check_in,
                checkout: check_out,
                adultNum: adult_num,
                childNum: child_num,
                typeOfFlight: flight_type,
                airportSize: airport_size,
                tripDistance: trip_distance,
                ...item
              }
            }), function (error, docs) {
              if (error) {
                console.log('Error inserting:', error)
              } else {
                console.log("Saving done! from " + fromMiddle + " to " + to)
              }
            });
            insertUniqueLogos(data);
          } else {
            console.log("No flights  from " + fromMiddle + " to " + to)
          }
        }
        resolve(true)
      }).catch(error => {
        console.error(error) // add catch here
      })
    }
  })
  return searches;

}
async function searchDirectFlightAndSave(from, to, browser, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance) {

  var page = await browser.newPage();
  await page.goto(
    `http://flights.lonelyplanet.com/en-GB/flights#/result?originplace=${to}&destinationplace=${from}&outbounddate=${check_out}&inbounddate=&adults=${adult_num}&children=${child_num}&infants=0&cabinclass=Economy`, {
      waitUntil: ['load', 'networkidle'],
      timeout: 700000
    })

  console.log(`Searching... from: ${to}, to: ${from}`)
  let pageReady = false
  while (!pageReady) {
    pageReady = await page.evaluate(resultsReady)
    await wait(1000)
    await page.evaluate(scrollPage)
    await wait(1000)
    await page.evaluate(scrollPage)
    await wait(1000)
    await page.evaluate(scrollPage)
  }
  var resultsNum = await page.evaluate(countResults)
  console.log(`Finished loading from: ${to}, to: ${from}, found ${resultsNum}`)
  return new Promise(async (resolve, reject) => {
    if (resultsNum) {
      try {
        console.log("Getting data...")
        // var data = await page.evaluate(wrapComputeResults(from, to));
        var data = await page.evaluate(wrapComputeResults);

        await Flight.insertMany(data.map(item => {
          return {
            flightSearchFromIata: to,
            flightSearchToIata: from,
            checkin: check_out,
            checkout: check_in,
            adultNum: adult_num,
            childNum: child_num,
            typeOfFlight: flight_type,
            airportSize: airport_size,
            tripDistance: trip_distance,
            ...item
          }
        }), function (error, docs) {
          if (error) {
            reject("Error inserting", error);
            // console.log('Error inserting:', error)
          } else {
            resolve("Saving done from " + to + " to " + from)
            //console.log("Saving done! from " + from + " to " + to)
          }
        });
        insertUniqueLogos(data);
      } catch (err) {
        alert(err); // TypeError: failed to fetch
      }
    } else {
      resolve();
      console.log("No flights  from " + to + " to " + from)
    }
  }).catch(error => {
    console.error(error) // add catch here
  })

}
async function searchDirectFlightCheckInAndSave(from, to, browser, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance) {
  var page = await browser.newPage();

  await page.goto(
    `http://flights.lonelyplanet.com/en-GB/flights#/result?originplace=${from}&destinationplace=${to}&outbounddate=${check_in}&inbounddate=&adults=${adult_num}&children=${child_num}&infants=0&cabinclass=Economy`, {
      // `https://www.gr.kayak.com/flights/${from}-${to}/${check_in}/sort=bestflight_a`, {
      waitUntil: ['load', 'networkidle'],
      timeout: 700000
    })
  await page.waitFor(5000);
  console.log(`Searching... from: ${from}, to: ${to}`)
  let pageReady = false
  while (!pageReady) {
    pageReady = await page.evaluate(resultsReady)
    await wait(1000)
    await page.evaluate(scrollPage)
    await wait(1000)
    await page.evaluate(scrollPage)
    await wait(1000)
  }
  var resultsNum = await page.evaluate(countResults)
  var options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  };
  console.log(`Finished loading from: ${from}, to: ${to}, found ${resultsNum}`)
  return new Promise(async (resolve, reject) => {
    if (resultsNum) {
      try {
        console.log("Getting data...")
        var data = await page.evaluate(wrapComputeResults);
        await Flight.insertMany(data.map(item => {
          return {
            flightSearchFromIata: from,
            flightSearchToIata: to,
            checkin: check_in,
            checkout: check_out,
            adultNum: adult_num,
            childNum: child_num,
            typeOfFlight: flight_type,
            airportSize: airport_size,
            tripDistance: trip_distance,
            ...item
          }
        }), function (error, docs) {
          if (error) {

            reject("Error inserting", error);
            // console.log('Error inserting:', error)
          } else {

            resolve("Saving done eeeeeeee! from " + from + " to " + to)
            //console.log("Saving done! from " + from + " to " + to)
          }
        });
        insertUniqueLogos(data);


      } catch (err) {
        alert(err); // TypeError: failed to fetch
      }
    } else {
      resolve();
      console.log("No flights  from " + from + " to " + to)
    }
  }).catch(error => {
    console.error(error) // add catch here
  })
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms)).catch(error => {
  console.error(error) // add catch here
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});
router.get('/load/:_search', function (req, res) {
  var search1 = req.params._search;
  search1 = new RegExp("^" + search1.toLowerCase(), "i")
  var name = "name";
  var query = {};
  query[name] = {
    $regex: search1

  };
  var iata = "iata";
  var query2 = {};
  query2[iata] = {
    $regex: search1

  };
  // LiveSearch.find(query).collation({ locale: 'en', strength: 2 }).
  //   then(docs => res.end(JSON.stringify(docs)));

  LiveSearch.find({
    "$or": [{
        "name": {
          "$regex": search1
        }
      },
      {
        "iata": {
          "$regex": search1
        }
      }
    ]
  }, function (err, rows, fields) {
    if (err) throw err;
    res.end(JSON.stringify(rows));

  });

});
router.post('/allFlightss', function (req, res, next) {

  var flight_type = req.body.flightType;
  var arrayFromDest = req.body.search;
  var fromDestSplited = arrayFromDest.split(',');
  var fromName = fromDestSplited[0].trim();
  const from = fromDestSplited[1].trim();

  var arrayToDest = req.body.search2;
  var toDestSplited = arrayToDest.split(',');
  var toName = toDestSplited[0].trim();
  const to = toDestSplited[1].trim();

  const check_in = req.body.check_in;
  const check_out = req.body.check_out;

  var longitudeFrom = parseInt(fromDestSplited[2].trim());
  var latitudeFrom = parseInt(fromDestSplited[3].trim());
  var longitudeTo = parseInt(toDestSplited[2].trim());
  var latitudeTo = parseInt(toDestSplited[3].trim());

  const child_num = req.body.select_child_num;
  const adult_num = req.body.select_adult_num;
  var radius;
  const airport_size = req.body.select_airport_size;
  var airport_size2;
  var airport_size3;
  if (airport_size == "large") {
    airport_size2 = "large";
    airport_size3 = "large";
  } else if (airport_size == "medium") {
    airport_size2 = "large";
    airport_size3 = "large";
  } else {
    airport_size2 = "large";
    airport_size3 = "medium";
  }
  const trip_distance = req.body.select_trip_radius;
  if (trip_distance == "long") {
    radius = 80;
  } else {
    radius = 100;
  }

  var distance = getDistanceFromLatLonInKm(latitudeFrom, longitudeFrom, latitudeTo, longitudeTo);
  var middleDistance = distance / 2;
  var latitudeTo = deg2rad(latitudeTo);
  var latitudeFrom = deg2rad(latitudeFrom);
  var longitudeFrom = deg2rad(longitudeFrom);
  var longitudeTo = deg2rad(longitudeTo);

  var Bx = Math.cos(latitudeTo) * Math.cos(longitudeTo - longitudeFrom);
  var By = Math.cos(latitudeTo) * Math.sin(longitudeTo - longitudeFrom);
  var latitudeMiddle = Math.atan2(Math.sin(latitudeFrom) + Math.sin(latitudeTo),
    Math.sqrt((Math.cos(latitudeFrom) + Bx) * (Math.cos(latitudeFrom) + Bx) + By * By));
  var longitudeMiddle = longitudeFrom + Math.atan2(By, Math.cos(latitudeFrom) + Bx);

  var latitudeMiddle = rad2deg(latitudeMiddle);
  var longitudeMiddle = rad2deg(longitudeMiddle);

  console.log(latitudeMiddle);
  console.log(longitudeMiddle);

  var infos = {
    fromIata: from,
    toIata: to,
    checkin: check_in,
    checkout: check_out,
    adultNum: adult_num,
    childNum: child_num,
    typeOfFlight: flight_type,
    airportSize: airport_size,
    tripDistance: trip_distance,
    flightSearched: "no",
  };

  FlightInfos.insertMany(infos, function (error) {
    if (error) {
      console.log('Error inserting infos:', error)
    } else {
      console.log("Saving infos done!")
    }
  });

  /**
   * Find all airports inside the radius that is computed among the departure and arrival airport with the
   * help of geowithin (MOngoDB operator)
   */
  LiveSearch.find({
    location: {
      $geoWithin: {
        $center: [
          [longitudeMiddle, latitudeMiddle], middleDistance / radius // 1 degree is 111 km so approximately 100 is good
        ]
      }
    },
    $or: [{
      size: airport_size
    }, {
      size: airport_size2
    }, {
      size: airport_size3
    }],

    name: {
      $ne: fromName
    }
  }, async (err, rows, fields) => {
    if (err) throw err;
    res.end(JSON.stringify(rows));
    var middleAirports = rows.length;
    console.log('Found ' + middleAirports + ' middle airports');

    if (middleAirports != 0) {

      /**(OneWay trip)
       * If there are middle airports search all the flights from departure airport to 
       * all found middle airports and save all the pairs that have flights
       */
      var browserOneWayDirectCheckIn1 = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
      });
      var searchDirectResult = searchDirectFlightCheckInAndSave(from, to, browserOneWayDirectCheckIn1, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance);

      searchDirectResult.then((responses) => {
        console.log('Direct Flight searched!')
        console.log('-------------------------------------------------------------------------------')
        browserOneWayDirectCheckIn1.close();
      }).catch(function (err) {
        console.log(err.message); // some coding error in handling happened
      });
      var browserOneWayFromDepartureToMiddle = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
      });
      var searchesFromDepartureToMiddle = searchToMiddleAndSave(rows, from, to, browserOneWayFromDepartureToMiddle, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance,middleAirports);

      /**(RoundTrip)
       * If the flight search is roundtrip search again if there are middle airports search all the 
       * flights from arrival airport to all found middle airports and save all the pairs that have flights
       */
      if (flight_type == "roundTrip") {
        var browserRoundTripFromArrivalToMiddle = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });

        var searchesFromArrivalToMiddle = searchToMiddleAndSave(rows, to, from, browserRoundTripFromArrivalToMiddle, check_out, check_in, adult_num, child_num, flight_type, airport_size, trip_distance,middleAirports);
        Promise.all(searchesFromArrivalToMiddle).then((responses) => {
          console.log('Roundtrip: All searches to middle airports for check out finished!')
          console.log('-------------------------------------------------------------------------------')
          browserRoundTripFromArrivalToMiddle.close();

          /**(RoundTrip)
           * Find all middle airports that there are flights from arrival airport
           */
          var query = {
            'flightSearchFromIata': to,
            'flightSearchToIata': from,
            'checkin': check_out,
            'checkout': check_in,
            'adultNum': adult_num,
            'childNum': child_num,
            'typeOfFlight': flight_type,
            'airportSize': airport_size,
            'tripDistance': trip_distance,
          };
          Flight.find(query).distinct('toIata', async (err, rows, fields) => {
            if (err) throw err;
            res.end(JSON.stringify(rows));
            var middleAirports2 = rows.length;
            console.log('Found ' + rows.length + ' middle airports for check out on database');

            var browserRoundTripFromMiddleToDeparture = await puppeteer.launch({
              args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
              headless: true
            });
            //Search all the flights from the middle airports found to the departure airport and save them
            var searchesFromMiddleToDeparture = searchFromMiddleAndSave(rows, to, from, browserRoundTripFromMiddleToDeparture, check_out, check_in, adult_num, child_num, flight_type, airport_size, trip_distance,middleAirports2);
            Promise.all(searchesFromMiddleToDeparture).then((responses) => {
              console.log('Roundtrip: All searches from middle airports to  for check out finished!')
              console.log('-------------------------------------------------------------------------------')
              browserRoundTripFromMiddleToDeparture.close();
              var query = {

                'fromIata': from,
                'toIata': to,
                'checkin': check_in,
                'checkout': check_out,
                'adultNum': adult_num,
                'childNum': child_num,
                'typeOfFlight': flight_type,
                'airportSize': airport_size,
                'tripDistance': trip_distance,
                'flightSearched': 'no'
              };

              FlightInfos.findOneAndUpdate(query, {
                flightSearched: 'yes'
              }, {
                upsert: true
              }, function (error, doc) {
                if (error) {
                  console.log('Error Updating infos')
                } else {
                  console.log("Tickets Searched Successfully!")
                }
              });

            }).catch(function (err) {
              console.log(err.message); // some coding error in handling happened
            });
          });

        }).catch(function (err) {
          console.log(err.message); // some coding error in handling happened
        });
        /**(RoundTrip)
         * Search all the firect flights from arrival to departure airport and save them
         */
        var browserRoundTripDirectCheckOut1 = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });

        var searchDirectResultReturn = searchDirectFlightAndSave(from, to, browserRoundTripDirectCheckOut1, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance);
        searchDirectResultReturn.then((responses) => {
          console.log('Direct Flight Return searched!')
          console.log('-------------------------------------------------------------------------------')
          browserRoundTripDirectCheckOut1.close();
        }).catch(function (err) {
          console.log(err.message); // some coding error in handling happened
        });
      }

      Promise.all(searchesFromDepartureToMiddle).then((responses) => {
        console.log('All searches to middle airports for check in finished!')
        console.log('-------------------------------------------------------------------------------')
        browserOneWayFromDepartureToMiddle.close();

        /**(OneWaw trip)
         * Find all middle airports that there are flights from departure airport
         */
        var query = {
          'flightSearchFromIata': from,
          'flightSearchToIata': to,
          'checkin': check_in,
          'checkout': check_out,
          'adultNum': adult_num,
          'childNum': child_num,
          'typeOfFlight': flight_type,
          'airportSize': airport_size,
          'tripDistance': trip_distance,
        };
        Flight.find(query).distinct('toIata', async (err, rows, fields) => {
          if (err) throw err;
          res.end(JSON.stringify(rows));
          console.log('Found ' + rows.length + ' middle airports for check in on database');

          var browserOneWayFromMiddleToArrival = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true
          });
          //Search all the flights from the middle airports found to the arrival airport and save them
          var searchesFromMiddleToArrival = searchFromMiddleAndSave(rows, from, to, browserOneWayFromMiddleToArrival, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance,middleAirports);
          Promise.all(searchesFromMiddleToArrival).then((responses) => {
            console.log('All searches from middle airports to destination for check in finished!')
            console.log('-------------------------------------------------------------------------------')
            browserOneWayFromMiddleToArrival.close();

            /**(OneWaw trip)
             * Once the oneWay trip is searched update the flight with flightSearched:'yes' so
             * stop loading icon at the result page and show the final results
             */
            if (flight_type == "oneWay") {
              var query = {

                'fromIata': from,
                'toIata': to,
                'checkin': check_in,
                'checkout': check_out,
                'adultNum': adult_num,
                'childNum': child_num,
                'typeOfFlight': flight_type,
                'airportSize': airport_size,
                'tripDistance': trip_distance,
                'flightSearched': 'no'
              };

              FlightInfos.findOneAndUpdate(query, {
                flightSearched: 'yes'
              }, {
                upsert: true
              }, function (error, doc) {
                if (error) {
                  console.log('Error Updating infos')
                } else {
                  console.log("Tickets Searched Successfully!")
                }
              });
            }

          }).catch(function (err) {
            console.log(err.message); // some coding error in handling happened
          });
        });

      }).catch(function (err) {
        console.log(err.message); // some coding error in handling happened
      });
    } else {
      if (flight_type == "roundTrip") {

        /**(OneWay trip)
         * Search all the firect flights from Departure to arrival airport and save them
         */
        var browserRoundTripDirectCheckInNoMiddle = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });
        var searchDirectCheckInResult = searchDirectFlightCheckInAndSave(from, to, browserRoundTripDirectCheckInNoMiddle, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance);

        searchDirectCheckInResult.then((responses) => {
          console.log('Direct Flight from departure to destination searched!')
          console.log('-------------------------------------------------------------------------------')
          browserRoundTripDirectCheckInNoMiddle.close();
        }).catch(function (err) {
          console.log(err.message); // some coding error in handling happened
        });

        /**(RoundTrip)
         * If there are no middle airport search all the direct flights from arrival to departure airport and save them 
         */
        var browserRoundTripDirectCheckOutNoMiddle = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });
        var searchDirectCheckOutResult = searchDirectFlightAndSave(from, to, browserRoundTripDirectCheckOutNoMiddle, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance);
        searchDirectCheckOutResult.then((responses) => {
          console.log("Direct flight from destination to departure searched!")
          console.log("--------------------------------------------------------------------------------------")
          browserRoundTripDirectCheckOutNoMiddle.close();
          /**(Round trip)
           * Once the round trip direct flights is searched update the flight with flightSearched:'yes' so
           * stop loading icon at the result page and show the final results
           */
          var query = {
            'fromIata': from,
            'toIata': to,
            'checkin': check_in,
            'checkout': check_out,
            'adultNum': adult_num,
            'childNum': child_num,
            'typeOfFlight': flight_type,
            'airportSize': airport_size,
            'tripDistance': trip_distance,
            'flightSearched': 'no'
          };

          FlightInfos.findOneAndUpdate(query, {
            flightSearched: 'yes'
          }, {
            upsert: true
          }, function (error, doc) {
            if (error) {
              console.log('Error Updating infos')
            } else {
              console.log("Tickets of Direct Flights Searched Successfully!")
            }
          });
        }).catch(function (err) {
          console.log(err.message); // some coding error in handling happened
        });


      } else {
        /**(OneWay trip)
         * Search all the firect flights from Departure to arrival airport and save them
         */
        var browserOneWayDirectCheckInNoMiddle = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          headless: true
        });
        var searchDirectCheckInResult = searchDirectFlightCheckInAndSave(from, to, browserOneWayDirectCheckInNoMiddle, check_in, check_out, adult_num, child_num, flight_type, airport_size, trip_distance);

        searchDirectCheckInResult.then((responses) => {
          console.log('Direct Flight searched!')
          console.log('-------------------------------------------------------------------------------')
          browserOneWayDirectCheckInNoMiddle.close();

          /**(OneWaw trip)
           * Once the oneWay trip is searched update the flight with flightSearched:'yes' so
           * stop loading icon at the result page and show the final results
           */
          var query = {
            'fromIata': from,
            'toIata': to,
            'checkin': check_in,
            'checkout': check_out,
            'adultNum': adult_num,
            'childNum': child_num,
            'typeOfFlight': flight_type,
            'airportSize': airport_size,
            'tripDistance': trip_distance,
            'flightSearched': 'no'
          };

          FlightInfos.findOneAndUpdate(query, {
            flightSearched: 'yes'
          }, {
            upsert: true
          }, function (error, doc) {
            if (error) {
              console.log('Error Updating infos')
            } else {
              console.log("Tickets Searched Successfully!")
            }
          });


        }).catch(function (err) {
          console.log(err.message); // some coding error in handling happened
        });
      }
    }

  });

  /**(Communication between the 2 servers (nodeJS and Tomcat))
   * Redirect to result page with all the necessary parameters and show the results only among them
   */
  res.redirect(`${process.env.REDIRECT_URL}/#!/allflights?from=${from}&to=${to}&checkin=${check_in}&checkout=${check_out}&typeOfFlight=${flight_type}&adultNum=${adult_num}&childNum=${child_num}&airportSize=${airport_size}&tripDistance=${trip_distance}`);


});
module.exports = router;