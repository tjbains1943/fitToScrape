const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
    sparse: true,
  },
  link: {
    type: String,
    required: true,
  },
  img: {
        type: String,
},
  saved: {
    type: Boolean,
    default: false
  },
  notes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Note"
    }
  ]
});

const Article = mongoose.model("Article", ArticleSchema);
// console.log(Article);
module.exports = Article;