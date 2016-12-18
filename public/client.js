
var globalList = [];   // [{location: '93101', temperature:200}, {location: '93001', temperature:-135}, {location: '91301', temperature: 157}];

var app = angular.module('WhimsicalWeatherAngularApp', ['ngRoute']);
// location
app.config(function($routeProvider) {
  $routeProvider
    .when('/lookup', {
      template: '<div id="lookup-section" ng-controller="AddWeatherReportController"><input type="search" id="citystatezip" name="citystatezip" accesskey="t z 0" placeholder="93101" pattern="[0-9]{3}" title="A zip code composed of 5 digits" autofocus required /><button id="locationbutton" ng-click="addLocation();" tabindex="-1">GO</button><br /><br /></div>',
      // templateUrl : 'public/test1.html',
      controller  : 'AddWeatherReportController'
    })
    .when('/locations', {
      // template: 'Testing TEST2',
      templateUrl : 'locations.html',
      // controller  : 'WeatherController'
    });
});


app.controller('AddWeatherReportController', function($scope, $http) {
  // alert("Starting AddWeatherReportController ... ");
  $("a#lookup-link").css("visibility", "hidden");

  $scope.addLocation= function() {
    $scope.data = {};
    console.log("addLocation starting ...");
    var location = document.getElementById('citystatezip').value;
    document.getElementById('citystatezip').value = '';
    console.log("location=|" + location + "|"); 
    var responsePromise = $http.get("/locationLookupByZip?l=" + location);
    responsePromise.success(function(data, status, headers, config) {
        console.log("promise success");
        $scope.myDataTemp = data.temp;
        // alert("Found temp from server: " + $scope.myDataTemp);
        /// document.getElementById("lookup-section").style.visibility = 'hidden';
        if($scope.myDataTemp != -1) {
            globalList.unshift({location: location, temperature: $scope.myDataTemp, city: data.city, state: data.state });
        } else {
            console.log("Not adding - value is -1");
        }
        // alert("globalList = " + JSON.stringify(globalList));
    });
    // "http://api.wunderground.com/api/exyz123zbcxyz128/conditions/q/93001.json
  }
});


app.controller('WeatherController', function($scope, $sce) {
  console.log("WeatherController - Starting ...");

  $scope.list = globalList;
  $scope.helloMessage = "Check out current city weather temperatures";

  $(function() {
    $.get('/stuff', appendToList);

    function appendToList(stuff) {
      console.log("append to list - stuff = " + stuff);
      var list = [];
      for(var i in stuff) {
        list.push($('<li>', {text: $sce.trustAsHtml(stuff[i]) }));
      }
      $('.block-list').append(list);
    }
  });
});


