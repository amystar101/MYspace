const express = require('express');
const ejs = require('ejs');
const bodyparser = require('body-parser');
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const cookieParser = require('cookie-parser');
const app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(fileUpload({
    createParentPath: true
}));
app.use(express.static('public'));
app.use(cookieParser());

let usermap = new Map();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'YOUR USER NAME FOR MYSQL DB',
    password: 'USER PASSWORD FOR MYSQL DB',
    database: 'MYspace_db',// Database name for mysql db
    // insecureAuth: 'true',
});

connection.connect(function(err){
    if(err)
        console.log("error connecting to database");
    else
        console.log("connected to database");
});

app.listen(3000,function(){
    console.log("server has started");
});


app.get('/',function(req,res){
    let user = userAuthenticate(req.cookies.userId);
    if(user == false){
        res.render("home.ejs",{
            msg:"",
            ismsg:false,
            login:false,
            name:""
        });
    }
    else{
        connection.query("SELECT * FROM "+ user + "_data",function(err,results){
            if(err){
                console.log("error at here");
                throw err;
            }
            res.render("after_login.ejs",{
                login:true,
                name:user,
                is_upload_msg:false,
                upload_msg:"",
                user_data:results,
                i:0
            });
        });
    }
});

// logout
app.get('/logout',function(req,res){
    let user = userAuthenticate(req.cookies.userId);
    if(user == false){
        res.render("home.ejs",{
            msg:"Please Login First",
            ismsg:true,
            login:false,
            name:""
        });
    }
    else{
        usermap.delete(req.cookies.userId);
        res.clearCookie("userId");
        res.redirect('/');

    }
});

// login
app.post('/login',function(req,res){
    let uname = req.body.uname;
    let pwd = req.body.pwd;
    connection.query("SELECT * FROM users WHERE uname = '"+uname+"' AND password = '" + pwd +"';",function(err,result,field){
        if(err){
            console.log("error at login");
            res.redirect('/');
        }
        else if(result.length == 0)
        {
            res.redirect('/'); // user not found in database
        }
        else
        {
            // user found , login him
            let newsessionId = Date.now()+"-"+uname + "-"+req.connection.remoteAddress;
            usermap.set(newsessionId,uname);
            res.cookie("userId",newsessionId);
            res.redirect('/');    
        }
    });
});



// signup
app.post('/signup',function(req,res){
    let uname = req.body.uname;
    let pwd = req.body.pwd;
    let email = req.body.email;
    let fname = req.body.fname;
    let  lname = req.body.lname;
    let q = "SELECT * FROM users WHERE uname = '";
    q += uname + "' OR email = '" + email +"'";
    connection.query(q,function(err,rows,fields){
        if(err)
        {
            res.redirect('/');
        }
        else
        {
            if(rows.length == 0)
            {
                connection.query("CREATE TABLE "+uname+"_data (name varchar(50) NOT NULL,address varchar(200) NOT NULL,PRIMARY KEY(name))",function(err){
                    if(err){
                        console.log(err);
                        res.redirect('/');
                    }
                    else{
                        connection.query("INSERT INTO users VALUES ('"+uname+"','"+fname+"','"+lname+"','"+email+"','"+pwd+"')",function(err){
                            if(err){
                                console.log("error in db");
                                res.redirect('/');
                            }
                            else{
                                res.render("home.ejs",{
                                    msg:"NEW USER CREATED",
                                    ismsg:true,
                                    login:false,
                                    name:""
                                });
                            }
                        });
                    }
                });
            }
            else{
                res.render("home.ejs",{
                    msg:"User already exist",
                    ismsg:true,
                    login:false,
                    name:""
                });
            }
        }
    });

});

// about me page
app.get('/about',function(req,res){
    let user = userAuthenticate(req.cookies.userId),userlogined;
    if(user == false){
        res.render("about.ejs",{
            login:false,
            name:""
        });
    }
    else{
        res.render("about.ejs",{
            login:true,
            name:user
        });
    }
});

// contact page
app.get('/contact',function(req,res){
    let user = userAuthenticate(req.cookies.userId),userlogined;
    if(user == false){
        res.render("contact.ejs",{
            login:false,
            name:""
        });
    }
    else{
        res.render("contact.ejs",{
            login:true,
            name:user
        });
    }
});

// delete user

app.post('/deleteuser',function(req,res){
    let uname = req.body.uname;
    let pwd = req.body.pwd;
    let email = req.body.email;
    let fname = req.body.fname;
    let  lname = req.body.lname;
    let q = "SELECT * FROM users WHERE uname = '";
    q += uname + "'";

    connection.query(q,function(err,rows,fields){
        if(err || rows.length == 0)
        {
            ismsg = true;
            msg = "USER CANNOT BE DELETED ";
            res.redirect('/');
        }
        else if(rows[0].uname==uname && rows[0].fname==fname && rows[0].lname==lname && rows[0].email==email && rows[0].password == pwd)
        {
            connection.query("DROP TABLE " + uname+"_data",function(errr,result,fields1){
                if(!errr)
                {
                    connection.query("DELETE FROM users WHERE uname = '"+uname+"'",function(err2,res2,field2){
                        if(!err2)
                        {
                            let path = __dirname+"/uploads/"+uname+"_data";
                            fs.remove(path,function(err4){
                                if(!err4)
                                {
                                    res.render("home.ejs",{
                                        msg:"User Deleted",
                                        ismsg:true,
                                        login:false,
                                        name:""
                                    });
                                }
                                else{
                                    consolelog("error in fs-link");
                                    res.redirect('/');
                                }
                            })
                        }
                        else{
                            console.log("error in db while deleting");
                            res.redirect('/');
                        }
                    });
                }
                else{
                    res.redirect('/');
                }
            });
        }
        else
        {
            res.render("home.ejs",{
                msg:"User Not found",
                ismsg:true,
                login:false,
                name:""
            });
        }
    });
});

// upload user data

app.post('/upload',function(req,res){
    let user = userAuthenticate(req.cookies.userId);
    if(user == false){
        res.render("home.ejs",{
            msg:msg,
            ismsg:false,
            login:false,
            name:""
        });
    }
    else{
        if(!req.files)
        {
            res.end();
        }
        else
        {
            // console.log(req.files);
            let file_to_upload = req.files.file;
            let path = __dirname+'/uploads/'+user+"_data/"+file_to_upload.name;
            // console.log(path);
            file_to_upload.mv(path,function(err){
                if(err)
                {
                    res.end();
                }
                else
                {
                    connection.query("INSERT INTO "+ user + "_data VALUES ('"+file_to_upload.name+"','"+path+"')",function(err,result){
                        if(err){
                            console.log("error at making changes in databases of uploaded file");
                            msg = "FILE NOT UPLOADED";
                            ismsg = true;
                            res.end();
                        }
                        else{
                            let obj = {
                                "name": file_to_upload.name,
                                "url": "delete/"+file_to_upload.name  
                            };
                            res.status(200).send(obj);
                        }
                    });
                }
            });
        }
    }
});



// download of user data

app.get('/download/:x',function(req,res){
    let user = userAuthenticate(req.cookies.userId);
    if(user == false){
        res.redirect('/');
    }
    else{
        let requestedfile = req.params.x;
        let path = __dirname+'/uploads/'+user+"_data/"+requestedfile;
        res.download(path,requestedfile);
    }
});

// delete user data

app.get('/delete/:x',function(req,res){
    let user = userAuthenticate(req.cookies.userId);
    if(user == false){
        res.redirect('/');
    }
    else{
        let item_to_delete = req.params.x;
        let path =  __dirname+'/uploads/'+user+"_data/"+item_to_delete;
        connection.query("DELETE FROM "+ user + "_data WHERE name = '"+item_to_delete+"'",function(errrr,results){
            if(errrr){
                console.log(errrr);
                res.redirect('/');
            }
            else
            {
                fs.unlink(path,function(err){
                    if(err)
                        throw err;
                    else
                    {
                        res.redirect('/');
                    }
                });
            }
        });
        
    }
});


function userAuthenticate(sessinID){
    if(usermap.has(sessinID)){
        return usermap.get(sessinID);
    }
    else
        return false;
}