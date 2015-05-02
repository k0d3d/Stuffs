/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * User Schema
 */
var UserSchema = new Schema({
    /*
    Mini profile
     */
    firstname: {type: String},
    lastname: {type: String},
    companyName: {type: String},
    photo: {type: String, default: 'prettyme.jpg'},
    phoneNumber: {type: String, trim: true, unique: true, sparse: true, required: true},
    /*
    account credentials
     */
    email: {type: String, trim: true, unique: true, sparse: true, required: true},
    username: {type: String, trim: true, unique: true, sparse: true},
    password: String,
    type: { type: String, default: 'user' },
    /*
    loggin and audit
     */
    createdOn: { type: Date, default: Date.now },
    lastLoggedInOn: { type: Date},
    enabled: { type: Boolean, default: true },
    /*
    oauth2
     */
    reset_token_expires: Date
});

/**
 *  Plugins
 */



/**
 * Validations
 */
var validatePresenceOf = function(value) {
    return value && value.length;
};


/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
    if (!this.isNew) return next();
    if (!validatePresenceOf(this.password))
        next(new Error('Invalid password'));
    else
        next();
});


mongoose.model('User', UserSchema);
module.exports.UserModel = mongoose.model('User');