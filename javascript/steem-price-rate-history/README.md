## Steem Price Rate History

This is a microservice application used to get the actual SBD/SP payout of a given post

## Getting Started
- Clone the repo
  - `git clone https://github.com/netuoso/steem-price-rate-history`
- Enter the app directory
  - `cd price_rate_history`
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
