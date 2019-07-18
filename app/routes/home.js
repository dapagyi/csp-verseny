var models  = require('../models');

var router = require('express').Router();

router.get('/', (req, res) => {
    // res.redirect('/stock-exchange');
    res.render('home', {user: req.user});
});

router.get('/profile', isLoggedIn , (req, res) => {
    res.render('profile', {user: req.user}); 
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/auth/login');
}

module.exports = router;






