var routeUtils = require('../routes/routeUtils')
var utils = require('../utils')

module.exports = function (app, passport) {
  app.use('/',require('../routes/v1/auth'))

  /// catch 404 and forward to error handler
  app.use(function(req, res, next) {
    routeUtils.handleAPINotFound(req, res)
  })

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    utils.l.sentryError(err)
    res.status(err.status || 500)
    routeUtils.handleAPIError(req, res, err)
  })

}