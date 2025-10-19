const mongoose=require("mongoose");
const review = require("./review");
const Schema=mongoose.Schema;
const Review=require("./review.js")

const listingSchema=new Schema({
    title:{type:String,required:true},
    description:{type:String},
    price:{type:Number,required:true},
    image:{
        type:String,
        default:
        "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
     set:(v)=>
        v=== ""
     ? "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2":v,
    },
    location:{type:String},
    country:String,
    
    reviews:[
        {
        type: Schema.Types.ObjectId,
        ref:"Review"
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

});


listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id:{$in:listing.reviews}})
    }
})

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;
