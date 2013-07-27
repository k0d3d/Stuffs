// Declare app level module which depends on filters, and services

angular.module('integraApp', [
  'ui.bootstrap',
  'order',
  'stock',
  'item',
  'dashboard'
  ]);
angular.module('integraApp').config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});

angular.module('integraApp').controller('MainController', function($scope, $http){
    $scope.arhref = function(arhrefVal){
      window.location.href=arhrefVal;
    }; 
});