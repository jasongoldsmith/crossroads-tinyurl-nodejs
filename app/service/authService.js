var models = require('../models')
var utils = require('../utils')

function signupUser(userData, callback) {
	utils.async.waterfall(
			[
				function (callback) {
					models.user.createUserFromData(userData, callback)  // don't send message
				}
			],
			callback
	)
}

function requestResetPassword(userData, callback) {
	utils.async.waterfall(
			[
				function(callback) {
					//TBD: membershiptype is hardcoded to PSN for now. When we introduce multiple channels change this to take it from userdata
					// or send notification to both xbox and psn depending on the ID availability
					if(utils.config.enableBungieIntegration) {
						console.log("Destiny validation enabled")
						destinyService.sendBungieMessage(userData.psnId, "PSN", utils.constants.bungieMessageTypes.passwordReset, function (error, messageResponse) {
							if (messageResponse) {
								utils.l.d("messageResponse::token===" + messageResponse.token)
								userData.passwordResetToken = messageResponse.token
							}
							models.user.save(userData, callback)
						})
					}else {
						console.log("Destiny validation disabled")
						callback(null, userData)
					}
				}
			],
			callback
	)
}

function listMemberCountByClan(groupIds, callback){
	models.user.listMemberCount("clanId",{clanId:{$in:groupIds}},callback)
}

module.exports = {
	signupUser: signupUser,
	requestResetPassword: requestResetPassword,
	listMemberCountByClan:listMemberCountByClan
}