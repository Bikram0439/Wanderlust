if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// console.log(process.env.CLOUD_NAME);


const express= require("express");
const app = express();
const mongoose=require("mongoose");
const path =require("path");
const Mango="mongodb://127.0.0.1:27017/wander";
 const Listing=require("./models/listing.js")
 const methodOverride=require("method-override");
 const ejsmate=require("ejs-mate");
 const wrapAsync=require("./utils/wrapAsync.js");
 const ExpressError=require("./utils/ExpressError.js");
 const {listingSchema,reviewSchema}=require("./Schema.js");
 const Review=require("./models/review.js");
const review = require("./models/review.js");
const session = require('express-session'); 
const flash=require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const {isLogined, saveRedirectUrl,isOwner,isReviewAuthor}=require("./middileware.js")
const {storage}=require("./cloudConfig.js");
const multer = require("multer");
const upload = multer({storage});


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
 app.set("view engine","ejs");
 app.set("views",path.join(__dirname,"views"));
 app.use(express.urlencoded({extended:true}));
 app.use(methodOverride("_method"));
 app.engine("ejs",ejsmate);
 app.use(express.static(path.join(__dirname,"/public")));

const sessionOptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {  
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})



app.get("/signup",(req,res)=>{
  res.render("user/signup.ejs");
})

app.post("/signup", wrapAsync(async(req,res)=>{
  try{
const {username,email,password}=req.body;
  const newuser=new User({
    username,
    email,
  })
  const registereduser=await User.register(newuser,password);
  console.log(registereduser);
  req.login(registereduser,(err)=>{
    if(err){
      return next(err);
    }
     req.flash("success","Welcome to the Wanderlust");
  res.redirect("/listing");
  });
  }catch(e){
    req.flash("error",e.message)
    res.redirect("/signup");
  }
}));


app.get("/login",(req,res)=>{
  res.render("user/login.ejs");
})

app.post("/login", 
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
 async(req, res) => {
     let redirectUrl = res.locals.redirectUrl || "/listing";
    // delete req.session.redirectUrl;
    req.flash("success", "Welcome back to Wanderlust!");
    res.redirect(redirectUrl);
  }
);



app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out successfully");
    res.redirect("/login");
  });
});




 const validatelisting=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
     if(error){
        let errmg=error.details.map((e)=>e.message).join(",");
        throw new ExpressError(400,errmg);
     }else{
        next();
     }
 }
  const validatereview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);
     if(error){
        let errmg=error.details.map((e)=>e.message).join(",");
        throw new ExpressError(400,errmg);
     }else{
        next();
     }
 }
 

app.get("/listing",async(req,res)=>{
    const alllisting= await Listing.find({});
    res.render("./listings/index.ejs",{alllisting});
})

app.get("/listings/:id", wrapAsync(async(req,res)=> {
  let {id} = req.params;
const listing = await Listing.findById(req.params.id)
  .populate("owner")
  .populate({
      path: "reviews",
      populate: { path: "author" }
    });

  if(!listing){
    req.flash("error", "listing doesnot exit");
    res.redirect("/listing");  // <-- typo here
  }
  res.render("./listings/shows.ejs", { listing });
}));



  app.get("/listing/new", isLogined,(req, res) => {
  res.render("listings/new"); // no leading './' or '/' needed
});


 


app.post(
  "/listing",
  isLogined,
  upload.single("image"),  // using Cloudinary now
  validatelisting,
  wrapAsync(async (req, res) => {
    const newlisting = new Listing(req.body.listing);
    newlisting.owner = req.user._id;

    if (req.file) {
      newlisting.image = req.file.path; // store Cloudinary URL
    }

    await newlisting.save();
    req.flash("success", "New listing created");
    res.redirect("/listing");
  })
);




// app.post(
//   "/listing",
//   isLogined,
//   upload.single("image"),  // ✅ multer handles file
//   validatelisting,          // ✅ validate listing
//   wrapAsync(async (req, res) => {
//     const newlisting = new Listing(req.body.listing);
//     newlisting.owner = req.user._id;

//     if (req.file) {
//       newlisting.image = {
//         url: req.file.path,
//         filename: req.file.filename
//       };
//     }

//     await newlisting.save();
//     req.flash("success", "New listing created");
//     res.redirect("/listing");
//   })
// );



  app.get("/listings/:id/edit", isLogined,isOwner,async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
     if(!listing){
    req.flash("error", "listing doesnot exit");
    res.redirect("/listing");  // <-- typo here
  }
    res.render("./listings/edit.ejs",{listing});
  });

//   app.put("/listings/:id",
//     isLogined,
//     isOwner,
//     validatelisting,
//     wrapAsync(async(req,res)=>{
//         let {id}=req.params;
//         await Listing.findByIdAndUpdate(id,{...req.body.listing});
//       req.flash("success", " listing updated");
//         res.redirect("/listing");
//     })
// );

app.put(
  "/listings/:id",
  isLogined,
  upload.single("image"), // handle file upload
  validatelisting,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    // Update normal fields
    Object.assign(listing, req.body.listing);

    // If a new image was uploaded, update it
    if (req.file) {
        listing.image = req.file.path;
    }

    await listing.save();
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
  })
);





    app.delete("/listings/:id",isLogined,isOwner,async(req,res)=>{
        let {id}=req.params;
     let deletelisting= await Listing.findByIdAndDelete(id);
         req.flash("success", " listing deleted");
        res.redirect("/listing")
    })

// review post
app.post("/listings/:id/review", isLogined, validatereview, wrapAsync(async(req,res)=>{
 let listing= await Listing.findById(req.params.id);
 let newreview=new Review(req.body.review);
 newreview.author=req.user._id;
 listing.reviews.push(newreview);
 await newreview.save();
 await listing.save();
req.flash("success", "New Review created");
 res.redirect(`/listings/${listing._id}`);
}));

app.delete(
  "/listings/:id/review/:reviewId",
  isLogined,
  isReviewAuthor,
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted");
    res.redirect(`/listings/${id}`);
  })
);



app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).send({message:message});
});

app.get("/",(req, res)=>{
    res.send("Hello World");
});



app.listen(8080,()=>{
    console.log("server is running on port 8080");
})