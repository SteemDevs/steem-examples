// Generate New Owner Authority Script
//
// How To Use:
// npm run getkeys USERNAME NEW_PASSWORD
// Ex: npm run getkeys steemcreate new_awesome_password

var steem = require('steem');
steem.api.setOptions({url: 'https://api.steemit.com'});

var username = process.argv[2];
var password = process.argv[3];

function generateKeys() {
	return steem.auth.getPrivateKeys(username, password, ['owner','posting','active','memo']);
}

var keyInfo = generateKeys();
var ownerPrivateKey = keyInfo.owner;
var ownerPublicKey = keyInfo.ownerPubkey;
var activePrivateKey = keyInfo.active;
var postingPrivateKey = keyInfo.posting;
var memoPrivateKey = keyInfo.memo;

console.log('********\nSAVE ALL OF THIS INFORMATION.\nNEVER SHARE THE PASSWORD OR PRIVATE KEYS WITH ANYONE!\n********\n');
console.log('Username: ' + username);
console.log('Password: ' + password + '\n');
console.log({ownerPrivateKey, activePrivateKey, postingPrivateKey, memoPrivateKey});

console.log('\nSend the following information to your recovery agent to begin account recovery for: @' + username + '\n');

console.log({ownerPublicKey});
