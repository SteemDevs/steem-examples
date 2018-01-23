const express = require('express')
const app = express()

const MongoClient     = require("mongodb").MongoClient;
const streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;

var localDb = require('./config').outputDb
var steemdUrl = require('./config').steemdUrl

var steem = require('steem')
steem.api.setOptions({url: steemdUrl})

var moment = require('moment')

function betterParsePayoutAmount(postObject, cb) {
	console.log(postObject)

	var {
		created,
		promoted,
		author_rewards,
		total_payout_value,
		max_accepted_payout,
		curator_payout_value,
		percent_steem_dollars,
		pending_payout_value,
		total_pending_payout_value,
	} = postObject

	MongoClient.connect(localDb, (error, db) => {
		var fallbackRate = 0
		var fallbackActive = false

		steem.api.getCurrentMedianHistoryPrice(function(err,res){
			if (err) {
 				fallbackRate = 0
			} else if (res) {
				fallbackRate = parseFloat(res.base)
			}
		})

    var startDate = moment(created + ' Z')
    var endDate = startDate.clone().add(7, 'days')

    db.collection('FillConvertRequests').find({
			timestamp: { $gte: new Date(startDate), $lt: new Date(endDate) }
    }).toArray(function(err, docs) {
    	if (docs.length > 0) {
        var averageIn = docs.reduce((a,b) => {return a+b.amount_in.amount}, 0)/docs.length
        var averageOut = docs.reduce((a,b) => {return a+b.amount_out.amount}, 0)/docs.length
        var averageRate = parseFloat((averageIn/averageOut).toFixed(3))
    	} else {
    		var averageRate = fallbackRate
    		var fallbackActive = true
    	}

      var payoutPending = parseFloat(pending_payout_value) > 0.0
      var percentSteemDollars = percent_steem_dollars / 10000

      var max_payout = max_accepted_payout
      var promoted = promoted

      // Only set when payout pending
      var pending_payout = parseFloat(pending_payout_value)
      var totalPendingPayout = total_pending_payout_value // unused

      // Only set after payout period
      var total_author_payout = parseFloat(total_payout_value)
      var total_curator_payout = parseFloat(curator_payout_value)

      var authorRewards = author_rewards

      if (payoutPending) {
        var sbdPayout = pending_payout * (percentSteemDollars/2)
        var steemPayout = parseFloat(((pending_payout - sbdPayout) / averageRate).toFixed(3))
        var curatorSteemPayout = 0.0
      } else {
        var sbdPayout = total_author_payout * (percentSteemDollars/2)
        var steemPayout = parseFloat((((total_author_payout - sbdPayout) + authorRewards/1000) / averageRate).toFixed(3))
        var curatorSteemPayout = parseFloat(((total_curator_payout) / averageRate).toFixed(3))
      }

      cb({payoutPending, averageRate, fallbackActive, sbdPayout, steemPayout, curatorSteemPayout})
	  })
	})
}

function streamConvertRequests() {
	try {
		MongoClient.connect(localDb, (error, db) => {
			console.log('[DB] Established database connection')
			console.log('[Steem] Started streaming operations')
			steem.api.streamOperations(function(err,operation){
				if (operation && operation[0] === 'fill_convert_request') {
				  db.collection('FillConvertRequests').insert(operation[1]);
					console.log('[DB] Added new record to FillConvertRequests')
				}
			})
		})
	} catch(err) {
		streamConvertRequests()
	}
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res) {

	// Required Params:
	// created, promoted, pending_payout_value, percent_steem_dollars
	// total_payout_value, curator_payout_value, author_rewards, max_accepted_payout

	if (req.query) {
			betterParsePayoutAmount(req.query, function(data){res.send(data)})
	} else {
		res.send({error: 'Provide author and post as GET params', sbdPayout: 0, steemPayout: 0})
	}
})

app.listen(3000, function(){streamConvertRequests();console.log('Steem Price Rate History App Running on Port 3000!')})
