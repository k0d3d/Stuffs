(function(){

"use strict";

/* Controllers */

angular.module('argetni.controllers', []).
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
    };
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
  controller('itemsListController', function ($scope, $http, $location, $routeParams) {
    function sortItems(data, index){
      var o = {};
      data.forEach(function(ele,index,arr){
        var fchar = ele.itemName.split("");
        if(o[fchar[0]] ===  undefined){
          o[fchar[0]] = [];
        }
        o[fchar[0]].push(ele);
      });
      return o;
    }
    function atoz(){
      var a = [], i = 65;
      for (i;i<=90;i++){
        a[a.length] = String.fromCharCode(i);
      }
      return a;
    }
    $scope.stockFilters = [{
      "value": "",
      "text": "All Stock"
    },{
      "value": "good-stock",
      "text": "Good Stock"
    },{
      "value": "low-stock",
      "text": "Low Stock"
    },{
      "value": "empty-stock",
      "text": "Empty Stock"
    }];
    $scope.itemsList = {};
    $http.get('/items/listAll').
      success(function(data) {
        $scope.itemsList = sortItems(data);
        $scope.enabledIndex = Object.keys($scope.itemsList);
      });
    $scope.indexes =  atoz();
    $scope.$on('Panorama', function(e){
      $('.panorama').panorama({
         //nicescroll: false,
         showscrollbuttons: false,
         keyboard: true,
         parallax: false
      });
    });
    $scope.summaryDo =  function (id){
      $http.get('/items/listOne/'+id+'/quick').success(function(a){
        $scope.summary = a;
      });
    };
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
}());