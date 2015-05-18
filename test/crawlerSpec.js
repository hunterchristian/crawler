/**
 * Created by hunterhodnett on 5/7/15.
 */
var chai = require('chai');
var assert = chai.assert;
var helpers = require('../app/helpers.js');

describe('Rating helpers', function() {

    it('should return the width of a star ratings container', function() {

        var expectedWidth = 82;
        var htmlInfo = 'width:82px;';

        var actualWidth = helpers.getStrBetween(htmlInfo, 'width:', 'px');
        assert.equal(expectedWidth, actualWidth);
    });

    it('should return a rating between 0 and 100 for a given rating width and container width', function() {

        var contWidth = 82;
        var ratingJson = {
            "attributes": {
                "class": "rating-stars-grad",
                "style": "width:72px;"
            },
            "height": 15,
            "html": "\n\n\t\t",
            "nodeName": "div",
            "tag": "<div class=\"rating-stars-grad\" style=\"width:82px;\">\n\n\t\t</div>",
            "text": "\n\n\t\t",
            "visible": true,
            "width": 82,
            "x": 175,
            "y": 586
        };

        var rating = helpers.getRating(ratingJson, contWidth);

        assert.isAbove(rating, 0);
        assert.isBelow(rating, 101);
    });
});