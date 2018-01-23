## Steem Price Rate History

This is a microservice application used to get the actual SBD/SP payout of a given post

## Hosted at https://steemrate.steemliberator.com:9001

## Getting Started
- Clone the repo
  - `git clone https://github.com/SteemDevs/steem-examples`
- Enter the app directory
  - `cd steem-examples/javascript/steem-price-rate-history`
- Install dependencies
  - `npm install`
- Start your MongoDB client
  - `mongod --fork --logpath ./logs/mongodb.log`
- Configure database
	- `config.js`
- Seed data from SteemData
  - `npm run setupdb`
- Start the application
  - `npm run start`

## Required Params
- created
- promoted
- pending_payout_value
- percent_steem_dollars
- total_payout_value
- curator_payout_value
- author_rewards
- max_accepted_payout

## Example Object
```
{ created: '2018-01-23T00:42:03',
  promoted: '0.000 SBD',
  author_rewards: '0',
  total_payout_value: '0.000 SBD',
  max_accepted_payout: '1000000.000 SBD',
  curator_payout_value: '0.000 SBD',
  percent_steem_dollars: '10000',
  pending_payout_value: '2.370 SBD',
  total_pending_payout_value: '0.000 STEEM' }
```

## Example Request
- `curl 'https://steemrate.steemliberator.com/?created=2018-01-23T00%3A42%3A03&promoted=0.000%20SBD&author_rewards=0&total_payout_value=0.000%20SBD&max_accepted_payout=1000000.000%20SBD&curator_payout_value=0.000%20SBD&percent_steem_dollars=10000&pending_payout_value=2.370%20SBD&total_pending_payout_value=0.000%20STEEM'`

## Example Response
```
{"payoutPending":true,"averageRate":0,"fallbackActive":true,"sbdPayout":1.185,"steemPayout":null,"curatorSteemPayout":0}
```

## More Information

### What Does Fallback Active Mean In The Response?
The STEEM Rate is calculated from a moving average over the payout period of the post. If you check the value of a newly created post, there likely will not be enough information to calculate this average. In this situation, the current median STEEM price is determined from the Steem API at that time.

### How Is The STEEM Rate calculated?
The STEEM Rate is calculated by checking Filled Convert Requests that occured over the course of the payout period of the post. By viewing how much SBD went in and how much STEEM came out, we are able to get a very accurate estimate of the STEEM price.

