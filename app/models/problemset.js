
module.exports = function(sequelize, Sequelize) {

	var Problemset = sequelize.define('Problemset', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
    title: {type:Sequelize.TEXT, allowNull: false},
	});

  Problemset.associate = function(models) {
    models.Problemset.hasMany(models.Problem, {as: 'Problems'});
  };

	return Problemset;
}