var models  = require('../models');

var router = require('express').Router();

module.exports = (io) => { 

var _ = require('lodash');

router.get('/', (req, res) => {
  models.Problemset.findAll({
    include: [{ 
      model: models.Problem,
      as: 'Problems', 
      attributes: ['id', 'title'], 
      // order: [['title', 'ASC']] 
    }],
    attributes: ['id', 'title'], 
    order: [
      ['title', 'ASC'],
      // [ models.Problem, 'title', 'ASC']
      [{model: models.Problem, as: 'Problems'}, 'title', 'ASC']
    ]
  }).then(problemsets => {
    req.team.getMembers({attributes: ['fullname']}).then((m) => {
      res.render('stock-exchange', {
        user: req.user, team: _.pick(req.team, ['id', 'name', 'credits']), teamMembers: _.map(m,'fullname'),
        problemsets: problemsets,
        message: req.flash('errorMessage')
      });
    });
  });    
});


router.get('/problem/:id', (req, res) => {
  
});

return router;

}