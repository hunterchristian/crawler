#!/usr/bin/env bash

verbose=false

while getopts "h?vf:" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    v)  verbose=true
        ;;
    f)  output_file=$OPTARG
        ;;
    esac
done

# Loading spinner
spinner()
{
    local pid=$1
    local delay=0.25
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Prints out the current time. Used to see when a log file was generated.
timestamp() {
  date +"%T"
}

# Scraping scripts log file
SCRAPE_LOG_FILE="run-logs/crawler.console.log"

# Scraping scripts error file
SCRAPE_ERR_FILE="run-logs/crawler.console.error"

# DB scripts log file
DB_LOG_FILE="run-logs/db.console.log"

# DB scripts error file
DB_ERR_FILE="run-logs/db.console.error"

# Urls of the pages to be scraped
#urls=(
#    'http://allrecipes.com/recipes/appetizers-and-snacks/main.aspx?soid=showcase_1',
#    'http://allrecipes.com/recipes/breakfast-and-brunch/?soid=showcase_2',
#    'http://allrecipes.com/recipes/meat-and-poultry/chicken/?soid=showcase_3',
#    'http://allrecipes.com/recipes/desserts/?soid=showcase_4',
#    'http://allrecipes.com/recipes/healthy-recipes/?soid=showcase_5',
#    'http://allrecipes.com/recipes/main-dish/?soid=showcase_6',
#    'http://allrecipes.com/recipes/pasta-and-noodles/main.aspx',
#    'http://allrecipes.com/Recipes/Everyday-Cooking/Slow-Cooker/?soid=showcase_8',
#    'http://allrecipes.com/recipes/everyday-cooking/vegetarian/?soid=showcase_10'
#)

urls=(
    'http://allrecipes.com/recipes/appetizers-and-snacks/main.aspx?soid=showcase_1'
)

# Additional arguments for the scraping and db scripts
#scriptArgs=(
#    'appetizers',
#    'breakfasts',
#    'chicken',
#    'desserts',
#    'healthy',
#    'maindish',
#    'pasta',
#    'slowcooker',
#    'vegetarian'
#)
scriptArgs=(
    'appetizers'
)

# How many pages we want to scrape
numUrls=${#urls[@]}

echo "********** `date` **********"
echo "--- SCRAPING CONTENT ---"
{
    echo "********** `date` **********" # Print the datetime
    PGCOUNTER=0
    while [ $PGCOUNTER -lt $numUrls ]; do
        # Remove the trailing comma from the collection name (stored in scriptArgs)
        if [ $((PGCOUNTER+1)) -lt $numUrls ]; then
            scriptArgs[$PGCOUNTER]=${scriptArgs[$PGCOUNTER]%?}
        fi

        # Scrape the page
        /usr/local/bin/casperjs crawler.js ${urls[$PGCOUNTER]} ${scriptArgs[$PGCOUNTER]} &

        let PGCOUNTER=PGCOUNTER+1
    done
} #> $SCRAPE_LOG_FILE 2> $SCRAPE_ERR_FILE
wait

echo "--- SAVING CONTENT TO DATABASE ---"
{
    echo "********** `date` **********" # Print the datetime
    DBCOUNTER=0
    while [ $DBCOUNTER -lt $numUrls ]; do
        # Save the page data to the database
        node db.js ${scriptArgs[$DBCOUNTER]} &

        let DBCOUNTER=DBCOUNTER+1
    done
} #> $DB_LOG_FILE 2> $DB_ERR_FILE
wait

APPENDSTR=""
# See if any errors occurred in the JS scripts
if [ -s $DB_ERR_FILE ] || [ -s $SCRAPE_ERR_FILE ]; then
    APPENDSTR='with errors'
fi

echo "...crawling process complete $APPENDSTR"