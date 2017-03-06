var mongoose=require("mongoose");

var questionSchema = new mongoose.Schema({
    title:String,
    sampleInput:String,
    description:String,
    sampleOutput:String
});

module.exports= mongoose.model("Question",questionSchema);