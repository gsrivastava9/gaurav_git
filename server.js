var express=require('express');
var app=express();
var bodyParser=require('body-parser');
var morgan= require('morgan');
var mongoose=require('mongoose');
var passport = require('passport');
var config=require('./config/database');
var User=require('./models/user');
var jwt=require('jwt-simple');
app.use(bodyParser.urlencoded({extended: true}))
Todo =require('./models/todolist');
mongoose.connect(config.database);
var db=mongoose.connection;//database object
app.use(bodyParser.json());
var apiRoutes=express.Router();
apiRoutes.post('/signup',function(req,res)
{
	console.log("in signup");
	if(!req.body.username || !req.body.password || !req.body.name)
	{
		res.json({success: false,msg: 'Blank username name or password'});
	}
	else
	{
		var newUser=new User(
		{
			username:req.body.username,
			name: req.body.name,
			password: req.body.password
		});
		newUser.save(function(err)
		{
			if(err)
			{
				res.json({success: false,msg: 'username already exists'});
			}
			else
			{
				res.json({success: true,msg: 'Successfully registered'});
			}
		});
	}
});
apiRoutes.post('/authenticate',function(req,res)
{
	console.log("in authenticate");
	if(!req.body.username || !req.body.password)
	{
		console.log('1');
		res.json({success: false,msg: 'Blank username or password'});
	}
	else
	{
		User.findOne({username: req.body.username},function(err,user)
		{
			if(err)
			{
				console.log('2');
				throw err;
			}
			if(!user)
			{
				console.log('3');
				return res.status(403).send({success: false,msg: 'Authentication failed.User not found'});
			}
			else
			{
				console.log('4');
				user.comparePassword(req.body.password,function(err,isMatch)
				{
					if(isMatch && !err)
					{
						var token=jwt.encode(user,config.secret);
						res.json({success: true,token: 'JWT '+token});
					}
					else
					{
						return res.status(403).send({success: false,msg: 'Authentication failed.Wrong Password'});
					}
			
				});
			}	
		});
	}
	
}); 
apiRoutes.get('/memberinfo',passport.authenticate('jwt',{session: false}),function(req,res)
{
	var token=getToken(req.headers);
	console.log('request to memberinfo reached'+req.headers);
	if(token)
	{
		var decoded=jwt.decode(token,config.secret);
		User.findOne(
		{
			username: decoded.username
		},function(err,user)
		{
			if(err)
			{
				console.log('throwing error');
				throw err;
			}
			if(!user)
			{
				return res.status(403).send({success: false,msg: 'Authentication failed.User not found'});
			}
			else
			{
				
				return res.json({success: true,msg: 'welcome in the member area'+user.name+'!'});
			}
		});
	}
	else
	{
		return res.status(403).send({success: false,msg: 'No token provided.'});
	}
});
getToken= function(headers)
{
	if(headers && headers.authorization)
	{
		var parted=headers.authorization.split(' ');
		if(parted.length===2)
		{
			return parted[1];
		}
		else
		{
			return null;
		}
		
	} 
	else
	{
		return null;
	}
}
app.use('/',apiRoutes);

apiRoutes.get('/todolist',passport.authenticate('jwt',{session: false}),function(req,res)
{
	var token=getToken(req.headers);
	if(token)
	{
		var decoded=jwt.decode(token,config.secret);
		User.findOne(
		{
			username: decoded.username
		},function(err,user)
		{
			if(err)
			{
				throw err;
			}
			if(!user)
			{
				return res.status(403).send({success: false,msg: 'Authentication failed.You are not authorized to visit this link'});
			}
			else
			{
				Todo.getTodoList(user,function(err,todolists)
				{
					if(err)
					{
						throw err;
					}
					return res.json(todolists);  
				}); 
				
				
			}
		});
	}
	else
	{
		return res.status(403).send({success: false,msg: 'No token provided.Not authorized to access'});
	}
});

app.post('/todolist',passport.authenticate('jwt',{session: false}),function(req,res)
{
	var token=getToken(req.headers);
	if(token)
	{
		var decoded=jwt.decode(token,config.secret);
		User.findOne(
		{
			username: decoded.username
		},function(err,user)
		{
			if(err)
			{
				console.log('throwing error');
				throw err;
			}
			if(!user)
			{
				return res.status(403).send({success: false,msg: 'Authentication failed.'});
			}
			else
			{
				var entry=
				{
					username: user.username,
					todoitem: req.body.todoitem,
					description: req.body.description,
					status: req.body.status,
					category: req.body.category,
					target_date: req.body.target_date
					
				}
				db.collection('todolist').save(entry,function(err,doc)
				{
					return res.json(doc);
				})
				
			}
		});
	}
	else
	{
		return res.status(403).send({success: false,msg: 'No token provided.'});
	}
});

apiRoutes.delete('/todolist/:id',passport.authenticate('jwt',{session: false}),function(req,res)
{
	var id=req.params.id;
	var token=getToken(req.headers);
	if(token)
	{
		var decoded=jwt.decode(token,config.secret);
		User.findOne(
		{
			username: decoded.username
		},function(err,user)
		{
			if(err)
			{
				throw err;
			}
			if(!user)
			{
				return res.status(403).send({success: false,msg: 'Authentication failed.'});
			}
			else
			{
				Todo.removeTodoItem(id,function(err,doc)
				{
					if(err)
					{
						throw err;
					}
					return res.json(doc);
				});
			}
		});
	}
	else
	{
		return res.status(403).send({success: false,msg: 'No token provided.'});
	}
});
apiRoutes.put('/todolist/:id',passport.authenticate('jwt',{session: false}),function(req,res)
{
	var token=getToken(req.headers);
	if(token)
	{
		var decoded=jwt.decode(token,config.secret);
		User.findOne(
		{
			username: decoded.username
		},function(err,user)
		{
			if(err)
			{
				console.log('throwing error');
				throw err;
			}
			if(!user)
			{
				return res.status(403).send({success: false,msg: 'Authentication failed.'});
			}
			else
			{
					var id=req.params.id;
					Todo.getTodoListById(id,function(err,list)
					{
						if(err)
						{
							console.log(err);
							res.status(500).send({success: false,msg: 'error'});
						}
						else
						{
							if(!list)
							{
								res.status(404).send({success: false,msg: 'no list found'});
							}	
							else
							{
								if(req.body.todoitem)
								{
									list.todoitem=req.body.todoitem;
								}
								if(req.body.description)
								{
									list.description=req.body.description;
								}
								if(req.body.status)
								{
									list.status=req.body.status;
								}
								if(req.body.category)
								{
									list.category=req.body.category;
								}
								if(req.body.target_date)
								{
									list.target_date=req.body.target_date;
								}
								list.save(function(err,updatedList)
								{
									if(err)
									{
										console.log(status);
										res.status(500).send({success: false,msg: 'error  while saving'});
									}
									else
									{
										res.send(updatedList);
									}
								
								});
							}	
						}
					});
				
				
			}
		});
	}
	else
	{
		return res.status(403).send({success: false,msg: 'No token provided.'});
	}
});

require('./config/passport')(passport);
app.listen(3000);
console.log('running on port 3000...');
