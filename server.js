var express    = require('express')
var app        = express()
var passport   = require('passport')
var session    = require('express-session')
const cookieParser = require('cookie-parser');
const SessionStore = require('connect-session-sequelize')(session.Store);
var passportSocketIo = require('passport.socketio');
var bodyParser = require('body-parser')
var env        = require('dotenv').config()
var flash    = require('connect-flash');

var path = require('path');
var config    = require(path.join(__dirname, 'app', 'config', 'config.json'))[process.env.NODE_ENV || "development"];

//For BodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Models
var models = require("./app/models");

var sequelizeSessionDB = models.sequelize;
const sequelizeSessionStore = new SessionStore({
    db: sequelizeSessionDB
});

// For Passport
app.use(cookieParser());
app.use(session({
    secret: config.sessionSecret,
    store: sequelizeSessionStore,
    resave: false,
    saveUninitialized: false
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './app/views/pages'))


var http = require('http').Server(app);
var io = require('socket.io')(http);
io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: config.sessionSecret,
    store: sequelizeSessionStore,
    passport: passport,
    cookieParser: cookieParser
    }));

require('./app/controllers/socketio')(io);

//Routes
require('./app/routes')(app,passport,io);

//load passport strategies
require('./app/controllers/passport')(passport,models.User);


//Sync Database
models.sequelize.sync(/*{force: true}*/).then(function(){
    console.log('Nice! Database looks fine')
}).catch(function(err){
    console.log(err,"Something went wrong with the Database Update!")
});

http.listen(config.port, function(err){
    if(!err)
    console.log("Site is live"); else console.log(err)
});