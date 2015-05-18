/**
 * Created by hunterhodnett on 5/7/15.
 */

var exports = module.exports = {};

exports.getStrBetween = function(string, str1, str2) {

    if(typeof string === 'undefined') {
        throw new Error('string is undefined\nusage: getStrBetween(string, str1, str2)');
    }
    if(typeof str1 === 'undefined') {
        throw new Error('str1 is undefined\nusage: getStrBetween(string, str1, str2)');
    }
    if(typeof str2 === 'undefined') {
        throw new Error('str2 is undefined\nusage: getStrBetween(string, str1, str2)');
    }

    var str1Loc = string.indexOf(str1);
    var str2Loc = string.indexOf(str2, str1Loc);

    if(str1Loc < 0) {
        throw new Error('could not find str1 within string\nstr1: ' + str1 + '\nstring: ' + string);
    }
    if(str2Loc < 0) {
        throw new Error('could not find str2 within string past str1\nstr2: ' + str2 + '\nstring: ' + string +
        '\nstr1: ' + str1);
    }

    return string.substring(str1Loc + str1.length, str2Loc) || -1;
};

exports.getRating = function(ratingsJsonObj, contWidth) {

    if(typeof contWidth === 'undefined') {
        throw new Error('contWidth is undefined\nusage: getRating(ratingsJsonObj, contWidth)');
    }
    if(typeof ratingsJsonObj === 'undefined') {
        throw new Error('ratingsJsonObj is undefined\nusage: getRating(ratingsJsonObj, contWidth)');
    }
    if(typeof ratingsJsonObj.attributes === 'undefined') {
        throw new Error('attributes not present in ratingsJsonObj');
    }
    if(typeof ratingsJsonObj.attributes.style === 'undefined') {
        throw new Error('style not present in attributes');
    }

    var ratingWidthStr = exports.getStrBetween(ratingsJsonObj.attributes.style, 'width:', 'px');
    var ratingWidthInt = parseInt(ratingWidthStr);

    if(isNaN(ratingWidthInt) || ratingWidthInt < 0) {
        throw new Error('could not get width of ratings container from getStrBetween()\nvalue received: ' +
            ratingWidthStr);
    }

    var rating = ratingWidthInt / contWidth * 100;

    return Math.round(rating);
};