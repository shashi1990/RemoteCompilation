var express= require("express"),
    app = express(),
    bodyParser=require("body-parser"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    passportLocal=require("passport-local"),
    User=require("./models/user"),
    expressSession=require("express-session");
    
var fs = require("fs");
//var fs1 = require("fs");
var exec = require('child_process').exec;
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/Compiler");
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true})); 

app.use(expressSession({
    secret:"string used for hashing and storing password",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


var Question = require("./models/question");

var code="";
var output ="";

String.prototype.replaceAll = function(target, replacement) {
			  return this.split(target).join(replacement);
};
app.get("/question",isLoggedIn,function (req,res) {
    var data ={
        Code:code,
        Output:output
    };
    res.render("question",{data:data});
  
});
app.get("/questions",isLoggedIn,function (req,res) {
     Question.find({},function(err,questions){
        if(err){
            console.log(err);
        }else{
           // console.log(campgrounds);
           questions.forEach(function(question){ 
             //  console.log(question._id);
           });
            res.render("questions",{questions:questions});
        }
    });
});
app.get("/questions/:id",function(req, res) {
    var id=req.params.id;
    var code="";
    var output="";
    console.log(id);
    // res.redirect("/questions");
    Question.findById(id,function (err,question) {
        if(err){
            console.log(err);
            res.redirect("/questions");
        }else{
          //  console.log(campground.description);
          var data ={
                Code:code,
                Output:output
            };
          var object = {
              question:question,
              data:data
          };
            res.render("question",{object:object});
        }
    });
  //  res.render("question");
});
app.get("/admin",function(req,res){
   res.render("loginAdmin"); 
});
// app.post("/admin",function(req,res){
//     console.log("inside post");
//   res.redirect("/admin"); 
// });
app.post("/admin",passport.authenticate("local",{
        successRedirect:"/createQuestion",
        failureRedirect:"/admin"
    }),function(req, res) {
    
});

app.get("/createQuestion",function(req,res){
    res.render("createQuestion"); 
});
app.post("/createQuestion",function(req,res){
   var title = req.body.title;
   var sampleInput  = req.body.sampleInput;
   var description =req.body.description;
   var sampleOutput  = req.body.sampleOutput;
   
   var Input = sampleInput;
   var Output = sampleOutput;
    // console.log(sampleInput.replaceAll("\n","<br>"));
    // console.log(description.replaceAll("\n","<br>"));
    // console.log(sampleOutput.replaceAll("\n","<br>"));
             
    
   var  question ={ title:title, sampleInput: sampleInput.replaceAll("\n","<br>"), description: description.replaceAll("\n","<br>"), sampleOutput: sampleOutput.replaceAll("\n","<br>")};
 //   console.log(question);
   Question.create(question,function(err,question){
       if(err){
           console.log(err);
           res.redirect("/createQuestion");
       }else{
           var path=__dirname+'/Questions/'+question._id;
            exec("python createStructure.py "+path,function(error, stdout, stderr){
                if(error){
                    console.log("Error in python program");
                    res.redirect("/createQuestion");
                }else{
                    console.log(question.sampleInput);
                     console.log(question.sampleOutput);
                     
                    fs.writeFile(path+'/in.txt',Input, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("The file was saved!");
                    }); 
                    fs.writeFile(path+'/out.txt',Output, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("The file was saved!");
                    }); 
                    res.redirect("/createQuestion");
                    // var createStreamout = fs.createWriteStream(path+'/out.txt');
                    // createStreamout.write(question.sampleOutput);
                    // createStreamout.end();
                }
                
            });
       }
   });
    console.log("create question route");
});
app.get("/login",function(req,res){
   res.render("login"); 
});

app.post("/login",passport.authenticate("local",{
        successRedirect:"/questions",
        failureRedirect:"/login"
    }),function(req, res) {
    
});
app.get("/register",function(req,res){
   res.render("register"); 
});
app.post("/register",function(req, res) {
    var newUser= new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.redirect("/register");
            
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/questions");
        });
    });
});
app.get("/",function(req,res){
   
   var data ={
        Code:code,
        Output:output
    };
    res.render("question",{data:data});
});

app.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/login");
});


app.post("/register",function(req, res) {
    var newUser= new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.redirect("/register");
            
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/questions");
        });
    });
});

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        console.log("successs");
        return next();
    }
   // console.log(req);
    console.log(req.isAuthenticated());
    res.redirect("/login");
}

function isLoggedInAdmin(req,res,next){
    if(req.isAuthenticated()){
        console.log("successs");
        if(req.user == 'admin'){
            return next();
        }else{
            req.logout();
            res.redirect("/admin");
        }
        
    }
   // console.log(req);
    console.log(req.isAuthenticated());
    res.redirect("/admin");
}

app.post("/questions/:id",isLoggedIn,function (req,res) {
    var id=req.params.id;
    var code= req.body.userCode;
    var output ="";
    var userName = req.user.username;
    console.log("Post route");
    fs.writeFile(userName+".cpp",code, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    
                        console.log("The code file was saved!"); 
    
    // var createStream = fs.createWriteStream("codeFile.cpp");
    // createStream.write(code);
    // createStream.end();
    
    Question.findById(id,function (err,question) {
        if(err){
            console.log(err);
            res.redirect("/questions");
        }else{
            
    var filename=userName+".cpp";
    console.log("g++ "+filename +" -o "+ userName);
    exec("g++ "+filename +" -o "+ userName,function(error, stdout, stderr){
        if(error){
            console.log("error "+error );
             output=error;
             var data ={
                Code:code,
                Output:output
            };
               var object = {
                  question:question,
                  data:data
               };
                res.render("question",{object:object});
          
        }else if(stderr){
            console.log("stderr "+stderr);
             output=stderr;
              data ={
                Code:code,
                Output:output
            };
               object = {
                  question:question,
                  data:data
              };
                res.render("question",{object:object});
            
            
        }else{
            // console.log("stdout "+stdout);
            var cmd=__dirname+"/"+userName+" < Questions/"+id+"/in.txt 2>err.txt 1>"+userName+".txt";
            console.log(cmd);
             exec(cmd,function(error, stdout, stderr){
                if(error){
                   console.log("error "+error);
                   output=error;
                   var data ={
                        Code:code,
                        Output:output
                    };
                   var object = {
                      question:question,
                      data:data
                   };
                    res.render("question",{object:object});
                           
                }else if(stderr){
                    console.log("stderr "+stderr);
                    output=stderr;
                      data ={
                        Code:code,
                        Output:output
                    };
                       object = {
                          question:question,
                          data:data
                      };
                  res.render("question",{object:object});
                   
                    
                }else{
                    var path="Questions/"+id+"/out.txt";
                    console.log(path);
                    const spawn = require('child_process').spawn;
                    const diff = spawn('diff', ['-b', path, req.user.username+'.txt']);
                    
                    diff.stdout.on('data', (data) => {
                        var datax = data;
                        console.log(" datax " +datax);
                      if( datax.length == 0){
                               output = "Success";
                      }else{
                             output = "Compiled correctly but test case is not passed. Please try to match output exactly as Given";
                      }
                      console.log(`stdout: ${data}`);
                    });
                    
                    diff.stderr.on('data', (data) => {
                      console.log(`stderr: ${data}`);
                    });
                    
                    diff.on('close', (code) => {
                        console.log(" output.length "+output.length);
                        console.log(" output "+output);
                        if(output.length == 0){
                            console.log("Should print success");
                            output = "Success";
                            console.log(output);
                        }
                      console.log(`child process exited with code ${code}`);
                    });
                    if(output.length == 0){
                            console.log("Should print success 2");
                            output = "Success";
                            console.log(output);
                    }
                         data ={
                            Code:code,
                            Output:output
                    };
                         object = {
                          question:question,
                          data:data
                    };
                    res.render("question",{object:object});
                   //  console.log("stdout "+stdout);
                    //   exec("diff answer.txt out.txt",function(error, stdout, stderr){
                    //       if(error){
                    //           console.log(error);
                    //       }else{
                    //           if(stdout.length == 0){
                    //               output = "Success";
                    //           }else{
                    //               output = "Compiled correctly but test case is not passed. Please try to match output exactly as Given";
                    //           }
                    //       }
                          
                    //   });
                    
                }
            });
        }
    });
        }
    });
    }); 
    // 0<input.txt
   console.log("Output"+output);
   // res.render("question");
});
app.listen(process.env.PORT,process.env.IP, function () {
   console.log('Blogg Started'); 
});