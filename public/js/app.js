// Declare app level module which depends on filters, and services

angular.module('integraApp', [
  'ui.bootstrap',
  'order',
  'stock',
  'item',
  'dashboard',
  'directives'
  ]);
angular.module('integraApp').config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});

angular.module('integraApp').controller('MainController', function($scope, $http, $location){
  $scope.modal ={};
  function href(target){
    $location.path(target);
  }
  function backBtn(){
    history.back();
  }
  $scope.commons = {
    href : href,
    backBtn: backBtn
  };
});