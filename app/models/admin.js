/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('../../config/config')[env],
  _ = require("underscore"),
  Schema = mongoose.Schema;

var adminSchema = new Schema({
  hospitalId: {type: String},
  access_token: {type: String},
  lastUpdate: {type: Date, default: Date.now},
  accountType: {type: String, default: 'default'},
  facility: {
    name: {type: String},
    address: {type: String},
    city: {type: String},
    state: {type: String},
    service_type: {type: String},
    phone_number: {type: String}
  }
});


mongoose.model('admin', adminSchema);