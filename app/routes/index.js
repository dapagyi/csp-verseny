var models = require('../models');
var express = require('express');
var path = require('path');

module.exports = (app,passport,io) => {
  
  app.use('/', require('./home.js'));
  app.use('/auth', require('./auth.js')(passport));
  app.use('/team', isLoggedIn, require('./team.js')(io));
  app.use('/stock-exchange', isLoggedIn, hasTeam, require('./stock-exchange.js')(io));
  app.use('/problem/:id', isLoggedIn, hasTeam, isProblemAvailableForTeam, require('./problem.js')(io));
  
  app.use('/static', express.static(path.join(__dirname, '../static/public')));
  app.use('/static-secured/:id/', isLoggedIn, hasTeam, isProblemAvailableForTeam, express.static(path.join(__dirname, '../static/secured')));
  
  
  app.use('/admin', isLoggedIn, isAdmin, require('./admin.js')(io));

  function isLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) res.redirect('/auth/login');
    else {
      models.User.findByPk(req.user.id).then(user => {
        req.user = user;
        req.user.isAdmin = false;
        next();
      });
    }
  }
  
  function hasTeam(req, res, next) {
    // models.User.findByPk(req.user.id).then(user => {
      // req.user = user;
      req.user.getTeam().then(team => {
        if (!team) res.redirect('/team');
        else {
          req.team = team;
          next();
        }
      });
    // });
  }

  // var moment = require('moment');
  function isProblemAvailableForTeam(req, res, next) {
    models.Task.findOne({where: {ProblemId: req.params.id, TeamId: req.team.id}, include: [{
      model: models.Problem,
      as: 'Problem'
    }]}).then(task => {
      if (task == null || task.status != 'available') {
        req.flash('errorMessage', 'A feladat nem létezik, vagy nem elérhető számodra.')
        req.session.save(function () {
          res.redirect('/stock-exchange');
        });
      }
      else {
        req.task = task;
        next();
      }
    });
  }

  function isAdmin(req, res, next) {
    if (req.user.username == 'admin') {
      req.user.isAdmin = true;
      next();
    }
    else res.sendStatus(403);
  }
}