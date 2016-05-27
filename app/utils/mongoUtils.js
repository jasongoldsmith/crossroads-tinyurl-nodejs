var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

function fromMoment(dateMoment) {
  return ObjectId.createFromTime(dateMoment.toDate().getTime()/1000);
}

module.exports = {
  toObjectID: ObjectId,
  ObjectID: ObjectId,
  fromMoment: fromMoment
};