
module.exports = function(sequelize, Sequelize) {

	var Problem = sequelize.define('Problem', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
    title: {type:Sequelize.TEXT, allowNull: false},
    topic: {type: Sequelize.TEXT, allowNull: false},
    description: {type:Sequelize.TEXT, allowNull: false},
    solution: { type:Sequelize.STRING, allowNull: false},
    type: {type: Sequelize.TEXT, allowNull: false},
    extra: {type: Sequelize.TEXT, allowNull: true},
    credit: {type: Sequelize.INTEGER, allowNull: false},
    image: { type:Sequelize.TEXT, allowNull: true},
    researchCost: {type: Sequelize.INTEGER, allowNull: false},
    undertakeCost: {type: Sequelize.INTEGER, allowNull: false},
    timeLimit: {type: Sequelize.INTEGER, allowNull: false},
  });

  Problem.associate = function(models) {
    models.Problem.hasMany(models.Task, {as: 'Tasks'});
    models.Problem.belongsToMany(models.Team, {as: 'Teams', through: models.Task, foreignKey: 'ProblemId'});
	};

	return Problem;
}