const express = require('express');
const router = express.Router();
const Data = require('../models/data');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const Path = require('path');
const User = require('../models/user');

// data uploading
router.post('/data',function(req,res){
    if(req.isAuthenticated()){
        if(req.files){
            let file_to_upload = req.files.file;
            let p1 = Path.resolve('./');
            let path = p1+'/uploads/'+req.user.username+"_"+Date.now()+"_"+file_to_upload.name;
            file_to_upload.mv(path,function(err){
                if(err){
                    res.redirect('back');
                }
                else{
                    let newData = new Data({
                        location : path,
                        name : file_to_upload.name,
                        shairing : false,
                        owner : req.user._id
                    });
                    newData.save(function(err,savedFile){
                        if(err){
                            console.log("error in saving in database");
                            console.log(err);
                            res.end();
                        }
                        else{
                            User.findById(req.user._id,function(err,user){
                                if(!err){
                                    user.data.push(newData);
                                    user.save();
                                    // console.log('user saved');
                                }
                            });
                            let dataToSend = {
                                "name" : newData.name,
                                "_id" : newData._id,
                                "shairing" : newData.shairing
                            }
                            res.send(dataToSend);
                        }
                    });
                }
            });
        }   
        else{
            res.redidrect('back');
        }
    }
    else{
        // login first;
        res.redirect('/');
    }
});


// api for get data
router.get('/data',function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user._id).populate('data').exec(function(err,foundData){
            if(err)
                console.log(err);
            else{
                let data = [];
                foundData.data.forEach(function(d){
                    data.push({
                        '_id' : d._id,
                        'name' : d.name,
                        'shairing' : d.shairing
                    });
                });
                res.send(data);
            }
        });
    }
    else{
        res.send({});
    }

});

router.get('/data/download/:id',function(req,res){
    Data.findById(req.params.id,function(err,requestedFile){
        if(err)
            res.end();
        else{
            if(requestedFile.shairing == true){
                res.download(requestedFile.location);
            }
            else{
                if(req.isAuthenticated()){
                    if(requestedFile.owner == req.user._id)
                        res.download(requestedFile.location);
                    else
                        res.end();
                }
                else
                    res.end();
            }
        }
    });
});

// to delete data

router.delete('/data/delete/:id',function(req,res){
    if(req.isAuthenticated()){
        Data.findById(req.params.id,function(err,foundData){
            if(err)
                res.redirect('back');
            else{
                // console.log(foundData.owner,req.user._id);
                if(foundData.owner == req.user._id){
                    fs.unlink(foundData.location,function(err){
                        if(err)
                            res.redirect('back');
                        else{
                            Data.findByIdAndRemove(req.params.id,function(err){
                                if(err){
                                    res.end();
                                }
                                else{
                                    User.findById(req.user._id,function(err,us){
                                        let pos,i = 0;
                                        let check = false;
                                        for(i=0;i<us.data.length;i++){
                                            if(us.data[i] == req.params.id){
                                                check = true;
                                                pos = i;
                                            }
                                        }
                                        if(check){
                                            us.data.splice(pos,1);
                                            us.save(function(){
                                                res.redirect('/');
                                            });
                                        }
                                        if(i >= us.data.length && check == false)
                                            res.redirect('/');
                                    });
                                }
                            });

                        }
                    });
                }
            }
        });
    }
    else
        res.redirect('/');
});


// To be implemented data sharing
router.get('/data/:id/share',function(req,res){
    if(req.isAuthenticated()){
        Data.findById(req.params.id,function(err,foundData){
            if(err)
                res.redirect('back');
            else{
                if(foundData.owner == req.user._id){
                    if(foundData.shairing == false){
                        foundData.shairing = true;
                        foundData.save();
                    }
                    let link = req.headers.host+"/data/download/"+req.params.id;
                    res.send(link)
                }
                else
                    res.end()
            }
        });
    }
    else
        res.end();
});

router.get('/data/:id/unshare',function(req,res){
    if(req.isAuthenticated()){
        Data.findById(req.params.id,function(err,foundData){
            if(err)
                res.redirect('back');
            else{
                if(foundData.owner == req.user._id){
                    foundData.shairing = false;
                    foundData.save();
                    res.send("data marked as unshare");
                }
                else
                    res.end();
            }
        });
    }
    else
        res.end();
});


module.exports = router;
