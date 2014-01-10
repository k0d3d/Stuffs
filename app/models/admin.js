/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  _ = require("underscore"),
  Schema = mongoose.Schema;

var updaterSchema = new Schema ({
  lastUpdate: {type: Date, default: Date.now}
});

mongoose.model('updater', updaterSchema);