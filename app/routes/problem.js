var models  = require('../models');

var router = require('express').Router();

var moment = require('moment');
module.exports = (io) => {

// const nsp = io.of('/problem');
// nsp.on('connection', (socket) => {
//   // console.log(socket.request.task)
//   var TeamId = socket.request.user.TeamId;
//   // var TaskId;
//   socket.join('team#'+TeamId);
  
//   socket.on('timeSync', ProblemId => {
//     models.Task.findOne({where: {TeamId: TeamId, ProblemId: ProblemId}, include: [{model: models.Problem, as: 'Problem'}]}).then(task => {
//       if (task == null || task.status != 'available') return;
//       socket.TaskId = task.id;
//       socket.emit('timeSync', moment().format('YYYY-MM-DD HH:mm:ss ms'), task.expireDate);      
//     });
//   });

//   socket.on('solution', guess => {
//     if (!socket.TaskId || !guess || guess == '') return;
//     models.Task.findByPk(socket.TaskId, {include: [{model: models.Problem, as: 'Problem'}, {model: models.Team, as: 'Team'}]}).then(task => {
//       if (task == null || task.status != 'available') return;
//       if (task.tries.split(';').includes(guess)) return socket.emit('solutionResponse', false, 'Ezt már próbáltad, de még mindig nem jó!')

//       // console.log(guess);

//       var isCorrect = guess == task.Problem.solution;

//       task.tries = (task.tries == '') ? guess : task.tries + ';' + guess
//       if (isCorrect) {
//         task.status = 'done';
//         task.Team.credits += task.Problem.credit;
//       }
//       task.save().then(async () => {
//         if (isCorrect) {
//           await task.Team.save();
//         }
//         socket.emit('solutionResponse', isCorrect);
//       });
//     });
//   });


//   // updateTasks(socket);
// });


//DEV:
var d = [[2, 1200], [6, 20], [7, 4000]];
d.forEach(e => {
  if (e[1] != -1) models.Task.findByPk(e[0], {hooks:false}).then(task => {
    task.status = 'available';
    task.expireDate = moment().add(e[1], 'seconds');//.format('YYYY-MM-DD HH:mm:ss');
    // console.log(task.expireDate);
    task.save().then(() => {
      // console.log(moment().format("HH:mm:ss"), '> setted to ', moment(task.expireDate).format('HH:mm:ss'));
    });
  });
});
models.Task.update({tries: ''}, {where: {}});



var _ = require('lodash');
router.get('/', (req, res) => {
  req.team.getMembers({attributes: ['fullname']}).then((m) => {
    res.render(`problems/${req.task.Problem.type}`, {
      user: req.user, team: _.pick(req.team, ['id', 'name', 'credits']), task: req.task, teamMembers: _.map(m,'fullname'),
      message: req.flash('errorMessage')
    });
  });
    //res.render(`problems/${req.task.Problem.type}`, {user: req.user, team: req.team, task: req.task, message: req.flash('errorMessage')});
});

return router;

}