const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../Schema.js");

// Middleware to validate listing
const validatelisting = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((e) => e.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// All routes below are prefixed with /listings

// GET /listings - List all
router.get("/", async (req, res) => {
  const alllisting = await Listing.find({});
  res.render("./listings/index.ejs", { alllisting });
});

// GET /listings/new - Show form
router.get("/new", (req, res) => {
  res.render("./listings/new.ejs");
});

// POST /listings - Create new
router.post(
  "/",
  validatelisting,
  wrapAsync(async (req, res) => {
    const newlisting = new Listing(req.body.listing);
    await newlisting.save();
    res.redirect("/listings");
  })
);

// GET /listings/:id - Show single listing
router.get("/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("./listings/shows.ejs", { listing });
}));

// GET /listings/:id/edit - Show edit form
router.get("/:id/edit", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("./listings/edit.ejs", { listing });
}));

// PUT /listings/:id - Update listing
router.put("/:id",
  validatelisting,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect("/listings");
  })
);

// DELETE /listings/:id - Delete listing
router.delete("/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
}));

module.exports = router;
