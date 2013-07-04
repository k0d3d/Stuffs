'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

    // $http({
    //   method: 'GET',
    //   url: '/api/name'
    // }).
    // success(function (data, status, headers, config) {
    //   $scope.name = data.name;
    // }).
    // error(function (data, status, headers, config) {
    //   $scope.name = 'Error!'
    // });
    $scope.arhref = function(arhrefVal){
     window.location.href=arhrefVal;
    }
    $scope.form = {};
    $scope.submitPost = function () {
      console.log(this);
      $http.post('/orders/create', $scope.form).
        success(function(data) {
          $location.path('/');
        });
    };    

  }).
  controller('indexController', function ($scope) {
    // write Ctrl here

  }).
  controller('addCtrl', function ($scope) {
    // write Ctrl here

  }).
  controller('viewCtrl', function ($scope) {
    // write Ctrl here
  }).
  controller('newOrderCtrl', function ($scope, $http, $location) {

  }).  
  controller('editCtrl', function ($scope, $http, $location, $routeParams) {
    $scope.form = {};
    $http.get('/api/post/' + $routeParams.id).
      success(function(data) {
        $scope.form = data.post;
      });

    $scope.editPost = function () {
      $http.put('/api/post/' + $routeParams.id, $scope.form).
        success(function(data) {
          $location.url('/readPost/' + $routeParams.id);
        });
    };

  }).
  controller('summarydataCtrl',function ($scope){

  })
