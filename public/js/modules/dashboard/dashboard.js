/**
*  Module
*
* Description
*/
angular.module('dashboard', [])

.config(['$stateProvider', function ($stateProvider){
	$stateProvider
    .state('dashboard', {
      url:'/',
      templateUrl: '/home/index',
      controller: 'dashboardIndexController'
    });
}])
.controller('dashboardIndexController', ['$scope', 'stockService', 'ordersService', function($scope,stockService,ordersService){
	stockService.count(function(data){
		$scope.itemsCount = data;
	});
	ordersService.count(function(data){
		$scope.ordersCount = data;
	});
}])
.controller('dashboardOrderController', function(){

});
