const mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

DataSchema = new mongoose.Schema({
    location : String,
    name : String,
    shairing : Boolean,
    owner : String 
});

module.exports = mongoose.model('data',DataSchema);

