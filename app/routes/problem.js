var models  = require('../models');

var router = require('express').Router();

var moment = require('moment');
module.exports = (io) => {

const nsp = io.of('/problem');
nsp.on('connection', (socket) => {
  // console.log(socket.request.task)
  socket.join('team#'+socket.request.user.TeamId);
  socket.emit('timeSync', moment().format('YYYY-MM-DD HH:mm:ss ms'));
  // updateTasks(socket);
});


//DEV:
var d = [[2, 300], [6, 65], [7, 4000]];
d.forEach(e => {
  if (e[1] != -1) models.Task.findByPk(e[0], {hooks:false}).then(task => {
    task.status = 'available';
    task.expireDate = moment().add(e[1], 'seconds');//.format('YYYY-MM-DD HH:mm:ss');
    // console.log(task.expireDate);
    task.save().then(() => {
      console.log(moment().format("HH:mm:ss"), '> setted to ', moment(task.expireDate).format('HH:mm:ss'));
    });
  });
});




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