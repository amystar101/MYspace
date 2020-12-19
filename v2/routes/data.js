const express = require('express');
const router = express.Router();
const Data = require('../models/data');
const fs = require('fs-extra');
const Path = require('path');
const User = require('../models/user');

// data uploading

let recieve_data = {};

router.post('/data',function(req,res){
    if(req.isAuthenticated()){
        let bytes = new Uint8Array(req.body.chunk.length);
        
        if(!(req.user.username in recieve_data)){
            let p1 = Path.resolve('./');
            // console.log(chunk)
            let path = p1+'/uploads/'+req.user.username+"_"+Date.now()+"_"+req.body.name;
            recieve_data[req.user.username] = {
                "chunk_no" : -1,
                "path" : path,
            }
        }
        if(recieve_data[req.user.username].chunk_no == req.body.chunk_no-1){
            // process
            for (let i=0; i<req.body.chunk.length; i++)
                bytes[i] = req.body.chunk.charCodeAt(i);
            
            fs.open(recieve_data[req.user.username].path,'a',function(err,fd){
                if(err){
                    console.log(err);
                    res.end();
                }
                else{
                    fs.write(fd,bytes,0,function(err,w){
                        if(err){
                            fs.unlink(recieve_data[req.user.username].path,function(err){
                                if(err)
                                    console.log("error at erasing the file");
                                
                                // remove the entry from recieve_data map
                                id = req.user.username;
                                delete recieve_data[id];
                                res.send("Server error in wriiting your file");
                                
                            });
                        }
                        else{
                            recieve_data[req.user.username].chunk_no += 1;
                            if(req.body.end == false){
                                res.send({"required":recieve_data[req.user.username].chunk_no+1});
                            }
                            else{
                                // file completed
                                // adding file entry to data base
                                let newData = new Data({
                                    location : recieve_data[req.user.username].path,
                                    name : req.body.name,
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
                                                id = req.user.username;
                                                delete recieve_data[id];

                                                let dataToSend = {
                                                    "required" : -1,
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
                        }
                    });
                }
            });      
        }
        else{
            // you missed some chunks, request for missed ones
            res.send({"required":recieve_data[req.user.username].chunk_no});
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
