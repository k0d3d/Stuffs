/* Services */


app.service('itemsService', function($http){
  return {
    items: function(callback){
      $http.get('items/listAll').success(callback);
    },
    summary: function(id,callback){
      $http.get('/items/listOne/'+id+'/quick').success(callback);
    }
  };
});
app.factory('ordersService',function($http){
    var f = {};
    f.getItemName = function(query, callback){
        $.getJSON('/items/typeahead/itemName/'+query, function(s) {
            var results = [];
            $.each(s,function(){
              results.push(this.itemName);
            });
            return callback(results);
        });
    };
    f.itemSummary = function(item){
        $.getJSON('items/listOne/'+item+'/quick',function(y){
            return y;
        });
    };
    return f;
});
