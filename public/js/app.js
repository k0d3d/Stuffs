// Declare app level module which depends on filters, and services

var app = angular.module('argetni', ['ui.bootstrap']);
app.config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: '/home/index',
      controller: 'indexController'
    }).
    when('/items/list', {
      controller: 'itemsListController',
      templateUrl: '/items/index'
    }).
    when('/items/create', {
    }).
    when('/orders',{
      controller: 'newOrderCtrl',
      templateUrl: '/orders/add'
    }).
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});