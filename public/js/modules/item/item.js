/**
*  item Module
*
* Description
*/
angular.module('item', [])

.config(['$routeProvider', function ($routeProvider){
	$routeProvider.when('/items', {templateUrl: '/items/index', controller: 'itemIndexController'})
  .when('/items/add', {templateUrl: '/items/new', controller: 'itemAddController'})
	.when('/items/points', {templateUrl: '/items/stockdown', controller: 'itemStockController'});
}])
.controller('itemIndexController', function itemIndexController($scope, $location, $routeParams,itemsService){
    $scope.summary = {};
    $scope.form = {};
    $scope.itemsList = {};
    function init(){
      itemsService.items(function(data){
        $scope.itemsList = sortItems(data);
        $scope.enabledIndex = Object.keys($scope.itemsList);
      });
    }
    init();
    function sortItems(data){
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
    $scope.indexes =  atoz();
    $scope.summaryDo =  function (id){
      itemsService.summary(id,function(res){
        $scope.summary = res;
        //$scope.summary.supplierName = res.itemSupplier[0]['supplierName'];
        $scope.summary.supplierName = 'Kilo';
        $scope.spmenu = 'cbp-spmenu-open';
      });
    };
})
.controller('itemAddController', ['$scope','$location','$routeParams','itemsService',function itemAddController ($scope, $location, $routeParams,$dialog,itemsService){
  $scope.form = {};
  $scope.modal ={};
  $scope.saveitem = function(){
    $scope.saveButtonText = 'saving';
    itemsService.save($scope.form, function(res){
      $scope.saveButtonText = 'SAVED';
    });
  };
}])
.controller('itemStockController',['$scope','$location','$routeParams','itemsService',function itemAddController ($scope, $location, $routeParams,$dialog,itemsService){
  $scope.toggleModal =  function(){
    $scope.modalstate = ! $scope.modalstate;
  };
}])
.factory('itemsService', function($http){
  var i = {};

  i.items =  function(callback){
      $http.get('/api/items/listAll').success(callback);
    };

  i.summary = function(id,callback){
      $http.get('/api/items/listOne/'+id+'/quick').success(callback);
    };
  i.save =  function(post, callback){
      $http.post('/api/items', {item: post}).success(function(status, response){
        callback(response);
      }).
      error(function(status, response){
        console.log(status);
      });
    };
  i.count =  function(callback){
    $http.get('/api/items/count').
    success(function(data,status){
      callback(data);
    });
  };
  return i;
})
.directive('newPointModal', function(){
    function link($scope, element, attributes){
      var expression = attributes.newPointModal;
      $scope.modalstate = false;
      if(! $scope.$eval(expression)){
        $('#modal-create-stock-down').modal('hide');
      }
      $scope.$watch(expression,
        function(newValue, oldValue){
          if(newValue === oldValue){
            return;
          }
          if(newValue){
             $('#modal-create-stock-down').modal('show');
           }else{
             $('#modal-create-stock-down').modal('hide');
           }
        });
    }
    return {
      link: link
    };
})
.filter('stockclass',function(){
    return function(cs, bp){
      if(cs === 0){
        return "empty-stock";
      }else if(cs <= bp){
        return "low-stock";
      }else{
        return "good-stock";
      }
    };
  })
.filter('indexclass',function(){
    return function (enabledIndex, index){
      if($.inArray(index, enabledIndex) > -1){
        return "active";
      }else{
        return "inactive";
      }
    };
  });