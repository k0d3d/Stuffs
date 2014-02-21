/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  _ = require("underscore"),
  Schema = mongoose.Schema;

var updaterSchema = new Schema ({
	mainStock: {type: Schema.ObjectId, ref: 'Location'},
	hospitalId: {type: String},
	access_token: {type: String},
  lastUpdate: {type: Date, default: Date.now}
});

mongoose.model('updater', updaterSchema);