// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const path = require("path");

// To scrape
const axios = require("axios");
const cheerio = require("cheerio");

// Initialize Express
const app = express();

//Models
const Note = require("./models/Note.js");
const Article = require("./models/Article.js");

//Port
const PORT = process.env.PORT || 3030




// Handlebars.
const exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

mongoose.connect("mongodb://localhost/newscraper", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true)



// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static directory
app.use(express.static("public"));


//ROUTES TO THE MAIN PAGE//

app.get("/", function (req, res) {
    Article.find({ "saved": false }, function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("index", hbsObject);
    });
});

app.get("/saved", function (req, res) {
    Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});


//ROUTES TO SCRAPE//

app.get("/scrape", function (req, res) {
    // This code gets the `html` the server. 
    axios.get("https://www.nytimes.com/section/us").then(function (response) {
        // Then, cheerio is loaded and $ is used as `selector`
        var $ = cheerio.load(response.data);
        $("div.story-body").each(function (i, element) {

            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(element)
                .children("h2.headline")
                .text();
            result.link = $(element)
                .find("a")
                .attr("href");
            result.summary = $(element)
                .find("p.summary")
                .text();

                Article.create(result) 
                    .then(function(data) {
                        console.log(data);
                    })
                    .catch(function(err) {
                        return res.json(err)
                    })
                })
   
        res.send("Scrape Complete");

    });
});


//ROUTE TO CLEAR THE UNSAVED ARTICLES

app.get('/clear', function(req, res) {
    db.Article.remove({ saved: false}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('removed');
        }

    });
    res.redirect('/');
});


//ROUTE TO GET AN ARTICLE//
app.get("/articles/:id", function (req, res) {

    Article.findOne({ "_id": req.params.id })
        //Populate note
        .populate("note")     //then. or exec. ??????
        .exec(function (error, data) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            else {
                res.json(data);
            }
        });
});


//ROUTES TO SAVE THE ARTICLES//

app.post("/articles/save/:id", function (req, res) {
    // Use the article id to find and update its saved boolean
    Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
        // Execute the above query
        .exec(function (err, data) {
            // Log any errors
            if (err) {
                console.log(err);
            }
            else {

                res.send(data);
            }
        });
});

//ROUTE TO DELETE//

app.post("/articles/delete/:id", function (req, res) {
    //Anything not saved

    Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false, "notes": [] })

        .exec(function (err, data) {
            // Log any errors
            if (err) {
                console.log(err);
            }
            else {
                res.send(data);
            }
        });
});


//ROUTE FOR COMMENT//

app.post("/notes/save/:id", function (req, res) {
    // Create a new note and pass the `req.body` to the entry
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body)
    // this saves the new note to the db
    newNote.save(function (error, note) {

        if (error) {
            console.log(error);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "notes": note } })
                ///EXEC VS THEN???

                .exec(function (err) {

                    if (err) {
                        console.log(err);
                        res.send(err);
                    }
                    else {
                        res.send(note);
                    }
                });
        }
    });
});

//ROUTE TO DELETE A NOTE//

app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
    // Use the note id to find and delete it
    Note.findOneAndRemove({ "_id": req.params.note_id }, function (err) {
        // Log any errors
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } })
                // executes the above query
                .exec(function (err) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                        res.send(err);
                    }
                    else {
                        // Or send the note to the browser
                        res.send("Note Deleted");
                    }
                });
        }
    });
});

// Listening on the port
app.listen(PORT, function () {
    console.log("App running on port " + PORT);
});