
module.exports = function(sequelize, Sequelize) {

	var Task = sequelize.define('Task', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
		tries: {type:Sequelize.TEXT, allowNull: false, defaultValue: ''},
		status: {type: Sequelize.ENUM('locked', 'waitingForResearch', 'waitingForUndertake', 'available', 'done', 'missed'), allowNull: false },
		expireDate: {type: Sequelize.DATE, allowNull: true}
	});

	Task.associate = function(models) {
    models.Task.belongsTo(models.Team, {as: 'Team'});
		models.Task.belongsTo(models.Problem, {as: 'Problem'});
	};
	
	var moment = require('moment');
	Task.addHooks = function(models) {
		models.Task.addHook('afterFind', (tasks) => {
			Promise.all([
	  		new Promise(async (resolve, reject) => {
					if (tasks == null) return;
					if (!Array.isArray(tasks)) tasks=[tasks];
					
					const start = async () => {
						await asyncForEach(tasks, async (task) => {
							if (task.status == 'available' && moment(task.expireDate).diff(moment(), 'seconds') < 0) {
								task.status = 'missed';
								await task.save();
							}
						});
					}
					await start();
					resolve('first promise');
				})
				,
				new Promise((resolve, reject) => {
					models.Team.findAll({

					}).then(async (teams) => {
						teams.forEach(async team => {
							
							var problems = await team.getProblems({
								through: {
									where: { 
										status: {
											[models.Sequelize.Op.ne]: 'locked' 
										},
									}
								},
								order: [
									['ProblemsetId', 'DESC'] 
								],
								limit: 1
							});

							var teamLevel = problems.length ? problems[0].ProblemsetId : 1;
							var solvedProblemsCount = await models.Task.count({
								include: [
									{
										model: models.Problem,
										as: 'Problem',
										where: [
											{
												ProblemsetId: teamLevel
											}
										]
									}
								],
								where: {
									status: 'done',
									TeamId: team.id
								}
							});
							var allProblemsInSet = await models.Problem.count({
								where: {
									ProblemsetId: teamLevel
								}
							});
							console.log(team.name, `${solvedProblemsCount}/${allProblemsInSet}`);
							if (solvedProblemsCount/allProblemsInSet >= 0.5) {
								var maxLevel = await models.Problemset.max('id');
								if (teamLevel < maxLevel) {
									console.log('new level unlocked', maxLevel);
									models.Problem.findAll({
										where: {
											ProblemsetId: teamLevel+1
										},
										attributes: ['id']
									}).then(async nextProblems => {
										await nextProblems.forEach(p => {
											console.log();
											models.Task.findOrCreate({where: {
												TeamId: team.id,
												ProblemId: p.id,
												status: 'waitingForResearch'
											}});
										});
									});
								}
							}
						});
					}).finally(()=>{
						resolve("second promise");
					});
				})
			]).then((d)=>{
				// console.log(d);
				// console.log('data preprocess done');
			});
			
		});
	}
	
	async function asyncForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	}

	return Task;
}