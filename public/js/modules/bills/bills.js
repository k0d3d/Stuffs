/**
*  Bills Module
*
* Description
*/
angular.module('bills', ['ui.bootstrap'])

.config(['$routeProvider', function ($routeProvider){
  $routeProvider.when('/bills', {templateUrl: '/bills/index', controller: 'billsController'});
}])
.controller('billsController', function itemIndexController($scope, $location, $routeParams,billsService){
    function init(){
      billsService.bills(function(f){
        $scope.bills = f;
      });
    }
    init();
})
.factory('billsService', function($http){
  var i = {};

  i.bills =  function(callback){
      console.log('ehy');
      $http.get('/api/bills').success(callback);
    };
  return i;
})