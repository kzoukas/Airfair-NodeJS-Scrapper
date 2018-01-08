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
function searchToMiddleAndSave(rows, from, browser, check_in, adult_num, child_num) {

  var searches = rows.map(async (row) => {
    var toMiddle = row.iata;

    var page = await browser.newPage();
    await page.goto(
      `https://tp24.airtickets.com/results#search/${from}/${toMiddle}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
        waitUntil: 'networkidle',
        timeout: 90000
      })
    return new Promise(async (resolve, reject) => {
      console.log(`Searching... from: ${from}, to: ${toMiddle}`)
      let pageReady = false
      while (!pageReady) {
        pageReady = await page.evaluate(resultsReady)
        await wait(1000)
        await page.evaluate(scrollPage)
        await wait(1000)
        await page.evaluate(scrollPage)
      }
      var resultsNum = await page.evaluate(countResults)
      console.log(`Finished loading from: ${from}, to: ${toMiddle}, found ${resultsNum}`)
      if (resultsNum) {
        console.log("Getting data...")
        var data = await page.evaluate(computeResults);
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
      resolve(true)
    })
  })
  return searches;

}
function searchFromMiddleAndSave(rows, to, browser, check_in, adult_num, child_num) {

  var searches = rows.map(async (row) => {
    var fromMiddle = row;

    var page = await browser.newPage();
    await page.goto(
      `https://tp24.airtickets.com/results#search/${fromMiddle}/${to}/obDate/${check_in}/ibDate/${check_in}/isRoundtrip/0/passengersAdult/${adult_num}/passengersChild/${child_num}/passengersInfant/0/directFlightsOnly/1/extendedDates/0`, {
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
      }
      var resultsNum = await page.evaluate(countResults)
      console.log(`Finished loading from: ${fromMiddle}, to: ${to}, found ${resultsNum}`)
      if (resultsNum) {
        console.log("Getting data...")
        var data = await page.evaluate(computeResults);
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
      resolve(true)
    })
  })
  return searches;

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
    "$or": [
      { "name": { "$regex": search1 } },
      { "iata": { "$regex": search1 } }]
  }, function (err, rows, fields) {
    if (err) throw err;
    res.end(JSON.stringify(rows));

  });

});

router.post('/allFlightss', function (req, res, next) {

  var flightType = req.body.flightType;
  console.log(flightType);

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

  var distance = getDistanceFromLatLonInKm(latitudeFrom, longitudeFrom, latitudeTo, longitudeTo);
  var middleDistance = distance / 2;
  const longitudeMiddle = (longitudeFrom + longitudeTo) / 2;
  const latitudeMiddle = (latitudeFrom + latitudeTo) / 2;

  

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
    var browser = await puppeteer.launch();
    //var browser = await puppeteer.launch();
    var searches = searchToMiddleAndSave(rows, from, browser, check_in, adult_num, child_num);
    if (flightType == "roundTrip") {
      var browser = await puppeteer.launch();
      //var browser = await puppeteer.launch();
      var searches2 = searchToMiddleAndSave(rows, to, browser, check_out, adult_num, child_num);
      Promise.all(searches2).then((responses) => {
        console.log('Roundtrip: All searches to middle airports finished!')
        console.log('-------------------------------------------------------------------------------')

        Flight.distinct('toIata', async (err, rows, fields) => {
          if (err) throw err;
          res.end(JSON.stringify(rows));
          console.log('Found ' + rows.length + ' middle airports on database');

          var browser = await puppeteer.launch();
          var searches4 = searchFromMiddleAndSave(rows, from, browser, check_out, adult_num, child_num);
          Promise.all(searches4).then((responses) => {
            console.log('Roundtrip: All searches from middle airports to destination finished!')
            console.log('-------------------------------------------------------------------------------')

          })
        });

      });

    }
    Promise.all(searches).then((responses) => {
      console.log('All searches to middle airports finished!')
      console.log('-------------------------------------------------------------------------------')

      Flight.distinct('toIata', async(err, rows, fields) => {
        if (err) throw err;
        res.end(JSON.stringify(rows));
        console.log('Found ' + rows.length + ' middle airports on database');

        var browser = await puppeteer.launch();
        var searches3 = searchFromMiddleAndSave(rows, to, browser, check_in, adult_num, child_num);
        Promise.all(searches3).then((responses) => {
          console.log('All searches from middle airports to destination finished!')
          console.log('-------------------------------------------------------------------------------')

        })
      });

    });
   
    var browser = await puppeteer.launch();
    //searchDirectFlightAndSave(from, to, browser, check_in, adult_num, child_num);
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
    console.log("Direct flight searched!")
    console.log("--------------------------------------------------------------------------------------")

    



  });

  res.redirect("http://localhost:8080/#!/allflights");

});
module.exports = router;