var express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const { config } = require('process');
const multer = require("multer");
const fs = require("fs");
var cors = require('cors');
const secretKey = 'secret';

mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://admin:xhBJxsjAn8oLKR6k@main.dttg1p4.mongodb.net/CampusCart");

var signUpSchema = new mongoose.Schema({
    email: String,
    fname: String,
    lname: String,
    phno: String,
    admin: Boolean,
    password: String
   });

var loginSchema = new mongoose.Schema({
    email: String,
    password: String
   });

var productschema = new mongoose.Schema({
    name: String,
    email: String,
    img:
    {
        data: Buffer,
        contentType: String
    },
    description: String,
    phno: String,
    condition: String
})

module.exports={     
    fetchData:function(callback){
       var Login = Login.find({});
       userData.exec(function(err, data){
           if(err) throw err;
           return callback(data);
       })
       
    }
}

var Login = mongoose.model("Login", loginSchema,"Login");
var SignUp = mongoose.model("SignUp", signUpSchema,"SignUp");
var Product = mongoose.model("Product", productschema,"Product");

var app = express();
const port = 3000;

const createToken = (payload) => {
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
  };

const verifyToken = (token) => {
    return jwt.verify(token, secretKey);
  };
var token = "";
console.log(path.join(__dirname,'/uploads/'));
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname,'/uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
  })

var upload = multer({ storage: storage })

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('pages'));
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname));

app.post('/signup', (req, res) => {
    console.log(req.body)
    var myData = new SignUp(req.body);
    var x;
    var flag = true;
    if(req.body.email.startsWith("IIT") || req.body.email.startsWith("IEC"))
    {
        myData.admin = false;
    }
    else
    {
        myData.admin = true;
    }
    myData.save()
    .then(item => {
    res.send("Signup successful");
    })
    .catch(err => {
    res.status(400).send("unable to save to database");
    });
});

app.post('/login', (req, res) => {
    SignUp.find({"email":req.body.email,"password":req.body.password}).then((User) => {
        console.log(User)
        token = createToken({User},config.secretKey);
        console.log('Token:', token);
        res.redirect('/');
    }).catch((error)=>{
        console.log(error);
        res.json({
            error: "Account not found"
        }).status(400);
    })
});

app.post('/productInput', function(req, res,next) {
    upload.single('img')(req, res, function (error) {
        if (error) {
          console.log(`upload.single error: ${error}`);
          return res.sendStatus(500);
        }
    
    var myData = new Product({
        name: req.body.name,
        description: req.body.description,
        email: req.body.email,
        phno: req.body.phno,
        // img: {
        //     data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        //     contentType: 'image/png'
        // }
    });
    myData.save()
    .then(item => {
    res.send("Product saved successfully");
    })
    .catch(err => {
    res.status(400).send("unable to save to database");
    });
    
    });
});


app.get('/user', (req, res) => {
    console.log(req.query.email)
    SignUp.find({email: req.query.email}).then((User) => {
       res.status(200).json(User);
    }).catch((error)=>{
        res.json({
            error: "Unable to load the user!"  
        }).status(400);
    })
});
app.get('/users', (req, res) => {
    SignUp.find({}).then((allUsers) => {
        console.log(allUsers)
       res.status(200).json(allUsers);
    }).catch((error)=>{
        res.json({
            error: "Unable to load the user!"  
        }).status(400);
    })
});
app.get('/products', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    Product.find().then(( allProducts) => {
        console.log(allProducts)
        res.status(200).json(allProducts)
    }).catch((e)=>{
        console.log("Unable to load people!")
        res.status(400).send(e)
    })
});


app.get('/signup', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/signup.html');
});

app.get('/login', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/login.html');
});

app.get('/contact', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/contact.html');
});

app.get('/productform', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/productdetails.html');
});

app.get('/shop', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/shop.html');
});

app.get('/productdetails', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/product details.html');
});

app.get('/about', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/aboutus.html');
});

app.listen(port, () => console.log(`This app is listening on port ${port}`));