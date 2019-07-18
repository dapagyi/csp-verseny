
module.exports = function(sequelize, Sequelize) {

	var User = sequelize.define('User', {
		id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER},
		username: {type:Sequelize.TEXT, allowNull: false},
		fullname : {type:Sequelize.TEXT, allowNull: false},
		email: { type:Sequelize.STRING, validate: {isEmail:true} },
		password : {type: Sequelize.STRING, allowNull: false }, 
	});

	User.prototype.alma = function(){
		console.log('a');
		return 1;
  };

	User.associate = function(models) {
    models.User.belongsTo(models.Team, {as: 'Team'});
  };

	return User;
}