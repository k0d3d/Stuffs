// Declare app level module which depends on filters, and services

var app = angular.module('argetni', ['ui.bootstrap']);
app.config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: '/home/index',
      controller: 'indexController'
    }).
    when('/items/list', {
      controller: 'itemsController',
      templateUrl: '/items/index'
    }).
    when('/items/add', {
      controller: 'itemsController',
      templateUrl: '/items/new'
    }).
    when('/dashboard/order',{
      controller: 'OrdersController',
      templateUrl: '/orders/add'
    }).
    when('/orders',{
      controller: 'OrdersController',
      templateUrl: '/orders/all'
    }).
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});