/**
 * Language Constants
 */
angular.module('language', [])

.constant('Language', {
	"eng":{
		"items": {
			"save": {
				"success":"You've succesfully added an order. Note: Items placed with invoice numbers and stock amounts will have their current stock updated. To add another item, close this dialog or return to the dashboard",
				"error": "Something went wrong while carrying out your last request. If it's nothing serious, you can try again. If this error happens again, please inform the Admin"
			},
			"autocomplete":{
				"brandname":"",
				"suppliers":""
			},
			"category":{
				"add":{
					"success":"Category successfully added",
					"error": "Error adding category"
				},
				"list":{
					"error": "Error Fetching Categories"
				}
			}
		},
		"supplier": {
			"add": {
				"success":"You have added a new supplier",
				"error": "An error occured with the last request"
			}
		}
	}
});