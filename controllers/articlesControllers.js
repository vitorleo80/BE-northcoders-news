const {User, Article, Comment} = require('../models');
const {formatCommentData, formatArticlesWithCommentCount} = require('../utils')



exports.getAllArticles = ((req, res, next) => {
  Article.find()
    .populate('created_by','username -_id')
    .then(articles => {
      return Promise.all([articles, ...articles.map(artObj => Comment.count({ belongs_to: artObj._id }))])
    })
    .then(([articles, ...commentCounts]) => {
      const formatedArticles = articles.map((article, i) => {
        let {_id, title, body, belongs_to, votes} = article
        return {
          _id, title, body, belongs_to, votes,
          created_by: article.created_by.username, 
          comments: commentCounts[i]
        }
      })
     return formatedArticles   
    })
    .then(formatedArticles=> {
      res.status(200).send({articles: formatedArticles})
    })
    .catch(err => {
        return next({
          status: 404,
          msg: 'Page Not Found!'
        });
        
      });
});

exports.getArticlesById = ((req, res, next) => {
    Article.findById(req.params.article_id)
    .populate('created_by','username -_id')
    .then(articles => {
      let {_id, title, body, belongs_to, votes} = articles
      const formatedArticles = {
        _id, title, body, belongs_to, votes,
        created_by: articles.created_by.username,
      }
      res.status(200).send({articles: formatedArticles})
    })
    .catch(err => {
      next({
        status: 400,
        msg: 'Id not Found'
      });
    
    });
 
})

exports.getCommentsByArticle = ((req, res, next) => {
    const articleId = req.params.article_id;
    Comment.find({ belongs_to: articleId })
      .populate('created_by','username -_id')
      .then(comments => {
        const formatedComments = comments.map((comment, i) => {
          let {_id, title, body, belongs_to, votes, created_at} = comment
          return {
            _id, title, body, belongs_to, votes, created_at,
            created_by: comment.created_by.username, 
          }
        })
       return formatedComments   
      })
      .then(formatedComments=> {
        res.status(200).send({comments: formatedComments})
      })
      .catch(err => {
        next({
          status: 400,
          msg: 'Id not Found'
        });
      
      });
});
  
exports.addCommentToArticle = (req, res, next) => {
  return User.findOne().then((user) => {
      const newComment = new Comment({body: req.body.body, belongs_to: req.params.article_id,created_by: user._id})
        return Comment.create(newComment)
    })
    .then(comment => {
        res.status(201).send({comments: comment});
    })
    .catch(err => {
      next({
        status: 400,
        msg: 'Wrong Format'
      });
    
    });
}

exports.inputVotesByArticle = ((req, res, next) => {
const msg = 'Invalid input, use "up" to add a vote or "down" to decrease it.'
req.query.vote !== 'up' ? (req.query.vote !== 'down' ?
  next({status: 400, msg: msg}) : null) : null;


   const articleId = req.params.article_id;
    return Article.findByIdAndUpdate(articleId)
    .then(article => {
      if(req.query.vote === 'up') article.votes ++;
      else if(req.query.vote === 'down') article.votes --;
      return article.save();
    }).then(article => res.status(200).send({article}))
    .catch(next)
});

