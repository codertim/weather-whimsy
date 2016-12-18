

var http = require('http'), 
    url  = require('url'),
    fs   = require('fs'),
    path = require('path');
var port = 3137;
var EventEmitter = require('events').EventEmitter;
var logger = new EventEmitter();
var httpResponse = undefined;
var weatherApiCredentials = undefined;


logger.on('error', function(message) {
    console.log("ERROR: " + message);
});

console.log("Starting ...");

// lookupLocation('93101');   TODO: delete me


function getWeatherApiCredentials(err, credentialsFile) {
    if(err) {
        console.log("Error finding weather api credentials. \nDone.");
        process.exit();
        throw err;
    }

    weatherApiCredentials = credentialsFile.toString().trim();
    // console.log("weather api credentials = |" + weatherApiCredentials + "|");
}


fs.readFile('../weatherapi.txt', getWeatherApiCredentials);


fs.readFile('./public/index.html', function(err, htmlFile) {
  if(err) {
    throw err;
  }

  http.createServer(function(request, response) {
    var pathname = url.parse(request.url).pathname;
    var extName = path.extname(pathname);
    console.log("URL parse for current request:  pathname=|" + pathname + "|   request.url=|" + request.url + "|   extname=|" + extName + "|");

    // handling JavaScript files: http://ericsowell.com/blog/2011/5/6/serving-static-files-from-node-js
    if(extName === ".js") {
        console.log("Serving JavaScript request");
        fs.exists('./public' + pathname, function(doesExist) {
            if(doesExist) {
                fs.readFile('./public' + pathname, function(err, javascriptFile) {
                    response.writeHead(200, {'Content-Type': 'text/javascript'});
                    response.write(javascriptFile);
                    response.end();
                });
            } else {
                response.writeHead(404);
                response.end();
            }
        });
    } else if(extName === ".html") {
        console.log("Serving html request");
        path.exists('./public' + pathname, function(doesExist) {
            if(doesExist) {
                console.log("  html path exists");
                fs.readFile('./public' + pathname, function(err, htmlFile) {
                    console.log("  html read file: " + htmlFile);
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.write(htmlFile);
                    response.end();
                });
            } else {
                console.log("  html path does NOT exist");
                response.writeHead(404);
                response.end();
            }
        });
    } else if(pathname === '/') {
        console.log("Serving root path");
        response.writeHead(200, {'Content-Type': 'text/html'});
        // response.write("Hello There!!!");
        response.write(htmlFile);
        response.end();
    } else if(pathname === '/stuff') {
        console.log("GOT HERE 4a");
        response.writeHead(200);
        response.write("Hello Stuff!!!");
        response.end();
    } else if(pathname === '/locationLookupByZip') {
        console.log("GOT HERE 41");
        var queryData = url.parse(request.url, true).query;
        console.log("GOT HERE 42 - queryData=" + queryData);
        // response.writeHead(200, {'Content-Type': 'application/json'});
        console.log("GOT HERE 43 - queryData.l=" + queryData.l);
        var tempForZip = zipLocationLookup(queryData.l);
        // response.write(JSON.stringify({temp: tempForZip}));
        // response.end();
        httpResponse = response;
    } else {
        response.writeHead(404);
        response.write("Not found");
        response.end(); 
    }
  }).listen(port, function() {
    console.log("Listening on port=" + port);
  });
});


// ajax request from web page
function zipLocationLookup(zip) {
  console.log("zipLocationLookup - zip = " + zip);
  var temp = lookupLocation(zip);   // call api
  console.log("zipLocationLookup - temp = " + temp);
  return temp;
}


function lookupLocation(zip) {
    var http = require('http');
    var magicNum = weatherApiCredentials;    // e.g. 'e81.............'

    // http://api.wunderground.com/api/e812679dbe514838/conditions/q/93001.json
    // The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
    var options = {
        host: 'api.wunderground.com',
        path: '/api/' + magicNum + '/conditions/q/' + zip + '.json'
    };

    var callback = function(response) {
        var str = '';
        console.log("Startnig http request callback");

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            console.log('Response from weather lookup:\n' + str);
            locationJson = JSON.parse(str);
            console.log("\n\n\JSON response - current_observation=" + locationJson.current_observation);

            if(httpResponse != undefined) {
                if(locationJson != undefined && locationJson.current_observation != undefined) { 
                    // location found
                    console.log("\n\n\JSON response - temp=" + locationJson.current_observation.temp_f);
                    httpResponse.writeHead(200, {'Content-Type': 'application/json'});
                    httpResponse.write(JSON.stringify({temp: locationJson.current_observation.temp_f}));
                    httpResponse.end();
                } else {
                    // location not found
                    httpResponse.writeHead(200, {'Content-Type':'application/json'});
                    httpResponse.write(JSON.stringify({temp: -1}));
                    httpResponse.end();
                }
            }
        });
    }

    console.log("Sending http request ...");
    http.request(options, callback).end();
}



