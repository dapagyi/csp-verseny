
  //load bcrypt
  var bCrypt = require('bcrypt-nodejs');

  module.exports = function(passport,user){

  var User = user;
  var LocalStrategy = require('passport-local').Strategy;

  passport.serializeUser(function(user, done) {
          done(null, user.id);
      });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
      User.findByPk(id).then(function(user) {
        if(user){
          done(null, user.get());
        }
        else{
          done(user.errors,null);
        }
      });
  });

  passport.use('local-signup', new LocalStrategy(
    {           
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done){
      var generateHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
      };
      User.findOne({where: {username:username}}).then(function(user){
      if(user)
      {
        // return done(null, false, {message : 'That email is already taken'} );
        return done(null, false, req.flash('signUpMessage', 'Ez a felhasználónév foglalt. Próbálj meg <a href="/auth/login">bejelentkezni.</a>'));
      }
      else
      {
        var userPassword = generateHash(password);
        var data ={
          username: username,
          fullname: req.body.fullname,
          email: req.body.email,
          password: userPassword
        };

        User.create(data).then(function(newUser,created){
          if(!newUser){
            return done(null,false);
          }
          if(newUser){
            return done(null,newUser); 
          }
        }).catch(require('sequelize').ValidationError, (err) => {
          console.log(err);
          return done(null, false, req.flash('signUpMessage', 'Hiba történt a regisztráció során.'));
        });
      }
    }); 
  }
  ));
    
  //LOCAL SIGNIN
  passport.use('local-signin', new LocalStrategy( 
  {
  // by default, local strategy uses username and password, we will override with email
  usernameField : 'username',
  passwordField : 'password',
  passReqToCallback : true // allows us to pass back the entire request to the callback
  },

  function(req, username, password, done) {
    process.nextTick(function() {
    var User = user;
    var isValidPassword = function(userpass,password){
      return bCrypt.compareSync(password, userpass);
    }
    User.findOne({ where : { username: username}}).then(function (user) {
      if (!user) {
        // return done(null, false, { message: 'Email does not exist' });
        // console.log(Date.now(), 'A fiók nem létezik.');
        req.flash('loginMessage', 'A fiók nem létezik. <a href="/auth/signup">Itt regisztrálhatsz.</a>')
        req.session.save(function () {
          return done(null, false, );
        });
        // req.flash('loginMessage', 'A fiók nem létezik. <a href="/auth/signup">Itt regisztrálhatsz.</a>');
        // req.session.save(function () {
        //   // res.redirect('/team');
        //   return done(null, false, {message: 'Email dos not exist'});
        // });
      }
      else if (!isValidPassword(user.password,password)) {
        // return done(null, false, { message: 'Incorrect password.' });
        //return done(null, false, req.flash('loginMessage', 'Helytelen jelszó.'));
        req.flash('loginMessage', 'Helytelen jelszó.')
        req.session.save(function () {
          return done(null, false, );
        });
      }
      else {
        var userinfo = user.get();
        return done(null,userinfo);
      }

    }).catch(function(err){
      console.log("Error:",err);
      return done(null, false, req.flash('loginMessage', 'Hiba történt a bejelentkezés során.'));
    });
    });
  }
  ));

  }