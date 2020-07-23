const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user.js');


// base route
router.get('/',function(req,res){
    if(req.isAuthenticated()){
        res.redirect('/home');
    }
    else{
        res.render("index.ejs");
    }
    
});

// home of user
router.get('/home',function(req,res){
    if(req.isAuthenticated()){
        res.render('home.ejs');
    }
    else{
        res.redirect('/');
    }
});

// register route;
router.post('/register',function(req,res){
    if(req.isAuthenticated()){
        // a user is already logined so first logout
        res.redirect('back');
    }
    else{
        // register new user;
        User.find({email :req.body.email},function(err,foundUser){
            if(err){
                console.log("error at finding user in db");
                res.redirect('back');
            }
            else{
                if(foundUser.length == 0){
                    User.find({username :req.body.username},function(err,foundUser){
                        if(err){
                            res.redirect('back');
                        }
                        else{
                            if(foundUser.length == 0){
                                let newUser = new User({
                                    username : req.body.username,
                                    name : req.body.name,
                                    email : req.body.email
                                });
                                User.register(newUser,req.body.password,function(err,user){
                                    if(err){
                                        console.log("error durring register");
                                        res.redirect('back');
                                    }
                                    else{
                                        passport.authenticate('local')(req,res,function(){
                                            res.redirect('/');
                                        });
                                        
                                    }
                                });
                            }
                            else{
                                res.send("User already exist");
                            }
                        }
                    });
                }
                else{
                    res.send("User already exist");
                }
            }
        });
    }
});

// login 
router.post('/login',passport.authenticate('local',{
    successRedirect : '/home',
    failureRedirect : '/'
}),function(req,res){

});

// logout
router.get('/logout',function(req,res){
    req.logout();
    res.redirect('/');
});

// about page
router.get('/about',function(req,res){
    res.render('about.ejs');
});

router.get('/contact',function(req,res){
    res.render("contact.ejs");
});

module.exports = router;


