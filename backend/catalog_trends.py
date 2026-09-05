"""Categories added from US Google Trends 'nearby' queries (top & rising)."""
def _u(pid, ixid):
    return f"https://images.unsplash.com/{pid}?crop=entropy&cs=srgb&fm=jpg&ixid={ixid}&ixlib=rb-4.1.0&q=85"


PIZZA = [_u("photo-1593504049359-74330189a345", "M3w4NjA0MTJ8MHwxfHNlYXJjaHw0fHxwaXp6YXxlbnwwfHx8fDE3ODg2Mjg4ODJ8MA")]
BAR = [_u("photo-1543007630-9710e4a00a20", "M3w4NjY2NzF8MHwxfHNlYXJjaHwzfHxiYXJ8ZW58MHx8fHwxNzg4NjI4ODgyfDA")]
BREW = [_u("photo-1555658636-6e4a36218be7", "M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxicmV3ZXJ5fGVufDB8fHx8MTc4ODYyODg4M3ww")]
GAS = [_u("photo-1695561324569-5e47c76dc0a3", "M3w4NTYxODh8MHwxfHNlYXJjaHwzfHxnYXMlMjBzdGF0aW9ufGVufDB8fHx8MTc4ODYyODg4Mnww")]
THRIFT = [_u("photo-1521335629791-ce4aec67dd15", "M3w4NjY2NzZ8MHwxfHNlYXJjaHwzfHx0aHJpZnQlMjBzdG9yZXxlbnwwfHx8fDE3ODg2Mjg4ODJ8MA")]
LIQUOR = [_u("photo-1690248387895-2db2a8072ecc", "M3w4NjA1ODR8MHwxfHNlYXJjaHw0fHxsaXF1b3IlMjBzdG9yZXxlbnwwfHx8fDE3ODg2Mjg4ODN8MA")]
DINER = [_u("photo-1555992336-fb0d29498b13", "M3w4NjAzMzV8MHwxfHNlYXJjaHw0fHxkaW5lcnxlbnwwfHx8fDE3ODg2Mjg4ODJ8MA")]
ICE = [_u("photo-1497034825429-c343d7c6a68f", "M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxpY2UlMjBjcmVhbXxlbnwwfHx8fDE3ODg2Mjg4ODJ8MA")]
BRUNCH = [_u("photo-1621523132966-19f711d565d1", "M3w4NjA1OTN8MHwxfHNlYXJjaHwzfHxicnVuY2h8ZW58MHx8fHwxNzg4NjI4ODgyfDA")]
MALL = [_u("photo-1580793241553-e9f1cce181af", "M3w4NjA2MTJ8MHwxfHNlYXJjaHwzfHxzaG9wcGluZyUyMG1hbGx8ZW58MHx8fHwxNzg4NjI4ODgzfDA")]
BURGER = [_u("photo-1572802419224-296b0aeee0d9", "M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxidXJnZXJ8ZW58MHx8fHwxNzg4NjI4ODgyfDA")]
TACO = [_u("photo-1599974579688-8dbdd335c77f", "M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHx0YWNvc3xlbnwwfHx8fDE3ODg2Mjg4ODJ8MA")]
MOVIE = [_u("photo-1489599849927-2ee91cede3ba", "M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHRoZWF0ZXJ8ZW58MHx8fHwxNzg4NjI4ODgyfDA")]
PARK = [_u("photo-1568480289356-5a75d0fd47fc", "M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHxwYXJrfGVufDB8fHx8MTc4ODYyODg4M3ww")]

TREND_CATEGORIES = [
    {"slug": "pizza", "name": "Pizza Places", "singular": "Pizza Place", "icon": "pizza", "images": PIZZA,
     "services": ["New York Style", "Wood-Fired Pizza", "Delivery", "Slices To Go", "Vegan Options", "Late Night"]},
    {"slug": "bars", "name": "Bars & Pubs", "singular": "Bar", "icon": "beer", "images": BAR,
     "services": ["Craft Cocktails", "Happy Hour", "Live Music", "Sports on TV", "Rooftop Seating", "Late Night"]},
    {"slug": "breweries", "name": "Breweries", "singular": "Brewery", "icon": "beer", "images": BREW,
     "services": ["Taproom", "Brewery Tours", "Flights & Tastings", "Dog Friendly", "Food Trucks", "Growler Fills"]},
    {"slug": "gas-stations", "name": "Gas Stations", "singular": "Gas Station", "icon": "fuel", "images": GAS,
     "services": ["24 Hour Fuel", "Diesel", "EV Charging", "Convenience Store", "Car Wash", "Air & Vacuum"]},
    {"slug": "thrift-stores", "name": "Thrift Stores", "singular": "Thrift Store", "icon": "shirt", "images": THRIFT,
     "services": ["Vintage Clothing", "Furniture", "Books & Media", "Donation Drop-off", "Designer Finds", "Kids Clothing"]},
    {"slug": "liquor-stores", "name": "Liquor Stores", "singular": "Liquor Store", "icon": "wine", "images": LIQUOR,
     "services": ["Wine Selection", "Craft Beer", "Spirits", "Delivery", "Chilled Drinks", "Gift Sets"]},
    {"slug": "diners", "name": "Diners", "singular": "Diner", "icon": "coffee", "images": DINER,
     "services": ["All-Day Breakfast", "Burgers & Fries", "Milkshakes", "Open 24 Hours", "Counter Seating", "Homestyle Meals"]},
    {"slug": "ice-cream", "name": "Ice Cream Shops", "singular": "Ice Cream Shop", "icon": "ice-cream-cone", "images": ICE,
     "services": ["Homemade Ice Cream", "Gelato", "Vegan Flavors", "Milkshakes", "Sundaes", "Ice Cream Cakes"]},
    {"slug": "breakfast-brunch", "name": "Breakfast & Brunch", "singular": "Breakfast Spot", "icon": "egg-fried", "images": BRUNCH,
     "services": ["Pancakes & Waffles", "Eggs Benedict", "Bottomless Mimosas", "Avocado Toast", "Outdoor Patio", "Coffee Bar"]},
    {"slug": "shopping-malls", "name": "Shopping Malls", "singular": "Shopping Mall", "icon": "shopping-bag", "images": MALL,
     "services": ["Department Stores", "Food Court", "Cinema", "Free Parking", "Kids Play Area", "Outlet Deals"]},
    {"slug": "fast-food", "name": "Fast Food", "singular": "Fast Food Restaurant", "icon": "sandwich", "images": BURGER,
     "services": ["Drive-Thru", "Burgers", "Chicken", "Combo Meals", "Late Night", "Mobile Ordering"]},
    {"slug": "mexican-restaurants", "name": "Mexican Restaurants", "singular": "Mexican Restaurant", "icon": "utensils-crossed", "images": TACO,
     "services": ["Tacos", "Burritos", "Margaritas", "Taco Tuesday", "Vegetarian Options", "Catering"]},
    {"slug": "movie-theaters", "name": "Movie Theaters", "singular": "Movie Theater", "icon": "film", "images": MOVIE,
     "services": ["IMAX", "Recliner Seats", "Matinee Prices", "Dine-In", "3D Movies", "Online Booking"]},
    {"slug": "parks", "name": "Parks", "singular": "Park", "icon": "trees", "images": PARK,
     "services": ["Playground", "Walking Trails", "Dog Park", "Picnic Areas", "Sports Fields", "Restrooms"]},
]

# Keyword -> category slug mapping used to auto-map Google Trends queries.
TREND_KEYWORDS = [
    (["coffee", "cafe", "starbucks", "dunkin"], "coffee-shops"),
    (["pizza"], "pizza"),
    (["brewery", "breweries"], "breweries"),
    (["bar", "bars", "pub", "brewpub"], "bars"),
    (["gas", "fuel", "shell", "chevron", "exxon"], "gas-stations"),
    (["thrift", "goodwill", "consignment"], "thrift-stores"),
    (["liquor", "wine store", "beer store"], "liquor-stores"),
    (["diner"], "diners"),
    (["ice cream", "gelato", "frozen yogurt"], "ice-cream"),
    (["breakfast", "brunch"], "breakfast-brunch"),
    (["mall", "outlet", "shopping"], "shopping-malls"),
    (["fast food", "mcdonald", "burger king", "wendy", "chick-fil", "taco bell", "burger"], "fast-food"),
    (["mexican", "taco", "tacos", "burrito"], "mexican-restaurants"),
    (["movie", "cinema", "amc", "theater", "theatre"], "movie-theaters"),
    (["park", "parks", "playground", "trail"], "parks"),
    (["hotel", "motel", "inn", "resort", "stay"], "hotels"),
    (["walmart", "target", "store", "grocery", "supermarket", "costco", "kroger", "grocery store"], "supermarkets"),
    (["plumber", "plumbing"], "plumbers"),
    (["electrician", "electrical"], "electricians"),
    (["dentist", "dental"], "dentists"),
    (["mechanic", "auto", "car repair", "tire", "oil change"], "auto-repair"),
    (["pharmacy", "drugstore", "cvs", "walgreens"], "pharmacy"),
    (["gym", "fitness", "fitness center"], "gyms"),
    (["salon", "haircut", "barber", "hair"], "salons"),
    (["storage"], "storage-units"),
    (["locksmith"], "locksmiths"),
    (["lawyer", "attorney"], "lawyers"),
    (["realtor", "real estate", "apartments", "homes for"], "real-estate-agents"),
    (["vet", "veterinar", "animal hospital"], "veterinarians"),
    (["mover", "moving"], "movers"),
    (["roof"], "roofing-contractors"),
    (["hvac", "ac repair", "air conditioner", "portable ac", "heating"], "hvac"),
    (["bakery", "bakeries", "donut", "bagel", "cake"], "bakeries"),
    (["sushi", "ramen", "chinese", "thai", "indian food", "italian", "food", "restaurant", "eat", "dinner", "lunch", "steak", "seafood", "bbq", "wings"], "restaurants"),
]
