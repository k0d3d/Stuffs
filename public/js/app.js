// Declare app level module which depends on filters, and services

angular.module('integraApp', [
  'ui.bootstrap',
  'order',
  'stock',
  'item',
  'bills',
  'dashboard',
  'directives'
  ]);
angular.module('integraApp').config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
});

angular.module('integraApp').controller('MainController', function($scope, $http, $location){
  $scope.modal ={};
  function href(target){
    $location.path(target);
  }
  function backBtn(){
    history.back();
  }

  //List of Item forms 
  var itemForm = [
   'Tablets',
   'Capsules',
   'Vials',
   'Caplets',
   'Amples',
   'Emugels',
   'Gels',
   'Ointments',
   'Suspensions',
   'Syrup',
   'Powder',
   'Cream',
   'Lotion',
   'Drops',
   'Sprays'
  ];

  //List of Item Packaging
  var itemPackaging = [
     'Tin',
     'Carton',
     'Sachet',
     'Roll',
     'Pieces',
     'Packet',
     'Gallon',
     'Bottles',
     'Bags',
     'Box',
     'Tube'
  ];

  $scope.commons = {
    href : href,
    backBtn: backBtn,
    itemForm : itemForm,
    itemPackaging: itemPackaging

  };  
});