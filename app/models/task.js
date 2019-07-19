
module.exports = function(sequelize, Sequelize) {

	var Task = sequelize.define('Task', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
		tries: {type:Sequelize.TEXT, allowNull: false, defaultValue: ''},
		status: {type: Sequelize.ENUM('locked', 'waitingForResearch', 'waitingForUndertake', 'available', 'done', 'missed'), allowNull: false },
		expireDate: {type: Sequelize.DATE, allowNull: false}
	});

	Task.associate = function(models) {
    models.Task.belongsTo(models.Team, {as: 'Team'});
		models.Task.belongsTo(models.Problem, {as: 'Problem'});
	};

	var moment = require('moment');
	Task.addHook('afterFind', async (tasks) => {
		if (tasks == null) return;
		if (!Array.isArray(tasks)) tasks=[tasks];
		
    const start = async () => {
      await asyncForEach(tasks, async (task) => {
				if (task.status == 'available' && moment(task.expireDate).diff(moment(), 'seconds') < 0) {
					// console.log(task.id, moment(task.expireDate).diff(moment(), 'seconds'));
					// console.log(task.id, moment().format('HH:mm:ss'), moment(task.expireDate).format('HH:mm:ss'));
					task.status = 'missed';
					await task.save();
					// console.log(task.id, 'updated');
				}
      });
    }
    await start();
		// console.log('data preprocess done');
		
	});
	
	async function asyncForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	}

/*
	Task.beforeQuery((task, options) => {
		console.log(task, options);
		return hashPassword(user.password).then(hashedPw => {
			user.password = hashedPw;
		});
	});*/

	return Task;
}