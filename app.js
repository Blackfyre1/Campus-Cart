var express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const { config } = require('process');
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
var cors = require('cors');
const bcrypt = require('bcrypt');
const notifier = require('node-notifier')
const { StringDecoder } = require('string_decoder');
const secretKey = 'secret';

mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://admin:xhBJxsjAn8oLKR6k@main.dttg1p4.mongodb.net/CampusCart');
const adminKey = 'admin';
const userKey = 'user';

var signUpSchema = new mongoose.Schema({
    email: String,
    fname: String,
    lname: String,
    phno: String,
    password: String
   });

var productschema = new mongoose.Schema({
    name: String,
    img:String,
    description: String,
    condition: String,
    exp_price: Number
})
var contactSchema = new mongoose.Schema({
    email: String,
    description: String,
})

var userProductSchema = new mongoose.Schema({
    UserID: String,
    ProductID: Array,
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

var SignUp = mongoose.model("SignUp", signUpSchema,"SignUp");
var Product = mongoose.model("Product", productschema,"Product");
var Contact = mongoose.model("Contact", contactSchema,"Contact");
var UserProduct = mongoose.model("UserProductRelation", userProductSchema,"UserProductRelation");


var app = express();
const port = 3000;

const createAdminToken = (payload) => {
    return jwt.sign(payload, adminKey, { expiresIn: '1h' });
  };

const verifyAdminToken = (token) => {
    return jwt.verify(token, adminKey);
  };

const createUserToken = (payload) => {
    return jwt.sign(payload, userKey, { expiresIn: '1h' });
  };

const verifyUserToken = (token) => {
    return jwt.verify(token, userKey);
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

var upload = multer({ 
    storage: storage,
    dest: __dirname + "uploads"
 })

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('pages'));
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname));
app.use(cookieParser());

app.post('/signup', async function (req, res) {
    var myData = new SignUp(req.body);
    var salt = await bcrypt.genSalt();
    myData.password = await bcrypt.hash(req.body.password, salt);
    myData.save()
    .then(item => {
        res.redirect("/");
    })
    .catch(err => {
    res.status(400).send("unable to save to database");
    });
});

app.post('/login_admin', async (req, res) => {
    await SignUp.find({"email":req.body.email, "admin":true}).then(async (User) => {
        console.log(User);
        if(User != '')
        {
            if (await bcrypt.compare(req.body.password,User[0].password)) {
                token = createAdminToken({User},config.adminKey);
                console.log('Token:', token);
                res.cookie('loginemail',req.body.email);
                res.cookie('auth',token);
                res.redirect('/admin');
            }
            else
            {
                notifier.notify(
                    {
                      title: 'Campus Cart',
                      message: 'Invalid Credentials',
                    });
                res.redirect("/login_admin");
            }
        }
        else
        {
            notifier.notify(
                {
                  title: 'Campus Cart',
                  message: 'Invalid Credentials',
                });
            res.redirect("/login_admin");
        }
    }).catch((error)=>{
        console.log(error);
        res.json({
            error: "Account not found"
        }).status(400);
    })
});

app.post('/login_user', (req, res) => {
    SignUp.find({"email":req.body.email}).then(async (User) => {
        if(User != '')
        {
            if (await bcrypt.compare(req.body.password,User[0].password)) {
            token = createUserToken({User},config.userKey);
            console.log('Token:', token);
            res.cookie('loginemail',req.body.email);
            res.cookie('email',req.body.email);
            res.cookie('auth',token);
            console.log(req.cookies.auth);
            res.redirect('/userdashboard');
            }
        }
        else
        {
            notifier.notify(
                {
                  title: 'BDA Labs',
                  message: 'Invalid Credentials',
                });
            res.redirect("/login_user");
        }
    }).catch((error)=>{
        console.log(error);
        res.json({
            error: "Account not found"
        }).status(400);
    })
});

app.post('/Contact',async (req, res) => {
    console.log(req.body)
    var myData = new Contact(req.body);
    if(req.cookies.loginemail != '')
    {
        myData.email = req.cookies.loginemail;
        await myData.save();
        res.redirect('/userdashboard');
    }
    else
    {
        console.log(myData)
        await myData.save();
        res.redirect('/');
    }
    })

app.post('/productInput',upload.single("image"),async (req, res) => {
    var x = Math.random().toString(36).slice(2, 12) + '.png';
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./uploads/" + x);
    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
        fs.rename(tempPath, targetPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(200)
            .contentType("text/plain")
            .end("File uploaded!");
        });
      } else {
        fs.unlink(tempPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(403)
            .contentType("text/plain")
            .end("Only .png files are allowed!");
        });
      }

    var myData = new Product({
        name: req.body.name,
        description: req.body.description,
        condition: req.body.condition,
        exp_price: req.body.exp_price,
        img: x
    });
        myData.save()
        var x = await SignUp.findOne({email:req.cookies.loginemail});
        console.log(x);
        doc = await UserProduct.findOne({UserID:x._id});
        console.log(doc);
        if(doc === null){
            var userrel = UserProduct({
                UserID: x._id,
                ProductID: myData._id
            })
            userrel.save();
            console.log(userrel);
        }
        else
        {
            doc.ProductID.push(myData);
            userrel = await UserProduct.findOneAndUpdate({ID:x._id},doc,{new: true});
        }
});

app.get('/', function (req, res) {
    let x = path.join(__dirname);
    res.sendFile(x + '/pages/index.html');
});

app.get('/login_admin', function (req, res) {
    let x = path.join(__dirname);
    res.sendFile(x + '/pages/login_admin.html');
});

app.get('/admin', function (req, res) {
    try {
        var token = req.cookies.auth;
        console.log(token);
        const decoded = verifyAdminToken(token);
        console.log('Decoded:', decoded);
        let x = path.join(__dirname);
        res.sendFile(x + '/pages/admin.html');
      }
      catch (error) {
        res.status(400).send('Error: Admin Login not detected.');
      }
});

app.get('/userdashboard', function (req, res) {
    console.log(req.cookies.auth);
    try {
        // var token = req.cookies.auth;
        // console.log(token);
        // const decoded = verifyUserToken(token);
        // console.log('Decoded:', decoded);
        let x = path.join(__dirname);
        res.sendFile(x + '/pages/user.html');
      }
      catch (error) {
        res.status(400).send('Error: User Login not detected.');
      }
});

app.get('/login_user', function (req, res) {
    let x = path.join(__dirname);
    res.sendFile(x + '/pages/login_user.html');
});



app.get('/logout',(req,res)=>{
    res.cookie('loginemail','');
    res.cookie('email','');
    res.cookie('auth','');
    res.redirect('/');
})

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
app.get('/contacts', (req, res) => {
    Contact.find({}).then((allContacts) => {
        console.log(allContacts)
       res.status(200).json(allContacts);
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

app.get('/product', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const criteria = req.query ; 
    // console.log(criteria.name + " fewfwefewfwefwefwfwefewfew")
    // MyModel.findOne({ name: { $regex: new RegExp('^myname$', 'i') } }).collation({ locale: 'en', strength: 2 });
    Product.find({name: criteria.name}).collation({ locale: 'en', strength: 2 }).then(( Products) => {
        console.log(Products)
        res.status(200).json(Products)
    }).catch((e)=>{
        console.log("Unable to load people!")
        res.status(400).send(e)
    })
});

app.get('/relations',(req,res)=>{
UserProduct.find().then((data)=>{
    res.status(200).json(data)
})
})

app.get('/userProduct', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const criteria = req.cookies.loginemail; 
    // console.log(criteria.name + " fewfwefewfwefwefwfwefewfew")
    // MyModel.findOne({ name: { $regex: new RegExp('^myname$', 'i') } }).collation({ locale: 'en', strength: 2 });
    const user = await SignUp.findOne({email: "IIT2021153@iiita.ac.in"})
    console.log("usr is"+ user)
    const prodcts = await UserProduct.findOne({UserID: user._id}).then(( Products) => {
        console.log(Products)
        res.status(200).json(Products.ProductID)
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
    if(req.cookies.loginemail != '')
    {
        res.sendFile(x + '/contactloggedin.html');
    }
    else
    {
        res.sendFile(x + '/contact.html');
    }
});

app.get('/productform', function (req, res) {
    try
    {
        var token = req.cookies.auth;
        console.log(token);
        const decoded = verifyUserToken(token);
        let x = path.join(__dirname,'pages');
        res.sendFile(x + '/productdetails.html');
    }
    catch (error) {
        res.status(400).send('Error: User Login not detected.');
      }
});

app.get('/shop', function (req, res) {
    try
    {
        var token = req.cookies.auth;
        console.log(token);
        const decoded = verifyUserToken(token);
        let x = path.join(__dirname,'pages');
        res.sendFile(x + '/shoploggedin.html');
    }
    catch (error) {
        let x = path.join(__dirname,'pages');
        res.sendFile(x + '/shop.html');
      }
});

app.get('/productdetails', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/product details.html');
});

app.get('/about', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/aboutus.html');
});
app.get('/pageAdmin', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/admin.html');
});
app.get('/pageUser', function (req, res) {
    let x = path.join(__dirname,'pages');
    res.sendFile(x + '/user.html');
});
app.get('/deleteContact',function (req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('id is ' + req.query.id)
    Contact.deleteOne({_id: req.query.id}).then(()=>{
        console.log("done")
    }).catch((e)=>{
        res.send("ERROR #)#")
    })
    res.status(200).send('success')
    console.log("successfull")
})
app.get('/deleteProduct',function (req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('id is ' + req.query.id)
    Product.deleteOne({_id: req.query.id}).then(()=>{
        console.log("done")
    }).catch((e)=>{
        res.send("ERROR #)#")
    })
    res.status(200).send('success')
    console.log("successfull")
})

app.listen(port, () => console.log(`This app is listening on port ${port}`));