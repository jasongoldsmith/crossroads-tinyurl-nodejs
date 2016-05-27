var express = require('express')
var router = express.Router()
var config = require('config')
var utils = require('../../utils')
var helpers = require('../../helpers')
var routeUtils = require('../routeUtils')
var models = require('../../models')
var service = require('../../service/index')
var passport = require('passport')
var passwordHash = require('password-hash')

function login (req, res) {

  var outerUser = null
  utils.async.waterfall(
    [
      helpers.req.handleVErrorWrapper(req),
      function(callback) {
        var passportHandler = passport.authenticate('local', function(err, user, info) {
          if (err) {
            return callback(err, null)
          }
          if (!user) {
            return callback({error: "Password is incorrect"}, null)
          }
          outerUser = user
          callback(null, user)
        })
        passportHandler(req, res)
      },
      reqLoginWrapper(req, "auth.login")
    ],
    function (err) {
      if (err) {
        if (err instanceof helpers.errors.ValidationError) {
          req.routeErr = err
        } else {
          req.routeErr = {error: "the input auth combination is not valid"}
        }
        return routeUtils.handleAPIError(req, res, req.routeErr,req.routeErr)
      }
      routeUtils.handleAPISuccess(req, res, {value: outerUser})
    }
  )
}

function addLogin(userId, userIp, userAgent, reason, callback) {
  utils.async.waterfall([
    function (callback) {
      models.user.getById(userId, callback)
    },
    function(user, callback) {
      var login = {
        userIp: userIp,
        userAgent: userAgent,
        reason: reason
      }
      // user.logins.values.push(login)
      models.user.save(user, callback)
    }], callback)
}

function reqLoginWrapper(req, reason) {
  return function (user, callback) {
    utils.async.waterfall(
      [
        function (callback) {
          req.logIn(user, callback)
        },
        function(callback) {
          addLogin(user.id, req.adata.ip, req.adata.user_agent, reason, callback)
        }
      ],
      callback
    )
  }
}

function signup(req, res) {
  try {
    req.assert('userName').notEmpty().isName()
  } catch(ex) {
    var err = {
      error: "username must be between 1 and 50 characters"
    }
    return routeUtils.handleAPIError(req, res, err, err)
  }

  try {
    req.assert('passWord').notEmpty().isAlphaNumeric()
  } catch(ex) {
    var err = {
      error: "password must be between 1 and 9 characters and must be alphanumeric"
    }
    return routeUtils.handleAPIError(req, res, err, err)
  }

  var body = req.body
  var userData = {
    userName: body.userName.toLowerCase().trim(),
    passWord: passwordHash.generate(body.passWord),
    psnId: body.psnId.toLowerCase().trim(),
    xboxId: body.xboxId,
    imageUrl: body.imageUrl,
    clanId: body.clanId
  }

  utils.async.waterfall([
      helpers.req.handleVErrorWrapper(req),
      function (callback) {
        service.authService.signupUser(userData, callback)
      },
      reqLoginWrapper(req, "auth.login")
    ],
    function (err, user) {
      if (err) {
        req.routeErr = err
        return routeUtils.handleAPIError(req, res, err,err)
      }
      helpers.firebase.createUser(user)
      helpers.cookies.setCookie("foo", "bar", res)
      helpers.m.setUser(user)
      return routeUtils.handleAPISuccess(req, res, {value: user,message:getSignupMessage(user)})
    }
  )
}

function shortURL(req,res){
  utils.l.d("shortUrl::"+req.param('shortPath')); //Returns a shorter version of http://google.com - http://tinyurl.com/2tx
  service.tinyUrlService.getLongUrl(req.param('shortPath'),function(err,longURL){
    if(err || ! longURL){
      var errorObj = {error:"Invalid Link."}
      routeUtils.handleAPIError(req,res,errorObj,errorObj)
    }
    else {
      res.writeHead(302, {'Location': longURL});
      res.end()
    }
  })
}


function logout(req, res) {
  req.logout()
  routeUtils.handleAPISuccess(req, res, {success: true})
}

function getSignupMessage(user){
  if(user.psnVerified == "INITIATED") return "Thanks for signing up for Traveler, the Destiny Fireteam Finder mobile app! An account verification message has been sent to your bungie.net account. Click the link in the message to verify your PSN id."
  else return "Thanks for signing up for Traveler, the Destiny Fireteam Finder mobile app!"
}

function home(req,res){
  res.render('index')
}
/** Routes */
routeUtils.rGetPost(router, '/login', 'Login', login, login)
routeUtils.rPost(router, '/register', 'Signup', signup)
routeUtils.rPost(router, '/logout', 'Logout', logout)
routeUtils.rGet(router,'/','homePage',home,home)
routeUtils.rGet(router,'/:shortPath','shortURLRedirect',shortURL,shortURL)
module.exports = router

