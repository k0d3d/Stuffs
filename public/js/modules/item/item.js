/**
*  item Module
*
* Description
*/
angular.module('item', ['ui.bootstrap'])

.config(['$routeProvider', function ($routeProvider){
	$routeProvider.when('/items', {templateUrl: '/items/index', controller: 'itemIndexController'})
  .when('/items/view/:state', {templateUrl: '/items/index', controller: 'itemIndexController'})
  .when('/items/add', {templateUrl: '/items/new', controller: 'itemAddController'})
  .when('/items/locations', {templateUrl: '/items/stockdown', controller: 'itemStockController'})
	.when('/items/dispensary', {templateUrl: '/items/dispense', controller: 'itemDispensaryController'})
  .when('/items/:itemId/edit',{templateUrl: '/items/edit', controller: 'itemEditController'});
}])
.controller('itemIndexController', function itemIndexController($scope, $location, $routeParams,itemsService){
    function init(){
      var currentItem;
      $scope.summary = {};
      $scope.form = {};
      $scope.itemsList = '';
      $scope.hasItems = false;
      itemsService.items(function(data){
        if(data.length > 0){
          $scope.hasItems = true;
          sortItems(data, function(lol){
            $scope.itemsList = lol;
          });
          $scope.enabledIndex = Object.keys($scope.itemsList);
        }
      });
      $scope.$on('onFinishLoaded', function(event, data){
        if(data == true){
          if($routeParams.state == 'low'){
            $('.card').not('.low-stock').hide();
          }
        }
      });
    }
    init();
    function sortItems(data, callback){
      var o = {};
      angular.forEach(data, function(ele,index,arr){
        if(ele.itemName){
          var fchar = ele.itemName.split("");
          if(o[fchar[0]] ===  undefined){
            o[fchar[0]] = [];
          }
          o[fchar[0]].push(ele);
        }
        if(arr.length === index + 1){
         callback(o);
       }
      });
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
    $scope.summaryDo =  function (event, id){
      //We use 0 for the location to indicate the Main Inventory
      
      //Set the current item var
      currentItem = event.currentTarget;
      itemsService.summary(id,'main',function(res){
        $scope.delConfirm = true;
        $scope.delBtnText = 'Delete Item';
        $scope.summary = res;
        $scope.spmenu = 'cbp-spmenu-open';
        $('html').click(function(){
          $scope.spmenu = '';
          $scope.$apply();
        });
        $('nav.cbp-spmenu').click(function(event){
          event.stopPropagation();
        });
      });
    };

    $scope.deleteItem = function(id){
      itemsService.delete(id, function(data){
        if(data.state === 1){
          currentItem.remove();
          $scope.spmenu = '';
        }
      });
    }

})
.controller('itemAddController', function itemAddController ($scope, $location, $routeParams,itemsService){
  $scope.form = {
    itemCategory: []
  };
  $scope.catList = [];
  
  //Initialization function
  function init(){
    itemsService.listCategory(function(r){
      angular.forEach(r, function(v,k){
        $scope.catList.push(v);
      });
    });
  }
  //Run initialization
  init();

  $scope.saveButtonClass = 'btn-primary';
  $scope.isDisabled = false;
  $scope.saveitem = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.save($scope.form, function(status,res){
      if(status){
        $scope.form = '';
        $scope.saveButtonText = 'Save Item';
        $scope.saveButtonClass = 'btn-primary';
      }else{
        $scope.saveButtonText = 'Save Item';
      }
    });
  };

  //Add Category
  $scope.addCat = function(){
    if($scope.catInput.length > 0){
      itemsService.addCategory($scope.catInput, function(r){
        $scope.catList.push($scope.catInput);
      });
    }
  };

  //Remove/Delete a Category
  $scope.removeCat = function(index){
    $scope.catList.splice(index, 1);
  };

  //Add a category to the item's category list
  $scope.addToItem = function(index){
    var i = $scope.catList[index];
    $scope.form.itemCategory.push(i);
  };

  $scope.removeItemCat = function(index){
    $scope.form.itemCategory.splice(index,1);
  };

})
.controller('itemEditController', function itemEditController($scope, $location, $routeParams,itemsService){
  $scope.form = {
    itemSupplier: {}
  };
  if(isNaN($routeParams.itemId)){
    itemsService.getItemFields($routeParams.itemId, function(item){
      $scope.form = item;
    });
  }
  $scope.saveitem = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.update($scope.form, function(status,res){
      if(status){
        $scope.modal.heading= 'Item Updated';
        $scope.modal.body= "Close this dialog or return to the dashboard";
        $scope.modal.class= 'md-success';
        $scope.modal.modalState= 'md-show';
        $scope.saveButtonText = 'Save Item';
        $scope.saveButtonClass = 'btn-primary';
      }else{
        $scope.$parent.modal.heading= 'Error Adding Item';
        $scope.$parent.modal.body= "Something went wrong while carrying out your last request. If it's nothing serious, you can try again. If this error happens again, please inform the Admin";
        $('.md-modal').addClass('md-show md-error');
        $('.md-overlay').addClass('error-overlay');
        $scope.saveButtonText = 'Save Item';
      }
    });
  };
})
.controller('itemStockController',['$scope','$location','$routeParams','itemsService',function itemAddController ($scope, $location, $routeParams,itemsService){
  
  function init(){
    //Location Array
    $scope.locations = [];

    //Stores the requested drugs / items list
    $scope.requestform = {
      request: [],
      requestList : [],
      location: ''
    };

    //Text on the buttons
    $scope.addButtonText = 'Add';
    $scope.addHelpText = '';
    var thisItemName = '';
    $scope.stockDownRecord = [] ;
    $scope.hasItems = false;
  }
  init();


  // Watch for changes in the selectedItem model scope and 
  $scope.$watch('selectedItem.itemname', function(newValue, oldValue){
    if(newValue !== oldValue){
      thisItemName = newValue;
    }
  });
  $scope.addDrug = function(){
    $scope.addHelpText = '';
    if($scope.drugname.length === 0) return false;
    itemsService.summary(thisItemName,'main',function(c){
      if(_.indexOf($scope.requestform.requestList, thisItemName) < 0){
        $scope.requestform.requestList.push(thisItemName);
        $scope.requestform.request.push(c);
      }else{
        alert('This item is in the list already');
      }
    });
  };
  $scope.sendIt = function(){
    var drugs = [];
    _.forEach($scope.requestform.request, function(i,v){
      if(i.amount !== 0 && i.amount.length !== 0){
        drugs.push({"_id":i._id,"amount":i.amount,"itemName":i.itemName,"itemID": i.itemID});
      }
    });
    var sendDis = {"location":$scope.requestform.location,"request": $scope.requestform.request};
    itemsService.stockdown(sendDis, function(c){
      $scope.requestform.request.length = 0;
      $scope.requestform.requestList.length = 0;
      $('#modal-request-stock-down').modal('hide');
    });
  };
  $scope.removeDrug = function(index){
    $scope.requestform.request.splice(index, 1);
    $scope.requestform.requestList.splice(index, 1);
    $scope.$apply();
  };


  // Gets the stock down points from the server
  itemsService.getPoints(function(res){
    $scope.locations = res;
  });
  $scope.saveButtonClass = 'btn-primary';

  $scope.createPoint = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.saveLocation($scope.location, function(res){
      $scope.saveButtonText = 'SAVED';
      $scope.saveButtonClass= 'btn-success';
      $scope.modalstate = false;
      $scope.locations.push(res);
    });
  };
  $scope.onLocation = function(id){
    itemsService.showStockDown(id, function(data, response){
      $scope.hasItems = true;
      $scope.stockDownRecord = data;
    });
  }
}])
.controller('itemDispensaryController', function itemDispensaryController($scope,$location,$routeParams,itemsService){
  function init(){
    //Holds the form for dispensing drugs to a patient.
    //Patient Name, Number, Type and the Drugs list
    $scope.dispenseform = {
      prescription: []
    };
    // Gets the stock down points from the server
    itemsService.getPoints(function(res){
      $scope.locations = res;
    });  
    $scope.drugsList = [];
    $scope.d = [];  
    //Previously Dispensed Records. Get populated by the init function
    itemsService.fetchDispenseRecords(function(r){
      $scope.dispenseHistory = r;   
    });    
  }

  //Initialize
  init();

  $scope.addButtonText = 'Add';
  $scope.addHelpText = '';
  $scope.$watch('selectedItem.itemname', function(newValue, oldValue){
    if(newValue !== oldValue){
      $scope.thisItemName = newValue;
    }
  });
  $scope.addDrug = function(){
    if($scope.drugname.length === 0) return false;
    $scope.addHelpText = '';
    itemsService.summary($scope.thisItemName,$scope.dispenseform.location._id,function(c){
      if(_.indexOf($scope.drugsList, $scope.thisItemName) < 0){
        $scope.drugsList.push($scope.thisItemName);
        $scope.d.push(c);
        //Empty the drugname field
        $scope.drugname = '';
      }else{
        alert("This item is already in the list");
      }
    });
  };

  //Confirm this drug to be prescribed
  $scope.prescribeThis = function(d){
    $scope.drugname = '';
    if(d.options == 'alternative'){
      $scope.addHelpText = 'This is an alternative to '+d.itemName;
      $scope.dispenseform.prescription.push(d);
      return;
    }
    // Check if the amount to be dispensed is available
    // (lesser than) from the current stock for the item 
    if(d.amount < d.currentStock){
      $scope.dispenseform.prescription.push(d);
    }
  };

  //Pull up modal with summary
  $scope.approveThis = function(){
    if($scope.dispenseform.prescription.length === 0){
        alert("You havent confirmed any items. Check your list");
        return false;
      }
    $scope.modal.heading= 'Confirm Prescription';
    $scope.modal.class= 'md-success';
    $scope.modal.modalState= 'md-show';
  };

  // Send prescript
  $scope.sendDis = function(){
    var drugs = [];
    _.forEach($scope.dispenseform.prescription, function(i,v){
      drugs.push({"_id":i._id,"amount":i.amount,"itemName":i.itemName,"itemID": i.itemID,"status":i.options});
    });
    var toSend = {
      "patientName":$scope.dispenseform.patientName,
      "patientId": $scope.dispenseform.patientno,
      "company": $scope.dispenseform.company,
      "drugs": drugs,
      "location": $scope.dispenseform.location
    };
    itemsService.dispense(toSend, function(c){
      $scope.modal.modalState = false;
      //Empty all necessary scope, reset form
      $scope.dispenseform = '';
      $scope.d = '';
      $scope.drugsList = '';
      console.log(c);
    });
  };
  $scope.removeDrug = function(index){
    $scope.drugname = '';
    $scope.drugsList.splice(index, 1);
    $scope.d.splice(index, 1);
    console.log($scope.drugsList);
    console.log($scope.d);
  };
})
.factory('itemsService', ['$http', 'Language','Notification', function($http, Language, Notification){
  var i = {};
  i.items =  function(callback){
      $http.get('/api/items/listAll')
      .success(function(data, status){
        Notification.notifier({
          message: "Fetched list of items successfully",
          type: "success"
        });
      })
      .error(function(data, status){
        Notification.notifier({
          message: 'Failed to fetch list of items from the server. Will try again',
          type: 'error'
        })
      });
    };

  //Typeahead Query
  i.getItemName = function(query, callback){
    $.getJSON('/api/items/typeahead/term/itemName/query/'+escape(query), function(s) {
        var results = [];
        $.each(s,function(){
          results.push(this.itemName);
        });
        callback(results);
    });
  };
  i.getNafdacDrug = function(query, callback){
    $.getJSON('/api/nafdacdrugs/typeahead/needle/'+escape(query), function(s) {
        var results = [];
        $.each(s,function(){
          results.push(this.productName);
        });
        callback(results, s);
    });    
  };
  i.summary = function(id,lId, callback){
    var itemId = _.escape(id);
    var locationId = _.escape(lId);
      $http.get('/api/items/'+itemId+'/options/quick/locations/'+locationId).success(callback);
    };
  i.save =  function(post, callback){
      $http.post('/api/items', {item: post}).success(function(data, status){
        Notification.modal({
          heading: 'Item Added',
          body: Language.eng.items.save.success,
          type: 'success',
        });
        callback(true,status);
      }).
      error(function(data, status){
        Notification.modal({
          heading: 'Error Adding Item',
          body: Language.eng.items.save.error,
          type: 'error',
        });         
        callback(false, status);
      });
    };
  i.count =  function(callback){
    $http.get('/api/items/count').
    success(function(data,status){
      callback(data);
    });
  };
  i.saveLocation = function(post,callback){
    $http.post('/api/items/location',post).
    success(function(data, status){
      callback(data);
    });
  };
  i.getPoints = function(callback){
    $http.get('/api/items/location').
    success(function(data, status){
      callback(data);
    });
  };
  //Gets dispense records from the server
  i.fetchDispenseRecords = function(callback){
    $http.get('/api/items/locations/records').
    success(function(data, status){
      callback(data);
    });
  };

  //Post a dispense record
  i.dispense = function(list, callback){
    $http.post('/api/items/dispense',list).
    success(function(data, status){
      callback(date);
    }).
    error(function(data, status){
      $scope.modal.heading= 'Error Submitting';
      $scope.modal.class= 'md-error';
      $scope.modal.modalState= 'md-show';
      $scope.modal.body = "The last request was not successful. We think something went wrong. Try again. If this error persists, contact Admin";
    });
  };
  //Fetches fields data for an Item
  i.getItemFields = function(itemId, callback){
    $http.get('/api/items/'+escape(itemId)+'/edit').success(callback);
  };
  //Fetches all items for a location
  i.showStockDown = function(location_id, callback){
    $http.get('/api/items/stockdown/'+location_id).success(callback);
  };

  //sends a stockdown request, 
  i.stockdown = function(list, callback){
    $http.post('/api/items/stockdown', list).success(callback);
  };

  //Post updated item fields 
  i.update = function(form, callback){
    $http.post('/api/items/'+escape(form.itemID)+'/edit', form).success(callback);
  };

  //Delete Item
  i.delete = function(id, callback){
    $http.delete('/api/items/'+id)
    .success(callback);
  };

  //Add an item category
  i.addCategory = function(name, callback){
    $http.post('/api/items/category/', {name: name, parent: ''})
    .success(function(data, status){
      Notification.notifier({
        message: Language.eng.items.category.add.success,
        type: "success"
      });
      callback(data);
    })
    .error(function(data, status){
      Notification.notifier({
        message: Language.eng.items.category.add.error,
        type: "error"
      }); 
    });
  };

  //List Categories
  i.listCategory = function(callback){
    $http.get("/api/items/category")
    .success(function(data, status){
      callback(data);
    })
    .error(function(data, status){
      Notification.notifier({
        message: Language.eng.items.category.list.error,
        type: "error"
      });       
    });
  }

  return i;
}])
.directive('newModal', function(){
    function link($scope, element, attributes){
      element.on('click', function(){
        $(attributes.newModal).modal('toggle');
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
  })
.directive('brandNameTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getNafdacDrug(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(item){
          scope.form.itemName = item;
          _.some(nx, function(v,i){
            if(v.productName === item){
              scope.form.nafdacRegNo = v.regNo;
              scope.form.importer = v.man_imp_supp;
              scope.form.nafdacId = v._id;
              return true;
            }
          });
          scope.$apply();
          return item;
        }
      });
  };
  return {
    link: linker
  };
}]);
