var _ = require('lodash');
var moment = require('moment');
var models  = require('../models');

module.exports = (io) => {

const nspStock = io.of('/stock-exchange');
nspStock.on('connection', (socket) => {
  var TeamId = socket.request.user.TeamId;
  socket.join('team#'+TeamId);
  updateTasks(socket, TeamId);

  socket.on('research', ProblemId => {
    models.Task.findOne({where: {TeamId: TeamId, ProblemId: ProblemId}, include: [{model: models.Problem, as: 'Problem'}, {model: models.Team, as: 'Team'}]}).then(async task => {
      if (task == null || task.status != 'waitingForResearch') return;
      if (task.Team.credits < task.Problem.researchCost) return socket.emit('err', `Nincs elég kredited a "${task.Problem.title}" nevű feladat felkutatásához!`);
      task.Team.credits -= task.Problem.researchCost;
      await task.Team.save();
      task.status = 'waitingForUndertake';
      await task.save();
      updateTasks(nspStock.to('team#'+TeamId), TeamId, task.Team.credits);
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
      updateTasks(nspStock.to('team#'+TeamId), TeamId, task.Team.credits);
    });
  });
});

const nspProblem = io.of('/problem');
nspProblem.on('connection', (socket) => {
  var TeamId = socket.request.user.TeamId;

  socket.on('timeSync', ProblemId => {
    models.Task.findOne({where: {TeamId: TeamId, ProblemId: ProblemId}, include: [{model: models.Problem, as: 'Problem'}]}).then(task => {
      if (task == null || task.status != 'available') return socket.emit('solutionResponse', true, 'Ez a feladat már nem elérhető számodra.');; // !!!
      socket.TaskId = task.id;
      socket.join(`team#${TeamId}#${socket.TaskId}`);
      socket.emit('timeSync', moment().format('YYYY-MM-DD HH:mm:ss ms'), task.expireDate);      
    });
  });

  socket.on('solution', guess => {
    if (!socket.TaskId || !guess || guess == '') return;
    models.Task.findByPk(socket.TaskId, {include: [{model: models.Problem, as: 'Problem'}, {model: models.Team, as: 'Team'}]}).then(task => {
      if (task == null || task.status != 'available') return;
      if (task.tries.split(';').includes(guess)) return socket.emit('solutionResponse', false, 'Ezt már próbáltad, de még mindig nem jó!')
      var isCorrect = guess == task.Problem.solution;
      task.tries = (task.tries == '') ? guess : task.tries + ';' + guess;
      if (isCorrect) {
        task.status = 'done';
        task.Team.credits += task.Problem.credit;
      }
      task.save().then(async () => {
        if (isCorrect) {
          await task.Team.save();
          updateTasks(nspStock.to('team#'+TeamId), TeamId, task.Team.credits);
          socket.emit('solutionResponse', true, 'Helyes megoldás.');
          // nspProblem.to(`team#${TeamId}#${socket.TaskId}`).emit('solutionResponse', true, 'Ezt a feladatot már megoldotta a csapatod!');
          socket.broadcast.to(`team#${TeamId}#${socket.TaskId}`).emit('solutionResponse', true, 'Ezt a feladatot már megoldotta a csapatod!');
        }
        else {
          socket.emit('solutionResponse', false, 'Helytelen megoldás.');
        }
        // if (isCorrect) nspPoblem.to(`team#${TeamId}#${socket.TaskId}`).emit('alreadySolved');
      });
    });
  });
});



function updateTasks(socket, TeamId, credits = null) {
  models.Task.findAll({
    where: {
      TeamId: TeamId
    },
    include: [{
      model: models.Problem,
      as: 'Problem',
      attributes: ['id', 'researchCost', 'undertakeCost', 'topic', 'credit', 'timeLimit', 'title'], 
    }],
    individualHooks: true
  }).then((tasks) => {
    // console.log(tasks);
    tasks.map(removeHiddenData);
    // tasks.forEach(task => {
    //   console.log(task.Problem.id, task.status);
    // });
    socket.emit('updateTasks', tasks, moment().format('YYYY-MM-DD HH:mm:ss ms'), credits);
  });
}

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
}

}