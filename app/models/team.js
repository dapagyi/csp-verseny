const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {

	var Team = sequelize.define('Team', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
		name: {type:Sequelize.STRING, allowNull: false, unique: {args: true, msg: 'Ez a csapatnév foglalt.'}},
		password : {type:Sequelize.INTEGER, allowNull: false},
		credits : {type:Sequelize.INTEGER, allowNull: false, default: 0}
	});

	Team.associate = function(models) {
		models.Team.hasMany(models.User, {as: 'Members'});
		models.Team.belongsToMany(models.Problem, {as: 'Problems', through: models.Task, foreignKey: 'TeamId'});
	};

	return Team;

}