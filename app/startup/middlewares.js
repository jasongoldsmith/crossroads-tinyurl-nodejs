var utils = require('../utils');
var helpers = require('../helpers');
var UAParser = require('ua-parser-js');
var parser = new UAParser();

function handleReqCleanup() {
  return function(req, res, next) {
    req.requested_url = req.protocol + '://' + req.get('host') + req.originalUrl;
    next();
  }
}

function appendFromHeader(req, data, headerKey, dataKey, defaultValue) {
  var value;
  if (utils._.isValid(req.headers[headerKey])) {
    value = req.headers[headerKey] || defaultValue;

  } else {
    value = defaultValue;
  }
  if (utils._.isValid(value)) {
    data[dataKey] = value;
  }
}

function getUAData(useragent) {
  var uaData = parser.setUA(useragent).getResult();
  var os_generic = "";
  var os = "";
  if (utils._.isValid(uaData.os)) {
    var data = uaData.os;
    if (utils._.isValid(data.name)) {
      os_generic = data.name;
    }
    if (utils._.isValid(data.version)) {
      os = os_generic + ' ' + data.version;
    }
  }
  var browser_generic = "";
  var browser = "";
  if (utils._.isValid(uaData.browser)) {
    var data = uaData.browser;
    if (utils._.isValid(data.name)) {
      browser_generic = data.name;
    }
    if (utils._.isValid(data.version)) {
      browser = browser_generic + ' ' + data.version;
    }
  }

  var device_model = "";
  var device_vendor = "";
  var device_type = "";
  if (utils._.isValid(uaData.device)) {
    var data = uaData.device;
    if (utils._.isValid(data.model)) {
      device_model = data.model;
    }
    if (utils._.isValid(data.vendor)) {
      device_vendor = data.vendor;
    }
    if (utils._.isValid(data.type)) {
      device_type = data.type;
    }
  }

  return {
    '$os': os,
    'os_generic': os_generic,
    '$browser': browser,
    'browser_generic': browser_generic,
    'device_model': device_model,
    'device_vendor': device_vendor,
    'device_type': device_type,
    'user_agent': useragent
  }
}

function getUserIp(req) {
  return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
}

function handleHeaders(req, res) {
  var data = {};
  appendFromHeader(req, data, 'x-forwarded-for', 'ip', getUserIp(req));
  appendFromHeader(req, data, 'x-forwarded-for', 'userip', getUserIp(req));
  appendFromHeader(req, data, 'x-request-id', 'herokuRequestId', null);
  appendFromHeader(req, data, 'x-request-start', 'herokuTime', utils.m.moment().unix().toString());
  helpers.req.appendToAdata(req, data);
  var useragent = req.headers['user-agent'];
  var uaData = getUAData(useragent);
  helpers.req.appendToAdata(req, uaData);
}


function visitTracker() {
  return function (req, res, next) {
    handleHeaders(req, res);
    next();
  }
}


function forceSSL() {
  return function(req, res, next) {
    if (utils.config.enforceSSL && req.header('x-forwarded-proto') != 'https') {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  }
}

module.exports = {
  visitTracker: visitTracker,
  forceSSL: forceSSL,
  handleReqCleanup: handleReqCleanup
};