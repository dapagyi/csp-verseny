var models  = require('../models');

var router = require('express').Router();

module.exports = (io) => { 

const nsp = io.of('/stock-exchange');
nsp.on('connection', (socket) => {
  var TeamId = socket.request.user.TeamId;
  // console.log(socket.request.user.TeamId, ' socket connected');
  socket.join('team#'+TeamId);
  updateTasks(socket, TeamId);

  socket.on('research', ProblemId => {
    // console.log(socket.request.user);
    models.Task.findOne({where: {TeamId: TeamId, ProblemId: ProblemId}, include: [{model: models.Problem, as: 'Problem'}, {model: models.Team, as: 'Team'}]}).then(async task => {
      if (task == null || task.status != 'waitingForResearch') return;
      if (task.Team.credits < task.Problem.researchCost) return socket.emit('err', `Nincs elég kredited a "${task.Problem.title}" nevű feladat felkutatásához!`);
    
      task.Team.credits -= task.Problem.researchCost;
      await task.Team.save();
      task.status = 'waitingForUndertake';
      await task.save();
      updateTasks(nsp.to('team#'+TeamId), TeamId, task.Team.credits);

    });
  });

  socket.on('undertake', ProblemId => {
    models.Task.findOne({where: {TeamId: TeamId, ProblemId: ProblemId}, include: [{model: models.Problem, as: 'Problem'}, {model: models.Team, as: 'Team'}]}).then(async task => {
      if (task == null || task.status != 'waitingForUndertake') return;
      if (task.Team.credits < task.Problem.undertakeCost) return socket.emit('err', `Nincs elég kredited a "${task.Problem.title}" nevű feladat elvállalásához!`);
      
      task.Team.credits -= task.Problem.undertakeCost;
      await task.Team.save();
      task.status = 'available';
      task.expireDate = moment().add(task.Problem.timeLimit,'seconds').format('YYYY-MM-DD HH:mm:ss');
      await task.save();
      updateTasks(nsp.to('team#'+TeamId), TeamId, task.Team.credits);
    
    });
  });

});

var _ = require('lodash');


var moment = require('moment');
function updateTasks(socket, TeamId, credits = null) {
  // var obj = Object.keys(io.sockets.adapter.sids[socket.id]).filter(item => item!=socket.id);
  // console.log(obj);
  models.Task.findAll({
    where: {
      TeamId: TeamId
    },
    include: [{
      model: models.Problem,
      as: 'Problem',
      attributes: ['id', 'researchCost', 'undertakeCost', 'topic', 'credit', 'timeLimit'], 
    }],
    individualHooks: true
  }).then(/*async*/ (tasks) => {
    // console.log('after hook', tasks[1].status, tasks[1].Problem.title);
    // console.log()
    /*
    const start = async () => {
      await asyncForEach(tasks, async (task) => {
        if (task.status == 'available' && moment(task.expireDate).diff(moment(), 'seconds') < 0) {
          task.status = 'missed';
        }
        await task.save().then(()=>{
          processTask(task);
        });
        // console.log(task.id);
      });
    }
    await start();*/
    tasks.forEach(task => removeHiddenData(task));
    /*

    NOTE: ezen a ponton talán inkább a socket-nek kéne válaszolni közvetlenül
    
    a paraméterek lehetnének: csapat ID, cél <- ez lehet egyetlen socket is,
      vagy egy csapat egy namespacen; ide küldünk az emit-tel
    
      oldalbetöltésnél csak a socketnek kell küldeni,
      kutatás vagy elfogadás esetén pedig az egész csapatnak
    
    */
    // console.log('after hook', tasks[1].status, tasks[1].Problem.id);
    socket.emit('updateTasks', tasks, moment().format('YYYY-MM-DD HH:mm:ss ms'), credits);
    // console.log('Done');
  });
}

/*
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
*/

function removeHiddenData(task){
  
  let remainingAttributes;
  switch (task.status) {
    case 'locked':
      remainingAttributes = ['id'];
      break;
    case 'waitingForResearch':
      remainingAttributes = ['id', 'researchCost'];
      break;
    case 'done':
    case 'missed':
      remainingAttributes = ['id', 'topic'];
      break;
    case 'waitingForUndertake':
    case 'available':
      remainingAttributes = ['id', 'undertakeCost', 'topic', 'credit', 'timeLimit'];
      break;
  }
  task.Problem.dataValues = _.pick(task.Problem.dataValues, remainingAttributes);
  // console.log(task.Problem);
}

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