const express = require('express')
const app = express()

const MongoClient     = require("mongodb").MongoClient;
const streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;

var localDb = require('./config').outputDb
var steemdUrl = require('./config').steemdUrl

var steem = require('steem')
steem.api.setOptions({url: steemdUrl})

var moment = require('moment')

function betterParsePayoutAmount(author, post, cb) {

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
	  steem.api.getContentAsync(author, post)
      .then((content) => {
          var startDate = moment(content.created + ' Z')
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

              var payoutPending = parseFloat(content.pending_payout_value) > 0.0
              var percentSteemDollars = content.percent_steem_dollars / 10000

              var max_payout = content.max_accepted_payout
              var promoted = content.promoted

              // Only set when payout pending
              var pending_payout = parseFloat(content.pending_payout_value)
              var totalPendingPayout = content.total_pending_payout_value // unused

              // Only set after payout period
              var total_author_payout = parseFloat(content.total_payout_value)
              var total_curator_payout = parseFloat(content.curator_payout_value)

              var authorRewards = content.author_rewards

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
      .catch((err) => {
      	// console.log(err)
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
	if (req.query.author && req.query.post && req.query.author !== 'undefined') {
		// console.log(`get request: ${JSON.stringify(req.query)}`)
		betterParsePayoutAmount(req.query.author, req.query.post, function(data){
			res.send(data)
		})
	} else {
		res.send({error: 'Provide author and post as GET params', sbdPayout: 0, steemPayout: 0})
	}
})

app.listen(3000, function(){streamConvertRequests();console.log('Steem Price Rate History App Running on Port 3000!')})
