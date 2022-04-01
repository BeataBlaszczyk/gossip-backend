//jshint esversion:6

require("dotenv").config();
//const redis = require('redis');
//const connectRedis = require('connect-redis');
const cookieSession = require("cookie-session")
const cookieParser = require('cookie-parser')
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const session = require('express-session');
//let RedisStore = require("connect-redis")(session)
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const { cookie } = require("express/lib/response");
//const REDIS_PORT=6379;
app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cookieParser())
app.use(express.static("public"));
//app.set('view engine', 'ejs');

app.use(express.json());
app.set("trust proxy", 1)
app.use(function (req, res, next) {
  res.set('Cache-control', `no-cache`)
  //res.setHeader('Access-Control-Allow-Headers', 'Set-Cookie')
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'https://gossip-frontend.vercel.app');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);




  

  // Pass to next layer of middleware
  next();
});
app.use(function(req, res, next) {

  req.header("Access-Control-Allow-Origin", "https://gossip-frontend.vercel.app");
  req.header('Access-Control-Expose-Headers', ['Content-Range', 'Set-Cookie', 'X-Content-Range']);
  
  req.header('Access-Control-Allow-Origin', req.get('Origin'));
  req.header("Access-Control-Allow-Credentials: true");
  req.header("Access-Control-request-Methods: GET, POST");
  req.header("Access-Control-request-Headers", "Origin, Set-Cookie, X-Requested-With, Content-Type, Accept")
  
  req.header("Access-Control-Allow-Methods: GET, POST");
req.header("Access-Control-Allow-Headers", "Origin, Set-Cookie, X-Requested-With, Content-Type, Accept")
  //re



  res.header('Access-Control-Expose-Headers', ['Content-Range', 'Set-Cookie', 'X-Content-Range']);
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Origin', req.get('Origin'));
  res.header("Access-Control-Allow-Credentials: true");
  res.header("Access-Control-request-Methods: GET, POST");
res.header("Access-Control-request-Headers", "Origin, Set-Cookie, X-Requested-With, Content-Type, Accept")
  
res.header("Access-Control-Allow-Methods: GET, POST");
res.header("Access-Control-Allow-Headers", "Origin, Set-Cookie, X-Requested-With, Content-Type, Accept")
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors({
  origin: "https://gossip-frontend.vercel.app",
  methods: "GET, POST, PUT, DELETE",
  credentials:true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'set-cookie'],
  exposedHeaders: [
    "Set-Cookie",
    //... 
]
}));


app.use(session
  ({
    //store: new RedisStore({ client: redisClient }),
    secret: "our little secret.",
    resave: false,
    proxy: true,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      path: "/",
      httpOnly: false,
      hostOnly: false,
     //domain:"gossip-frontend.vercel.app",
      //secureProxy: true,
      secure: true, // true dla https,
      maxAge: 24*60*60*1000, //one day,
     
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//mongodb+srv://admin-beata:<password>@cluster0.yu0at.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
//"mongodb+srv://admin-beata:mleczyk123@cluster0.yu0at.mongodb.net/todolistDB"
mongoose.connect(
  "mongodb+srv://admin-beata:mleczyk123@cluster0.yu0at.mongodb.net/userDB",
  {
    useNewUrlParser: true,
  }
);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
});

const secretSchema = new mongoose.Schema({
  content: String,
  rating: Number,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//const secret = "Thisisourlittlesecret."
//userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);
const Secret = new mongoose.model("Secret", secretSchema);

passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser())
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:
        "https://desolate-forest-24784.herokuapp.com/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      enableProof: true,
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        "https://desolate-forest-24784.herokuapp.com/auth/facebook/secrets",
      enableProof: true,
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get(
  "/auth/facebook",

  passport.authenticate("facebook", { scope: "public_profile" })
);

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", {
    failureRedirect: "http://localhost:3000/login",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.json({ auth: true });
    //res.redirect('/secrets');
  }
);

// app.get("/submit",function(req, res){
//   if (req.isAuthenticated()){
//   res.render("submit")
//   }else{
//     res.redirect("/login")
//   }

//})

app.get("/submit", function(req,res){
  if (req.isAuthenticated()){
    res.cookie('connect.sid', "dupa", {hostOnly: false, path: "/", sameSite: "none", secure: true, maxAge: 0});

    return res.send("authorized")

} else{
  res.cookie('connect.sid', "dupa", {hostOnly: false, path: "/", sameSite: "none", secure: true, maxAge: 0});
 
    return res.send("unauthorized")
 }
})

app.post("/submit", function (req, res) {

  console.log(req.body.secret);

  const secret = new Secret({
    content: req.body.secret,
    rating: 0,
  });

  secret.save();
  Secret.update();

  //res.json(secret);
  res.redirect("secrets")
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.json({ auth: true }); //res.redirect('/secrets');
  }
);

// app.get("/", function(req, res) {
//   res.render("home");
// });

// app.get("/login", function(req, res) {
//   res.render("login");
// });

// app.get("/register", function(req, res) {
//   res.render("register");
// });

app.post("/register", function(req, res) {

User.register({username:req.body.username}, req.body.password, function(err, user){
  if(err){
    res.send(err);
    //res.redirect("http://localhost:3002/login");
  }else{
    passport.authenticate("local")(req,res, function(){
      //console.log("is auth => " + req.isAuthenticated())
      res.redirect("/cookie")
      //res.redirect("/secrets")
    })
  }
})

  });

  app.post("/secrets", function(req,res){
    console.log(req.body.cookie)
    //res.cookie("connect.sid", req.body.cookie, 
    //{maxAge: 24 * 60 * 60 * 1000, 
     //path: "/", sameSite: "none", secure: true}); 
     //res.cookie("username", "JohnDoe4", {hostOnly: false, path: "/", sameSite: "none", secure: true}); 
 //console.log(res.cookies)
      res.redirect("secrets")
      //res.send(req.body.cookie)
  })

  app.get("/secrets", function(req,res){
    //console.log("try secret)" + req.isAuthenticated())
    //res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true })
    //console.log(req.cookies.split('; '))
    

if (req.isAuthenticated()){
  res.cookie('connect.sid', "dupa", {hostOnly: false, path: "/", sameSite: "none", secure: true, maxAge: 0});
 
  Secret.find(function(err, foundSecrets){
    if (foundSecrets){
      //console.log(foundSecrets)
       return res.send (foundSecrets);
    }
  })
 } else{
  res.cookie('connect.sid', "dupa", {hostOnly: false, path: "/", sameSite: "none", secure: true, maxAge: 0});
 
    return res.send("unouthorized")
 }
 
  })
// app.post("/secrets", function (req, res) {

//   console.log((req.body))
//   console.log("JESTEM1")
//   if (req.body.auth) {
//     Secret.find(function (err, foundSecrets) {
//       console.log("JESTEM2")
//       if (foundSecrets) {
//         res.json(foundSecrets);
//         console.log(foundSecrets)
//       }
//     });
//   }
//   // } else {
//   //   res.redirect("http://localhost:3000/");
//   // }
// });


app.get("/login", passport.authenticate("local",{
  successRedirect: "",
  failureRedirect: "/"
}))

app.post("/login2", function(req, res) {
  const email = req.body.username;
  const password = req.body.password;

  console.log("trytolog")

const user = new User({
  username: email,
  password: password
})

console.log(user)




req.login(user, function(err) {
  console.log("is auth => " + req.isAuthenticated())
  if (err) { return next(err); }
 res.cookie("username", "JohnDoe1", {hostOnly: false, domain: 'https://gossip-frontend.vercel.app', path: "/login", sameSite: "none", secure: true}); 
 res.cookie("username", "JohnDoe2", {hostOnly: false, domain: 'gossip-frontend.vercel.app', path: "/", sameSite: "none", secure: true}); 
 res.cookie("username", "JohnDoe3", {hostOnly: false, domain:"" , path: "/", sameSite: "none", secure: true}); 
 res.cookie("username", "JohnDoe4", {hostOnly: false, path: "/", sameSite: "none", secure: true}); 
 
 res.cookie("connect.sid2", req.cookies["connect.sid"], {hostOnly: false, domain: 'gossip-frontend.vercel.app', path: "/", sameSite: "none", secure: true}); 
  res.send("done35" + req.isAuthenticated() )
 //return res.redirect("/secrets");
});

})

app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    //res.cookie("connect.sid2", req.cookies["connect.sid"], {hostOnly: false, domain: 'gossip-frontend.vercel.app', path: "/", sameSite: "none", secure: true}); 
    //res.send(res.cookies["connect.sid"])
  res.redirect("/cookie")
   //return res.redirect("/secrets");
  });

app.get("/cookie", function(req,res){
  res.send(req.cookies["connect.sid"]);
})

app.get("/logout", function (req, res) {
 try { req.logout() }
 finally {res.send("logout")}
 
  //res.redirect('/');
});

let port = process.env.PORT || 3001;
app.listen(port, function () {
  console.log("Successfully started on port 3001. ");
});

app.get("/", function(req,res){
  //res.redirect("https://gossip-frontend.vercel.app")
  res.send("unsuccessed login ! buu")
})