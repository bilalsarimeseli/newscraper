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
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");