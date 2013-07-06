'use strict';

/* Directives */

var myDir = angular.module('argetni.directives', [])
	myDir.directive('datepicker', function(){
		var linker = function(scope, element, attrs){
			element.datepicker();
		}
		return {
			restrict :'A',
			link: linker
		}
	}).
	directive('typeahead',function(){
		var linker = function(scope, element, attrs){
			
			element.typeahead({
				source: function(query, process){
					return $.getJSON('/items/typeahead/itemName/'+query, function(s) {
								var results = [];
						        $.each(s,function(){
						        	results.push(this.itemName);
						        });
						        return process(results);
						      });							
				},
				updater: function(item){
					$.getJSON('items/listOne/'+item+'/quick',function(y){
						$('#item-summary').show();
						scope = y;				
					});
					return item;
				}
			})
		}
		return{
			link: linker
		}
	})



