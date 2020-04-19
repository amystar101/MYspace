const express = require('express');
const ejs = require('ejs');
const bodyparser = require('body-parser');
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(fileUpload({
    createParentPath: true
}));
app.use(express.static('public'))


let userlogined = false,ismsg = false;
let user,uname,pwd,user_data,msg;

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
    if(userlogined == true){
        res.redirect('/home');
    }
    else{
        res.render("home.ejs",{
            msg:msg,
            ismsg:ismsg,
            login:userlogined,
            name:uname
        });
    }   
});

// logout
app.get('/logout',function(req,res){
    ismsg = true;
    if(userlogined == true)
        msg = "GOOD BYE";
    else
        msg = "PLEASE LOGIN FIRST";
    userlogined = false;
    user = "";
    res.redirect('/');
});

// login
app.post('/login',function(req,res){
    uname = req.body.uname;
    pwd = req.body.pwd;
    user = uname;
    connection.query("SELECT * FROM users WHERE uname = '"+uname+"' AND password = '" + pwd +"';",function(err,result,field){
        if(err){
            console.log("error at login");
            res.redirect('/');
        }
        else if(result.length == 0)
        {
            // user not found
            msg = "USER NOT EXIST OR PASSWORD IS INCORRECT";
            ismsg = true;
            res.redirect('/');
        }
        else
        {
            // user found , login him
            userlogined = true;
            res.redirect('/');    
        }
    });
});

app.get('/home',function(req,res){
    if(userlogined == true){
        connection.query("SELECT * FROM "+ user + "_data",function(err,results){
            if(err){
                console.log("error at here");
                throw err;
            }
            res.render("after_login.ejs",{
                login:true,
                name:uname,
                is_upload_msg:false,
                upload_msg:"",
                user_data:results,
                i:0
            });
        });
    }
    else{
        res.redirect('/');
    }
});



// signup
app.post('/signup',function(req,res){

    userlogined = false;

    uname = req.body.uname;
    let pwd = req.body.pwd;
    let email = req.body.email;
    let fname = req.body.fname;
    let  lname = req.body.lname;
    let q = "SELECT * FROM users WHERE uname = '";
    q += uname + "' OR email = '" + email +"'";
    connection.query(q,function(err,rows,fields){
        if(err)
        {
            ismsg = true;
            msg = "we found error while quering in database";
            res.redirect('/');
        }
        else
        {
            if(rows.length == 0)
            {
                connection.query("CREATE TABLE "+uname+"_data (name varchar(50) NOT NULL,address varchar(200) NOT NULL,PRIMARY KEY(name))",function(err){
                    if(err){
                        msg = "We got an error while fetching database , try again after sometime."
                        ismsg = true;
                        res.redirect('/');
                    }
                    else{
                        connection.query("INSERT INTO users VALUES ('"+uname+"','"+fname+"','"+lname+"','"+email+"','"+pwd+"')",function(err){
                            if(err){
                                msg = "We got error while inserting details on our database , try later";
                                ismsg = true;
                                res.redirect('/');
                            }
                            else{
                                msg = "NEW USER CREATED";
                                ismsg = true;
                                res.redirect('/');
                            }
                        });
                    }
                });
            }
            else{
                ismsg = true;
                msg = "username or email already exist";
                res.redirect('/');
            }
        }
    });

});

// about me page
app.get('/about',function(req,res){
    res.render("about.ejs",{
        login:userlogined,
        name:uname
    });
});

// contact page
app.get('/contact',function(req,res){
    res.render("contact.ejs",{
        login:userlogined,
        name:uname
    });
});

// delete user

app.post('/deleteuser',function(req,res){

    userlogined = false;

    uname = req.body.uname;
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
                                    ismsg = true;
                                    msg = "USER DELETED";
                                    res.redirect('/');
                                }
                                else{
                                    ismsg = true;
                                    msg = "SOME ERROR OCCURRED";
                                    res.redirect('/');
                                }
                            })
                        }
                        else{
                            ismsg = true;
                            msg = "USER NOT DELETED ";
                            res.redirect('/');
                        }
                    });
                }
                else{
                    ismsg = true;
                    msg = "SOME DETAILS ARE NOT MATCHED ";
                    res.redirect('/');
                }
            });
        }
        else
        {
            ismsg = true;
            msg = "USER NOT FOUND";
            res.redirect('/');
        }
    });
});

// upload user data

app.post('/upload',function(req,res){
    if(userlogined == false)
    {
        ismsg = true;
        msg = "PLEASE LOGIN FIRST";
        res.end();
    }
    else
    {
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
    if(userlogined == true){
        let requestedfile = req.params.x;
        let path = __dirname+'/uploads/'+user+"_data/"+requestedfile;
        res.download(path,requestedfile);
    }
    else
    {
        res.redirect('/');
    }
});

// delete user data

app.get('/delete/:x',function(req,res){
    if(userlogined == true)
    {
        let item_to_delete = req.params.x;
        let path =  __dirname+'/uploads/'+user+"_data/"+item_to_delete;
        connection.query("DELETE FROM "+ user + "_data WHERE name = '"+item_to_delete+"'",function(errrr,results){
            if(errrr){
                console.log(errrr);
                ismsg = true;
                msg = "WE GOT ERROR ON DELETING";
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
    else
    {
        res.redirect('/');
    }
});
