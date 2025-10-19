const mongoose=require("mongoose");
const initdata=require("./data.js");
const Listing=require("../models/listing.js");

const Mango="mongodb://127.0.0.1:27017/wander";

main()
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch((err)=>{
    console.log("Error connecting to MongoDB");
    });

async function main(){
    await mongoose.connect(Mango);
}

const initDB=async()=>{
    await Listing.deleteMany({});
   initdata.data=initdata.data.map((ob)=>({
    ...ob,
    owner:"687a1f50ccef8b5c3bf8edb5",
   }));
    await Listing.insertMany(initdata.data);
    console.log("data was inislized");
}
initDB();