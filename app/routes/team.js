var models  = require('../models');

var router = require('express').Router();

var env = process.env.NODE_ENV || "development";
var path = require('path');
var config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];

module.exports = function (io) {

const nsp = io.of('/teamselection');
nsp.on('connection', (socket) => {
  updateTeams(socket);
  // console.log(socket.request.user);
  /*socket.on('fetchTeams', () => {
  });*/
});

// var _ = require('lodash');

function updateTeams(socket = nsp) {
  models.Team.findAll({attributes: ['id', 'name'], include: [ {model: models.User, as: 'Members', attributes: ['fullname']} ], order: [['name', 'ASC']]}).then(teams => {
    //teams = _.map(teams, _.partial(_.pick, _, ['id', 'name', 'Members']));
    /*teams.forEach(team => {
        team.Members = _.map(team.Members, _.partial(_.pick, _, ['fullname']));
    });*/
    socket.emit('updateTeams', teams)
  });    
}

// ? dev ?
router.get('/dev', (req, res) => {
  updateTeams();
  res.end('OK');
});

router.get('/all', (req, res) => {
  res.render('teamselection', {
    user: req.user,teams: [],config: {maxPlayers: config.game.maxPlayers}, messages: {teamJoinMessage: [],teamCreateMessage: []}
  });
});

router.get('/', (req, res) => {
  models.User.findByPk(req.user.id).then(user => {
    user.getTeam().then(team => {
      if (!team) {
        //models.Team.findAll({include: [ {model: models.User, as: 'Members'} ]}).then(teams => {
        res.render('teamselection', {
          user: req.user, 
          teams: [], 
          config: {
            maxPlayers: config.game.maxPlayers
          }, 
          messages: {
            teamJoinMessage: req.flash('teamJoinMessage'),
            teamCreateMessage: req.flash('teamCreateMessage')
          }
        });
        //});
      }
      else {
        res.render('team', {user: req.user, team: team});
      } 
    });
  });
});

function getRandomInt(min, max) {
    return Math.floor( Math.random() * ( 1 + max - min ) ) + min;
}

// Csapat létrehozása és a felhasználó hozzáadása
router.post('/', (req, res) => {
  models.Team.create({name: req.body.teamname, password: getRandomInt(1000,9999), credits: 10}).then(team => {
    models.User.findByPk(req.user.id).then(user => {
      user.setTeam(team).then(() => {
        res.redirect('/team');
        //socket.io
        updateTeams();
      });
    });
  }).catch(require('sequelize').ValidationError, (err) => {
    req.flash('teamCreateMessage', err.errors[0].message);
    req.session.save(function () {
      res.redirect('/team');
    });
  });
});

router.get('/join', (req, res) => {
  if (req.query.teamId == undefined || req.query.code == undefined) return res.end('Hianyzo adatok.');
  models.User.findByPk(req.user.id).then(user => {
    models.Team.findByPk(req.query.teamId, {include: [ {model: models.User, as: 'Members'} ]}).then(team => {
      if (!team) res.end('Nem letezik ilyen ID-ju csapat.');
      else if (team.Members.length >= config.game.maxPlayers) {
        req.flash('teamJoinMessage', 'A csapat tele van.');
        req.session.save(function () {
          res.redirect('/team');
        });
      }
      else if (team.password == req.query.code) {
        user.setTeam(req.query.teamId).then(()=>{
          res.redirect('/team');
          //socket.io
          updateTeams();
        });
      }
      else {
        req.flash('teamJoinMessage', 'Helytelen beléptetőkód!');
        req.session.save(function () {
          res.redirect('/team');
        });
      }
    });
  })
});

router.get('/leave', (req, res) => {
  models.User.findByPk(req.user.id).then(user => {
    user.getTeam().then(team => {
      if (!team) res.redirect('/team');
      else team.getMembers().then(members => {
        if (members.length == 1 && false) team.destroy(); //DEV
        else user.setTeam(null).then(() =>{
          res.redirect('/team');
          //socket.io
          updateTeams();
        });
      })
    });
  })
});

return router;
}