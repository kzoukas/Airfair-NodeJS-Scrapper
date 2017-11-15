// app.controller('main_control', function($scope, $http) {
//   load_demos();
//
//   function load_demos() {
//
//     $http.get("http://localhost:3000/load").then(function(data) {
//       $scope.loaded_demos = data;
//     })
//
//   }
//
// });
app.controller('main_control', function($scope, $http) {
  $http.get('http://localhost:3000/load')
    .then(function(response) {

      var data = response.data;


      $scope.loaded_demos = data;
      console.log(data);
    });
});
