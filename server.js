// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const path = require("path");


// To scrape
const axios = require("axios");
const cheerio = require("cheerio");

//Models
const Note = require("./models/note.js");
const Article = require("./models/article.js");

//Port
const PORT = process.env.PORT || 3030

// Initialize Express
const app = express();


// Handlebars.
const exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

mongoose.connect("mongodb://localhost/newscraper");

// Express Initialization
const app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static directory
app.use(express.static("public"));