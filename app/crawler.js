
var casper = require('casper').create();
var helpers = require('helpers.js');
var fs = require('fs');

if(casper.cli.args.length < 2) {
    log('ERROR: Expected 2 arguments - usage: crawler.js <url> <recipeType>');
    casper.exit();
}

// Allrecipes.com appetizers
var url = casper.cli.args[0];
// Type of recipes being scraped
var recipeType = casper.cli.args[1];

// Ratings are calculated by dividing the width of the rating box container by the width of the rating box
// This is the with of the rating box container
var ratingTotal = 82;
var recipes = [];
var pagesJson;
var numPages;
var counter;

// Reduce page load time by not loading images
casper.options.pageSettings.loadImages = false;

// Scrape the page
casper.start(url, function() {
    // scrapePage makes a recursive call to get subsequent pages
    counter = 1;
    scrapePage(counter);
});

// Save the data
casper.run(function() {
    log('recipes scraped: ' + recipes.length);

    var fileName =  'recipes/' + recipeType + '.json';
    log('writing recipes to ' + fileName);
    fs.write(fileName, JSON.stringify(recipes), 'w');
    log('write complete');

    log('end of execution');

    casper.exit();
});

// Helper functions
function log(message) {
    console.log(recipeType.toUpperCase() + ': ' + message);
}

function error(message) {
    console.error(collectionName.toUpperCase() + ': ' + message);
}

function scrapePage(counter){
    casper.thenOpen(url + '&Page=' + counter + '#recipes', function() {

        log('scraping page ' + counter);

        // Get all the recipes on the page
        var wrappers = this.getElementsInfo('div#divGridItemWrapper');
        var links = this.getElementsInfo('div#divGridItemWrapper a.img-link');
        var names = this.getElementsInfo('div#divGridItemWrapper .recipe-info p a');
        var ratings = this.getElementsInfo('div#divGridItemWrapper .recipe-info .rating-stars-grad');

        for (var i = 0; i < wrappers.length; i++) {

            var recipe = {
                rating: helpers.getRating(ratings[i], 82),
                name: names[i].text,
                link: links[i].attributes.href,
                type: recipeType
            };

            var nextPgAvailable = this.getElementInfo('#ctl00_CenterColumnPlaceHolder_RecipeContainer_ucPager_corePager_pageNumbers a:last-of-type');
            nextPgAvailable = nextPgAvailable.text.indexOf('NEXT') > -1;

            // Retrieve the ingredients for the currently indexed recipe
            scrapeIngredients(recipe, 'http://www.allrecipes.com' + links[i].attributes.href, function(recipe, ingredients){
                recipe.ingredients = ingredients;
                recipes.push(recipe);

                if(i === wrappers.length && nextPgAvailable && counter < 2) {
                    scrapePage(++counter);
                } else {
                    log('finished scraping, ' + counter + ' pages scraped.');
                }
            });
        }
    });
}

function scrapeIngredients(recipe, link, callback){
    casper.thenOpen(link, function() {
        var ingredients = [];

        log(link);
        //this.capture('screenshots/captcha.png');

        var wrappers = this.getElementsInfo('ul.ingredient-wrap .fl-ing');
        var amounts = this.getElementsInfo('ul.ingredient-wrap .ingredient-amount');
        var names = this.getElementsInfo('ul.ingredient-wrap .ingredient-name');

        var amtCounter = 0;
        var nmsCounter = 0;
        for(var i = 0;i < wrappers.length;i++) {

            var containsAmount = wrappers[i].html.indexOf('ingredient-amount') > -1 && amounts[i];
            var containsName = wrappers[i].html.indexOf('ingredient-name') > -1 && names[i];

            if(containsAmount && containsName) {
                ingredients.push({
                    amount: amounts[amtCounter].text,
                    name: names[i].text
                });
                amtCounter++;
                nmsCounter++;
            } else if(!containsAmount && !containsName) {
                if(wrappers[i].html.indexOf('ingred-heading') > -1) {
                    // TODO: This means there is a heading in the ingredients. This could indicate the following
                    // ingredient is a sauce, do something with this information.
                } else {
                    throw new Error('scrapeIngredients: no name or amount found in wrapper!');
                }
            } else if(!containsName) {
                throw new Error('scrapeIngredients: no name found in wrapper!');
            } else {
                // Only amount is missing, this is okay since some recipes don't contain amounts
                ingredients.push({
                    amount: "",
                    name: names[i].text
                });
                nmsCounter++;
            }
        }

        callback(recipe, ingredients);
    });
}