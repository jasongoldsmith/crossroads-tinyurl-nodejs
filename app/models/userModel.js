var utils = require('../utils')
var mongoose = require('mongoose')
var helpers = require('../helpers')
var passwordHash = require('password-hash')

// User Schema
var UserSchema = require('./schema/userSchema')

// Model initialization
var User = mongoose.model('User', UserSchema.schema)

// Public functions
function setFields(user_id, data, callback) {
  getById(user_id, function(err, user) {
    if (err)
      return callback(err)

    utils._.extend(user, data)
    save(user, callback)
  })
}

function getByQuery(query, callback) {
  User
    .find(query)
    .select("-passWord")
    .exec(callback)
}


function getById(id, callback) {
  if (!id) return callback("Invalid id:" + id)
  getByQuery({'_id':id}, utils.firstInArrayCallback(callback))
}

function getByIds(ids, callback) {
  if (utils._.isEmpty(ids)) return callback("Invalid ids:" + ids)
  getByQuery({ '_id': { '$in': ids }}, callback)
}


function save(user, callback) {
  utils.async.waterfall([
    function(callback) {
      user.save(function(err, c, numAffected) {
        if (err) {
          utils.l.s("Got error on saving user", {err: err, user: user})
        } else if (!c) {
          utils.l.s("Got null on saving user", {user: user})
        }
        return callback(err, c)
      })
    },
    function(c, callback) {
      getById(c._id, callback)
    }
  ], callback)
}



function deleteUser(user, callback) {
  utils.async.waterfall([
        function(callback) {
          if (!user) {
            callback("User is null")
          }
          user.remove(function (err, c, numAffected) {

            if (err) {
              utils.l.s("Got error on removing user", {err: err, user: user})
            } else if (!c) {
              utils.l.s("Got null chat on saving user", {user: user})
            }
            callback(null, mResult)

          })
        }
      ],
      callback)

}

function createUserFromData(data, callback) {
  utils.async.waterfall([
    function(callback) {
      var user = new User(data)
      utils.l.d("image Url assigned: " + data.imageUrl)
      save(user, callback)
    }
  ], callback)

}

function getUserByData(data, callback) {
  User.find(data)
    .exec(utils.firstInArrayCallback(callback))
}


function getAll(callback) {
  getByQuery({}, callback)
}

function getUserById(data, callback) {
  utils.async.waterfall([
      function (callback) {
        User.findOne({_id: data.id}, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.d("no user found")
          return callback({ error: "user with this id does not exist" }, null)
        } else {
          utils.l.d("found user: " + JSON.stringify(user))
          return callback(null, user)
        }
      }
  ],
    callback
  )
}

function listUsers(callback) {
  getAll(callback)
}


function updateUser(data, allowClanUpdate, callback) {
  utils.l.d("updateUser::data",data)
  utils.async.waterfall([
      function (callback) {
        getById(data.id, callback)
      },
      function(user, callback) {
        if (!user) {
          utils.l.i("no user found")
          return callback({ error: "user with this id does not exist" }, null)
        } else {
          if(!allowClanUpdate && (data.clanId && data.clanId != user.clanId)) {
            return callback({ error: "ClanId Update is not allowed." }, null)
          }else {
            utils.l.i("found user: " + JSON.stringify(user))
            if (data.passWord) {
              data.passWord = passwordHash.generate(data.passWord)
            }
            utils._.extend(user, data)
            user.save(callback)
          }
        }
      }
    ],
    callback)
}

function listMemberCount(id,filter,callback){
  User
    .aggregate([{ $match : filter},{$group: {_id : "$"+id, count:  { $sum : 1} }}])
    .exec(callback)
}

module.exports = {
  model: User,
  getUserById: getUserById,
  getByIds: getByIds,
  listUsers:listUsers,
  setFields: setFields,
  save: save,
  deleteUser: deleteUser,
  getUserByData: getUserByData,
  createUserFromData: createUserFromData,
  getAll: getAll,
  getById: getById,
  updateUser: updateUser,
  getByQuery:getByQuery,
  listMemberCount:listMemberCount
}
