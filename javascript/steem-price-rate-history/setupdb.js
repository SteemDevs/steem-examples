// Seed local database from data available on SteemData.com

const MongoClient     = require("mongodb").MongoClient;
const streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;

var {inputDb, outputDb} = require('./config')

function setupDatabase() {
	MongoClient.connect(inputDb, (error, db) => {
		if(error) { throw error; }

	    const writableStream = streamToMongoDB({dbURL: outputDb, collection: 'FillConvertRequests'});

			const stream = db.collection('Operations').find({type: 'fill_convert_request'}).stream()

	    stream.pipe(writableStream);

	    stream.on("end", () => {
	    	db.close();
	    });
	  });
}

setupDatabase()
