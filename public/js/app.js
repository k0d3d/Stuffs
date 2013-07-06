'use strict';

// Declare app level module which depends on filters, and services

angular.module('argetni', [
  'argetni.controllers',
  'argetni.filters',
  'argetni.services',
  'argetni.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: '/home/index',
      controller: 'indexController'
    }).
    when('/items/list', {
      templateUrl: '/items/index',
      controller: 'itemsListController'      
    }).    
    when('/items/create', {
    }).
    when('/orders/new',{
      controller: 'newOrderCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});
