var JwtStrategy= require('passport-jwt').Strategy,
ExtractJwt=require('passport-jwt').ExtractJwt;

var User=require('../models/user');
var config= require('../config/database'); 

module.exports=function(passport)
{
  var opts={};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey=config.secret;
  passport.use(new JwtStrategy(opts,function(jwt_payload,done)
  {
	User.find({id: jwt_payload.id},function(err,user)
	{
		if(err)
		{
			return done(err,false);
		}
		if(user)
		{
			done(null,user);
		}
		else
		{
			done(null,false);
		}
	});
  }));
}
