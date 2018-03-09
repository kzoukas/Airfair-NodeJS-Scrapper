var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var file_importer = require('./test.js')
const puppeteer = require('puppeteer');
const Models = require('./mongoModels');

const Flight = Models.Flight;
const LiveSearch = Models.LiveSearch;
const FlightInfos = Models.FlightInfos;



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
  /* return document.querySelector(".result-container")?document.querySelector(".result-container").children:0;  */
  if (document.querySelector(".segment-item")) {
    return document.querySelectorAll(".segment-item").length;
  } else {
    return 0;

  }
}

function resultsReady() {
  return !document.querySelector('.loader-line-mask')
}
function wrapComputeResults() {
  let data = [];
  // const ee=from;
  // const eee=to;
  var results = Array.from(document.querySelectorAll(".result-container"));
  console.log('----------------------------------------------------------')
  console.log(results)
  // return results.map((r) => {
    for(var result of results){

      var infos = result.querySelectorAll('.connection-info span');
      // let flightSearchFromIata=ee;
      // let flightSearchToIata=eee;
      let price= result.querySelector(".result-widget-price").textContent.substr(1).replace(',','');
      let fromCompany= infos[3].textContent.trim();
      //toCompany: infos[5].textContent.trim(),
      let fromDate= infos[4].textContent.trim();
      let toDate= infos[4].textContent.trim();
        //toDate: infos[6].textContent.trim(),

      var segments =Array.from(result.querySelectorAll(".segment-item"));
      var segmentsDetails =Array.from(result.querySelectorAll(".segment-details"));
      for(i=0;i<segments.length;i++){

      var times = segments[i].querySelectorAll('.h4');
      var town = segments[i].querySelectorAll('.d-none');
      var iata = segments[i].querySelectorAll('.d-block');
      
        
        let fromDepartureTime= times[0].textContent.trim();
        let fromArrivalTime = times[1].textContent.trim();
        let fromTown= town[1].textContent.trim();
        let fromIata= iata[0].textContent.trim();
        let toTown= town[3].textContent.trim();
        let toIata= iata[1].textContent.trim();
        let duration = segments[i].querySelector('.duration').textContent.trim(); 
        let station = segments[i].querySelector('.text-muted').textContent.trim(); 
        let airlineImgSrc=segments[i].querySelector('.airline-logo').getAttribute('src');
      
        // toDepartureTime: times[2].textContent.trim(),
        // toArrivalTime: times[3].textContent.trim(),
        
        if(station=="Direct"){
            data.push({fromDepartureTime,fromArrivalTime,duration,station,fromTown,fromIata,toTown,toIata,price,fromCompany,airlineImgSrc,fromDate,toDate});
        }else if (station=="1 Stop"){
          
          var lastTime = segmentsDetails[i].querySelectorAll('.grid-item-1-4 .h4');
          var stationTimes = segmentsDetails[i].querySelectorAll('.grid-item-1-4 .h5');
          var stationDates = segmentsDetails[i].querySelectorAll('.grid-item-1-4 .text-small');
          var stationTownDiv = segmentsDetails[i].querySelectorAll('.result-details-arr p');

          let stationArrivalTime=stationTimes[0].textContent.trim();
          let stationArrivalDate=stationDates[1].textContent.trim();
          let waitingTime=segmentsDetails[i].querySelector('.bg-overlay-light strong').textContent.trim();
          let stationDepTime=stationTimes[1].textContent.trim();
          let stationDepDate=stationDates[2].textContent.trim();
          let stationTown = stationTownDiv[0].textContent.trim();
          let toDate=stationDates[3].textContent.trim();
          let toTime=lastTime[1].textContent.trim();
          data.push({fromDepartureTime,fromArrivalTime,duration,station,fromTown,fromIata,stationTown,stationArrivalTime,stationArrivalDate,waitingTime,stationDepTime,stationDepDate,toTown,toIata,price,fromCompany,airlineImgSrc,fromDate,toDate,toTime});
        }else{

        }
      }
    }
    return data;
   
 }


 function searchToMiddleAndSave(rows, from,to, browser, check_in, adult_num, child_num) {

  var searches = rows.map(async (row) => {
    var toMiddle = row.iata;

    var page = await browser.newPage();
    await page.goto(
      `https://tp24.airtickets.com/results#search/${from}/${toMiddle}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/0/extendedDates/0`, {
        waitUntil: 'networkidle',
        timeout: 90000
      })
    return new Promise(async (resolve, reject) => {
      console.log(`Searching... from: ${from}, to: ${toMiddle}`)
      let pageReady = false
      while (!pageReady) {
        await wait(3000)
        pageReady = await page.evaluate(resultsReady)
        
        await wait(1000)
        await page.evaluate(scrollPage)
        await wait(1000)
        await page.evaluate(scrollPage)
        await wait(1000)
        await page.evaluate(scrollPage)
      }
      console.log(pageReady + from +"to"+ toMiddle)
      if (pageReady) {
        var resultsNum = await page.evaluate(countResults)
        console.log(`Finished loading from: ${from}, to: ${toMiddle}, found ${resultsNum}`)
        if (resultsNum) {
          console.log("Getting data...")
          var data = await page.evaluate(wrapComputeResults);
          
          await Flight.insertMany(data, function (error, docs) {
            if (error) {
              console.log('Error inserting:', error)
            } else {
              console.log("Saving done! from " + from + " to " + toMiddle)
            }
          });
        } else {
          console.log("No flights  from " + from + " to " + toMiddle)
        }
      }
      resolve(true)
    })
  })
  return searches;

}
function searchFromMiddleAndSave(rows,from, to, browser, check_in, adult_num, child_num) {

  var searches = rows.map(async (row) => {
    var fromMiddle = row;

    var page = await browser.newPage();
    await page.goto(
      `https://tp24.airtickets.com/results#search/${fromMiddle}/${to}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/0/extendedDates/0`, {
        waitUntil: 'networkidle',
        timeout: 90000
      })
    return new Promise(async (resolve, reject) => {
      console.log(`Searching... from: ${fromMiddle}, to: ${to}`)
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
      if (pageReady) {
        var resultsNum = await page.evaluate(countResults)
        console.log(`Finished loading from: ${fromMiddle}, to: ${to}, found ${resultsNum}`)
        if (resultsNum) {
          console.log("Getting data...")

          var data = await page.evaluate(wrapComputeResults);

          await Flight.insertMany(data, function (error, docs) {
            if (error) {
              console.log('Error inserting:', error)
            } else {
              console.log("Saving done! from " + fromMiddle + " to " + to)
            }
          });
        } else {
          console.log("No flights  from " + fromMiddle + " to " + to)
        }
      }
      resolve(true)
    })
  })
  return searches;

}
async function searchDirectFlightAndSave(from, to, browser, check_out, adult_num, child_num) {

  var page = await browser.newPage();
  await page.goto(
    `https://tp24.airtickets.com/results#search/${to}/${from}/obDate/${check_out}/ibDate/${check_out}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
      waitUntil: 'networkidle',
      timeout: 90000
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
  if (resultsNum) {
    console.log("Getting data...")
    var data = await page.evaluate(wrapComputeResults);
    await Flight.insertMany(data, function (error, docs) {
      if (error) {
        console.log('Error inserting:', error)
      } else {
        console.log("Saving done! from " + to + " to " + from)
      }
    });
  } else {
    console.log("No flights  from " + to + " to " + from)
  }
  console.log("Direct flight from destination to departure searched!")
  console.log("--------------------------------------------------------------------------------------")
}
async function searchDirectFlightCheckInAndSave(from, to, browser, check_in, adult_num, child_num) {
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
    await wait(1000)
  }
  var resultsNum = await page.evaluate(countResults)
  console.log(`Finished loading from: ${from}, to: ${to}, found ${resultsNum}`)
  if (resultsNum) {
    console.log("Getting data...")
    // var data = await page.evaluate(wrapComputeResults(from, to));
    var data = await page.evaluate(wrapComputeResults);
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
  console.log("Direct flight from departure to destination searched!")
  console.log("--------------------------------------------------------------------------------------")

}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});
router.get('/load/:_search', function (req, res) {
  var search1 = req.params._search;
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

  var flightType = req.body.flightType;
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
  console.log(check_in)
  console.log(check_out)

  var longitudeFrom = parseInt(fromDestSplited[2].trim());
  var latitudeFrom = parseInt(fromDestSplited[3].trim());
  var longitudeTo = parseInt(toDestSplited[2].trim());
  var latitudeTo = parseInt(toDestSplited[3].trim());

  const child_num = req.body.select_child_num;
  const adult_num = req.body.select_adult_num;

  var distance = getDistanceFromLatLonInKm(latitudeFrom, longitudeFrom, latitudeTo, longitudeTo);
  var middleDistance = distance / 2;
  const longitudeMiddle = (longitudeFrom + longitudeTo) / 2;
  const latitudeMiddle = (latitudeFrom + latitudeTo) / 2;

  var infos = {
   
    fromIata: from,
    toIata: to,
    fromDate: check_in,
    toDate: check_out,
    typeOfFlight: flightType,
    flightSearched: "no",

  };
  FlightInfos.deleteMany(function (error) {
    if (error) {
      console.log('Error deleting infos')
    } else {
      console.log("Deleting infos done!")
    }
  });

  FlightInfos.insertMany(infos, function (error) {
    if (error) {
      console.log('Error inserting infos:', error)
    } else {
      console.log("Saving infos done!")
    }
  });



  Flight.deleteMany(function (error) {
    if (error) {
      console.log('Error deleting:')
    } else {
      console.log("Deleting done!")
    }
  });
  LiveSearch.find({
    location: {
      $geoWithin: {
        $center: [
          [longitudeMiddle, latitudeMiddle], middleDistance / 100     // 1 degree is 111 km so approximately 100 is good
        ]
      }
    },
    size: "large",
    name: {
      $ne: fromName
    }
  }, async (err, rows, fields) => {
    if (err) throw err;
    res.end(JSON.stringify(rows));
    var middleAirports = rows.length;
    console.log('Found ' + middleAirports + ' middle airports');

    var browser = await puppeteer.launch({
      headless: false
    });
    if (middleAirports != 0) {
      var searches = searchToMiddleAndSave(rows, from,to, browser, check_in, adult_num, child_num);
      if (flightType == "roundTrip") {


        var browser = await puppeteer.launch({
          headless: false
        });

        var searches2 = searchToMiddleAndSave(rows, to,from, browser, check_out, adult_num, child_num);
        Promise.all(searches2).then((responses) => {
          console.log('Roundtrip: All searches to middle airports for check out finished!')
          console.log('-------------------------------------------------------------------------------')

          Flight.distinct('toIata', async (err, rows, fields) => {
            res.end(JSON.stringify(rows));
            console.log('Found ' + rows.length + ' middle airports for check out on database');

            var browser = await puppeteer.launch({
              headless: false
            });
            var searches4 = searchFromMiddleAndSave(rows, to,from, browser, check_out, adult_num, child_num);
            Promise.all(searches4).then((responses) => {
              console.log('Roundtrip: All searches from middle airports to  for check out finished!')
              console.log('-------------------------------------------------------------------------------')

            })
          });

        });

        var browser = await puppeteer.launch({
          headless: false
        });
        searchDirectFlightAndSave( to,from, browser, check_out, adult_num, child_num);

      }
      Promise.all(searches).then((responses) => {
        console.log('All searches to middle airports for check in finished!')
        console.log('-------------------------------------------------------------------------------')
        Flight.distinct('toIata', async (err, rows, fields) => {
          if (err) throw err;
          res.end(JSON.stringify(rows));
          console.log('Found ' + rows.length + ' middle airports for check in on database');

          var browser = await puppeteer.launch({
            headless: false
          });
          var searches3 = searchFromMiddleAndSave(rows,from, to, browser, check_in, adult_num, child_num);
          Promise.all(searches3).then((responses) => {
            console.log('All searches from middle airports to destination for check in finished!')
            console.log('-------------------------------------------------------------------------------')
            var query = {'fromIata':from,
            'toIata':to,
            'fromDate':check_in,
            'toDate':check_out,
            'typeOfFlight':flightType,
          'flightSearched':'no'};
          
          FlightInfos.findOneAndUpdate(query, {flightSearched:'yes'}, {upsert:true}, function(error, doc){
            if (error) {
              console.log('Error deleting infos')
            } else {
              console.log("Deleting infos done!")
            }
          });


          })
        });

      });
    } else {
      if (flightType == "roundTrip") {
        var browser = await puppeteer.launch({
          headless: false
        });
        searchDirectFlightAndSave( to,from, browser, check_out, adult_num, child_num);
        
      }
    }

    var browser = await puppeteer.launch({
      headless: false
    });
    searchDirectFlightCheckInAndSave(from, to, browser, check_in, adult_num, child_num)
    
  });

  res.redirect(`http://localhost:8080/#!/allflights?from=${from}&to=${to}&checkIn=${check_in}&typeOfFlight=${flightType}&adults=${adult_num}&childs=${child_num}`);

  
});
module.exports = router;