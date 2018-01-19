// Account Recovery Script
//
// How To Use:
// npm run recover USERNAME NEW_PASSWORD OLD_PASSWORD
// Ex: npm run recover steemcreate new_awesome_password old_working_password

var steem = require('steem');
steem.api.setOptions({url: 'https://api.steemit.com'});

var username = process.argv[2];
var newPassword = process.argv[3];
var oldPassword = process.argv[3];

function generateNewKeys() {
	return steem.auth.getPrivateKeys(username, newPassword, ['owner']);
}

function generateOldKeys() {
	return steem.auth.getPrivateKeys(username, oldPassword, ['owner']);
}

var newKeyInfo = generateNewKeys();
var oldKeyInfo = generateOldKeys();

var newOwnerPrivateKey = keyInfo.owner;
var newOwnerPublicKey = keyInfo.ownerPubkey;
var memoPrivateKey = keyInfo.memo;

var oldOwnerPrivateKey = oldKeyInfo.owner;
var oldOwnerPublicKey = oldKeyInfo.ownerPubkey;

function recoverAccount() {
	steem.broadcast.send({
	    extensions: [],
	    operations: [[
	        'recover_account',
	        {
	            username,
	            new_owner_authority: {weight_threshold: 1, account_auths: [], key_auths: [[newOwnerPublicKey, 1]]},
	            recent_owner_authority: {weight_threshold: 1, account_auths: [], key_auths: [[oldOwnerPublicKey, 1]]}
	        }
	    ]]
	}, [oldOwnerPrivateKey, newOwnerPrivateKey], (err, res) => {
		console.log(err ? 'Error: ' + err : 'Result: ' + res);
	});
}

recoverAccount();
