
// requiring files
const express = require('express'),
    ejs = require('ejs'),
    bodyparser = require('body-parser'),
    fileUpload = require('express-fileupload'),
    fs = require('fs-extra'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    methodOverride = require('method-override'),
    User = require('./models/user'),
    Data = require('./models/data');

// mongoose configuration
mongoose.set('useUnifiedTopology',true);
mongoose.set('useFindAndModify',false);
mongoose.connect('mongodb://localhost/Myspace_v2',{useNewUrlParser: true, useFindAndModify: false });

// app configuration
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json({ limit: '50mb' }))

app.use(fileUpload({
    createParentPath: true
}));
app.use(methodOverride('_method'));
app.use(express.static('public'));





// passport configration
app.use(require('express-session')({
    secret : "This is key secret to hack the hash in database",
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});

// routes setup
const indexRoutes = require('./routes/index.js');
const dataRoutes  = require('./routes/data');

// app configuration with routed
app.use(indexRoutes);
app.use(dataRoutes);

// port setup
app.listen(3000,function(){
    console.log("server has started");
});




