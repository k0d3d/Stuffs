/* Directives */

  app.directive('datepicker', function(){
    var linker = function(scope, element, attrs){
      element.datepicker();
    };
    return {
      restrict :'A',
      link: linker
    };
  });
  app.directive('typeahead',function(ordersService){
    var linker = function(scope, element, attrs){
      element.typeahead({
        source: function(query, process){
          return ordersService.getItemName(query,function(results){
            return process(results);
          });
        },
        updater: function(item){
          $.getJSON('items/listOne/'+item+'/quick',function(y){
            scope.summary = y;
            scope.summary.supplierName = y.itemSupplier[0]['supplierName'];
            scope.ordersummary = 'open-summary';
            scope.$apply();
          });
          return item;
        }
      });
    };
    return{
      restrict: 'A',
      scope: {
        summary: '=summaryData'
      },
      link: linker
    };
  });
  app.directive('onFinish',function($timeout){
    return {
      restrict: 'A',
      link: function(scope, element, attr){
        if(scope.$last === true){
          $timeout(function(){
            $('.panorama').panorama({
               //nicescroll: false,
               showscrollbuttons: false,
               keyboard: true,
               parallax: false
            });
          });
        }
      }
    };
  });