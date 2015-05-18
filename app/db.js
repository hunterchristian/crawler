/**
 * Created by hunterhodnett on 5/8/15.
 */
var MongoClient = require('mongodb').MongoClient;
var GridStore = require('mongodb').GridStore;
var ObjectID = require('mongodb').ObjectID;
var Step = require('../node_modules/step/lib/step');
var assert = require('assert');
var url = 'mongodb://localhost:27017/recipedb';

if(process.argv.length < 3) {
    error('ERROR: Expected 1 argument - usage: db.js <fileName>');
    process.exit(1);
}

// Name of the file whose contents we want to write into a collection
// Also used as the name of the collection
var collectionName = process.argv[2];

// Only look through the recipes folder for the specified recipe type. TODO: Don't hardcode the recipes folder
var fs = require('fs');
var recipes = JSON.parse(fs.readFileSync('recipes/' + collectionName + '.json', 'utf8'));

var insertDocument = function(db, callback) {
    var chunkSize = 100;
    var increment = 1;
    var i = 0;
    var bulk = db.collection(collectionName).initializeUnorderedBulkOp();

    // Break up the document into write chunks since Mongo has a write size limit
    while(i < recipes.length) {

        bulk.insert(recipes[i]);

        if(i > (chunkSize * increment)) {
            log('inserting chunk');
            bulk.execute();
            increment++;
        }

        i++;
    }

    callback();
};

MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    log('successfully connected to server');

    insertDocument(db, function() {
        log('write successful, closing db');
        db.close();
    });
});

// Helper functions
function log(message) {
    console.log(collectionName.toUpperCase() + ': ' + message);
}

function error(message) {
    console.error(collectionName.toUpperCase() + ': ' + message);
}