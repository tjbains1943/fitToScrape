var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var exphbs  = require('express-handlebars');
var PORT = 3000;
var cheerio = require("cheerio");
var db = require("./models"); 
var path = require("path");
var app = express();

app.use(express.static('public'));
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
 
app.engine('handlebars', exphbs({defaultLayout: 'main',
partialsDir: path.join(__dirname, "/views/layouts/partial")}));
app.set('view engine', 'handlebars');



var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/Articles";
mongoose.Promise = Promise;

mongoose.connect(MONGODB_URI);

app.get("/", function(req, res) {
    db.Article.find({"saved": false}, function(error, data) {
      var hbsObject = {
        article: data
      };
    //   console.log(hbsObject);
      res.render("index", hbsObject);
    });
  });

  app.get("/saved", function(req, res) {
    db.Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
      var hbsObject = {
        article: articles
      };
      res.render("savedArticles", hbsObject);
    });
  });


app.get("/scraper", function(req, res) {
  console.log("\n***********************************\n" +
  "Grabbing every thread name and link\n" +
  "from reddit's webdev board:" +
  "\n***********************************\n");

request("https://old.reddit.com/r/popular/", function(error, response, html) {

var $ = cheerio.load(html);

var results = [];

$("p.title").each(function(i, element) {

var title = $(element).text();

var link = $(element).children().attr("href");
// console.log($(".thumbnail").find("img").attr("src"));
var img = $(element).parent().parent().parent().find("img").attr("src");
results.push({
title: title,
link: link,
img: img
});


// console.log(results);

      // Create a new Article using the `result` object built from scraping
      db.Article.create(results)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(123);
        //   res.send({count: dbArticle.length})
        // if(dbArticle) {
          console.log(dbArticle.length);
         
        // }
        })
        .catch(function(err) {
          // console.log("4523");
          // If an error occurred, send it to the client
            // res.send(err);
          console.log(err);
       
        });
      
    });
 
    // If we were able to successfully scrape and save an Article, send a message to the client
    // if(dbArticle) {
    //   console.log(dbArticle.length);
    // }
    // res.send("Scrape Complete");
    res.redirect('/')
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/articles/delete/:id", function(req, res) {
  // Use the article id to find and update its saved boolean
  db.Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
  // Execute the above query
  .exec(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    }
    else {
      // Or send the document to the browser
      res.send(doc);
    }
  });
});


app.post("/articles/save/:id", function(req, res) {
  // Use the article id to find and update its saved boolean
  db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
  // Execute the above query
  .exec(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    }
    else {
      // Or send the document to the browser
      res.send(doc);
    }
  });
});



// Route for saving/updating an Article's associated Note
app.post("/notes/save/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new db.Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // And save the new note the db
  newNote.save(function(error, note) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's notes
      db.Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
      // Execute the above query
      .exec(function(err) {
        // Log any errors
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          // Or send the note to the browser
          res.send(note);
        }
      });
    }
  });
});

app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
  // Use the note id to find and delete it
  db.Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
    // Log any errors
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      db.Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
       // Execute the above query
        .exec(function(err) {
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
// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
