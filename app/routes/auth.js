// var authController = require('../controllers/authcontroller.js');

module.exports = function(passport){

var router = require('express').Router();

router.get('/signup', (req, res) => {
    res.render('signup', {user: req.user, message: req.flash('signUpMessage')}); 
});

router.post('/signup', passport.authenticate('local-signup',  { 
    successRedirect: '/',
    failureRedirect: '/auth/signup',
    failureFlash: true
}));

router.get('/login', (req, res) => {
    var m = req.flash('loginMessage');
    // console.log(m);
    res.render('login', {user: req.user, message: m}); 
});

router.post('/login', passport.authenticate('local-signin',  {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash : true
}));

router.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
        res.redirect('/');
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/auth/login');
}

return router;

}