const mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

// user schema

const UserSchema = new mongoose.Schema({
    username : String,
    password : String,
    name : String,
    email : String,
    data : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "data"
        }   
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user',UserSchema);