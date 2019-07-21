var models  = require('../models');

var router = require('express').Router();

var env = process.env.NODE_ENV || "development";
var path = require('path');
var config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];

var bCrypt = require('bcrypt-nodejs');

module.exports = function (io) {

//Create admin user def
var generateHash = function(password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
};

models.User.findOrCreate({where: {username: 'admin'}, defaults: { password: generateHash('admin'), email: 'admin@admin.com', fullname: 'admin'}})
.then(([admin, created]) => {
  // /*if (created)*/ console.log("Admin created at", admin.get('createdAt'));
});

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

router.get('/', (req, res) => {
  // res.send('Admin');
  res.render('admin', {user: req.user})
});

router.get('/start', (req, res) => {
  models.Problem.findAll({where: {ProblemsetId: 1}, attributes: ['id']}).then(firstProblems => {

  models.Team.findAll({
    attributes: ['id']
  }).then(async (teams) => {
    
  await asyncForEach(teams, async team => { 

    asyncForEach(firstProblems, async problem => { 
      
      models.Task.findOrCreate({where: {
        TeamId: team.id,
        ProblemId: problem.id
      }, defaults: {
        status: 'waitingForResearch'
      }}).then(([task, created]) => {
        if (!created && task.status != 'waitingForResearch') {
          task.status = 'waitingForResearch';
          task.save();
        }
      });
      
    });

  });
  
  }).finally(()=>{
    
      io.of('stock-exchange').emit('refresh');
      res.redirect('/admin');

  });
  });

});


router.get('/loadproblemsets', (req, res) => {
  
  for(var i=1; i<=3; i++) {
    models.Problemset.findOrCreate({where: {id: i}, defaults: {title: `${i}`}}).then(()=>{
  
    });;
  }
  res.redirect('/admin');
});

router.get('/loadproblems', (req, res) => {
  for(var i=1; i<=3; i++) {
  for (var j=1; j<=6; j++) {
    models.Problem.findOrCreate({where: {title: `Probléma ${i}.${j}`}, defaults: {topic: 'Logika', description: `Mennyivel egyenlő ${i}+${j}?`, solution: i+j, type: '1num', credit: 6*(3*i+j), researchCost: 1*(3*i+j), undertakeCost: 1*(3*i+j), timeLimit: 600, ProblemsetId: i}}).then(()=>{
    
    });
  }
  }

  res.redirect('/admin');
});

return router;
}