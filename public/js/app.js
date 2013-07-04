'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'home/index',
      controller: 'indexController'
    }).
    when('/items/create', {
    }).
    when('/orders/new',{
      controller: 'newOrderCtrl'
    })
  $locationProvider.html5Mode(true);
});
