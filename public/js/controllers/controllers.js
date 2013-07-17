/* Controllers */


  app.controller('AppCtrl', function ($scope, $http) {

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
      $http.post('/orders/create', $scope.form).
        success(function(data) {
          $location.path('/');
        });
    };
  });
  app.controller('indexController', function ($scope) {
    // write Ctrl here

  });
  app.controller('itemsListController', function ($scope, $http, $location, $routeParams,itemsService) {
    $scope.itemsList = {};
    $scope.summary = {};
    init();
    function init(){
      itemsService.items(function(data){
        $scope.itemsList = sortItems(data);
        $scope.enabledIndex = Object.keys($scope.itemsList);
      });
    }
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
        $scope.summary.supplierName = res.itemSupplier[0]['supplierName'];
        $scope.spmenu = 'cbp-spmenu-open';
      });
    };
  });
  app.controller('addCtrl', function ($scope) {
    // write Ctrl here

  });
  app.controller('viewCtrl', function ($scope) {
    // write Ctrl here
  });
  app.controller('newOrderCtrl', function ($scope, $http, $location, $dialog) {
    $scope.form = {};
    $scope.opts = {
      backdrop: true,
      keyboard: true,
      backdropClick: true,
      templateUrl : '/partials/modal'
    };
    $scope.openDialog = function(){
      var d = $dialog.dialog($scope.opts);
      d.open().then(function(result){
        if(result)
        {
          alert('dialog closed with result: ' + result);
        }
      });
    };
    $scope.submitOrder = function(){
      $http.post('/orders/create', $scope.form).
        success(function(data) {
          if(data.success){
            console.log(data);
          }
        }).
        error();
    };
  });
  app.controller('editCtrl', function ($scope, $http, $location, $routeParams) {
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

  });