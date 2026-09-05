"""Additional cities & categories to grow the programmatic SEO matrix."""
LAW = ["https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=srgb&fm=jpg&q=85",
       "https://images.unsplash.com/photo-1505664194779-8beaceb93744?crop=entropy&cs=srgb&fm=jpg&q=85"]
HOME = ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?crop=entropy&cs=srgb&fm=jpg&q=85"]
HOTEL = ["https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=srgb&fm=jpg&q=85",
         "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=srgb&fm=jpg&q=85"]
VET = ["https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?crop=entropy&cs=srgb&fm=jpg&q=85",
       "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?crop=entropy&cs=srgb&fm=jpg&q=85"]
MOVE = ["https://images.unsplash.com/photo-1600518464441-9154a4dea21b?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?crop=entropy&cs=srgb&fm=jpg&q=85"]
ROOF = ["https://images.unsplash.com/photo-1632759145351-1d592919f522?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1635424710928-0544e8512eae?crop=entropy&cs=srgb&fm=jpg&q=85"]
HVAC = ["https://images.unsplash.com/photo-1581094288338-2314dddb7ece?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?crop=entropy&cs=srgb&fm=jpg&q=85"]
BAKE = ["https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?crop=entropy&cs=srgb&fm=jpg&q=85"]

EXTRA_CATEGORIES = [
    {"slug": "lawyers", "name": "Lawyers", "singular": "Lawyer", "icon": "scale", "images": LAW,
     "services": ["Personal Injury", "Family Law", "Criminal Defense", "Immigration", "Business Law", "Estate Planning"]},
    {"slug": "real-estate-agents", "name": "Real Estate Agents", "singular": "Real Estate Agent", "icon": "home", "images": HOME,
     "services": ["Home Buying", "Home Selling", "Rentals", "Property Valuation", "Commercial Real Estate", "Relocation Services"]},
    {"slug": "hotels", "name": "Hotels", "singular": "Hotel", "icon": "bed", "images": HOTEL,
     "services": ["Free WiFi", "Breakfast Included", "Swimming Pool", "Airport Shuttle", "Business Center", "Pet Friendly"]},
    {"slug": "veterinarians", "name": "Veterinarians", "singular": "Veterinarian", "icon": "paw-print", "images": VET,
     "services": ["Wellness Exams", "Vaccinations", "Pet Surgery", "Dental Care", "Emergency Vet", "Grooming"]},
    {"slug": "movers", "name": "Movers", "singular": "Moving Company", "icon": "truck", "images": MOVE,
     "services": ["Local Moving", "Long Distance Moving", "Packing Services", "Storage", "Office Relocation", "Piano Moving"]},
    {"slug": "roofing-contractors", "name": "Roofing Contractors", "singular": "Roofing Contractor", "icon": "hammer", "images": ROOF,
     "services": ["Roof Repair", "Roof Replacement", "Storm Damage", "Gutter Installation", "Roof Inspection", "Metal Roofing"]},
    {"slug": "hvac", "name": "HVAC Services", "singular": "HVAC Contractor", "icon": "thermometer", "images": HVAC,
     "services": ["AC Repair", "Furnace Installation", "Duct Cleaning", "Heat Pump Service", "Emergency HVAC", "Thermostat Setup"]},
    {"slug": "bakeries", "name": "Bakeries", "singular": "Bakery", "icon": "croissant", "images": BAKE,
     "services": ["Custom Cakes", "Fresh Bread", "Pastries", "Wedding Cakes", "Gluten-Free Options", "Coffee & Espresso"]},
]

EXTRA_CITIES = [
    {"slug": "san-jose", "name": "San Jose", "state": "california", "state_name": "California", "abbr": "CA", "lat": 37.3382, "lng": -121.8863, "tz": -7,
     "areas": ["Downtown San Jose", "Willow Glen", "Santana Row", "Almaden Valley", "Japantown", "Berryessa", "Evergreen", "Cambrian Park", "Rose Garden", "North San Jose"]},
    {"slug": "jacksonville", "name": "Jacksonville", "state": "florida", "state_name": "Florida", "abbr": "FL", "lat": 30.3322, "lng": -81.6557, "tz": -4,
     "areas": ["Downtown", "Riverside", "San Marco", "Jacksonville Beach", "Southside", "Mandarin", "Arlington", "Springfield", "Orange Park", "Ponte Vedra"]},
    {"slug": "fort-worth", "name": "Fort Worth", "state": "texas", "state_name": "Texas", "abbr": "TX", "lat": 32.7555, "lng": -97.3308, "tz": -5,
     "areas": ["Downtown", "Sundance Square", "Cultural District", "Near Southside", "Stockyards", "TCU Area", "Arlington Heights", "Alliance", "Keller", "Southlake"]},
    {"slug": "columbus", "name": "Columbus", "state": "ohio", "state_name": "Ohio", "abbr": "OH", "lat": 39.9612, "lng": -82.9988, "tz": -4,
     "areas": ["Short North", "German Village", "Downtown", "Clintonville", "Easton", "Dublin", "Grandview Heights", "Polaris", "Bexley", "Upper Arlington"]},
    {"slug": "charlotte", "name": "Charlotte", "state": "north-carolina", "state_name": "North Carolina", "abbr": "NC", "lat": 35.2271, "lng": -80.8431, "tz": -4,
     "areas": ["Uptown", "South End", "NoDa", "Plaza Midwood", "Ballantyne", "Dilworth", "Myers Park", "University City", "SouthPark", "Elizabeth"]},
    {"slug": "indianapolis", "name": "Indianapolis", "state": "indiana", "state_name": "Indiana", "abbr": "IN", "lat": 39.7684, "lng": -86.1581, "tz": -4,
     "areas": ["Downtown", "Broad Ripple", "Fountain Square", "Mass Ave", "Carmel", "Fishers", "Irvington", "Meridian-Kessler", "Castleton", "Greenwood"]},
    {"slug": "san-francisco", "name": "San Francisco", "state": "california", "state_name": "California", "abbr": "CA", "lat": 37.7749, "lng": -122.4194, "tz": -7,
     "areas": ["Mission District", "SoMa", "Castro", "Marina", "Nob Hill", "Haight-Ashbury", "Sunset District", "Richmond District", "Financial District", "North Beach"]},
    {"slug": "denver", "name": "Denver", "state": "colorado", "state_name": "Colorado", "abbr": "CO", "lat": 39.7392, "lng": -104.9903, "tz": -6,
     "areas": ["LoDo", "RiNo", "Capitol Hill", "Cherry Creek", "Highlands", "Five Points", "Washington Park", "Baker", "Central Park", "Aurora"]},
    {"slug": "washington-dc", "name": "Washington DC", "state": "district-of-columbia", "state_name": "District of Columbia", "abbr": "DC", "lat": 38.9072, "lng": -77.0369, "tz": -4,
     "areas": ["Georgetown", "Dupont Circle", "Capitol Hill", "Adams Morgan", "Navy Yard", "Shaw", "Columbia Heights", "Foggy Bottom", "U Street", "Petworth"]},
    {"slug": "boston", "name": "Boston", "state": "massachusetts", "state_name": "Massachusetts", "abbr": "MA", "lat": 42.3601, "lng": -71.0589, "tz": -4,
     "areas": ["Back Bay", "Beacon Hill", "South End", "North End", "Fenway", "Seaport", "Cambridge", "Somerville", "Jamaica Plain", "Dorchester"]},
    {"slug": "nashville", "name": "Nashville", "state": "tennessee", "state_name": "Tennessee", "abbr": "TN", "lat": 36.1627, "lng": -86.7816, "tz": -5,
     "areas": ["Downtown", "The Gulch", "East Nashville", "Germantown", "12 South", "Midtown", "Green Hills", "Berry Hill", "Franklin", "Brentwood"]},
    {"slug": "las-vegas", "name": "Las Vegas", "state": "nevada", "state_name": "Nevada", "abbr": "NV", "lat": 36.1699, "lng": -115.1398, "tz": -7,
     "areas": ["The Strip", "Downtown", "Summerlin", "Henderson", "Spring Valley", "Paradise", "Chinatown", "Arts District", "North Las Vegas", "Centennial Hills"]},
    {"slug": "portland", "name": "Portland", "state": "oregon", "state_name": "Oregon", "abbr": "OR", "lat": 45.5152, "lng": -122.6784, "tz": -7,
     "areas": ["Pearl District", "Downtown", "Hawthorne", "Alberta Arts", "Sellwood", "St. Johns", "Nob Hill", "Division", "Beaverton", "Lake Oswego"]},
    {"slug": "atlanta", "name": "Atlanta", "state": "georgia", "state_name": "Georgia", "abbr": "GA", "lat": 33.7490, "lng": -84.3880, "tz": -4,
     "areas": ["Midtown", "Buckhead", "Downtown", "Old Fourth Ward", "Inman Park", "Decatur", "Virginia-Highland", "West Midtown", "Sandy Springs", "East Atlanta"]},
    {"slug": "detroit", "name": "Detroit", "state": "michigan", "state_name": "Michigan", "abbr": "MI", "lat": 42.3314, "lng": -83.0458, "tz": -4,
     "areas": ["Downtown", "Midtown", "Corktown", "Eastern Market", "New Center", "Dearborn", "Royal Oak", "Ferndale", "Southfield", "Troy"]},
    {"slug": "oklahoma-city", "name": "Oklahoma City", "state": "oklahoma", "state_name": "Oklahoma", "abbr": "OK", "lat": 35.4676, "lng": -97.5164, "tz": -5,
     "areas": ["Bricktown", "Midtown", "Plaza District", "Paseo Arts District", "Automobile Alley", "Nichols Hills", "Edmond", "Moore", "Norman", "Yukon"]},
    {"slug": "memphis", "name": "Memphis", "state": "tennessee", "state_name": "Tennessee", "abbr": "TN", "lat": 35.1495, "lng": -90.0490, "tz": -5,
     "areas": ["Downtown", "Midtown", "Cooper-Young", "East Memphis", "Germantown", "Collierville", "Bartlett", "Overton Square", "Whitehaven", "Cordova"]},
    {"slug": "louisville", "name": "Louisville", "state": "kentucky", "state_name": "Kentucky", "abbr": "KY", "lat": 38.2527, "lng": -85.7585, "tz": -4,
     "areas": ["Downtown", "NuLu", "Highlands", "Old Louisville", "St. Matthews", "Germantown", "Crescent Hill", "Middletown", "Jeffersontown", "Clifton"]},
    {"slug": "baltimore", "name": "Baltimore", "state": "maryland", "state_name": "Maryland", "abbr": "MD", "lat": 39.2904, "lng": -76.6122, "tz": -4,
     "areas": ["Inner Harbor", "Fells Point", "Canton", "Federal Hill", "Mount Vernon", "Hampden", "Towson", "Charles Village", "Locust Point", "Columbia"]},
    {"slug": "milwaukee", "name": "Milwaukee", "state": "wisconsin", "state_name": "Wisconsin", "abbr": "WI", "lat": 43.0389, "lng": -87.9065, "tz": -5,
     "areas": ["Third Ward", "Downtown", "Bay View", "East Side", "Walker's Point", "Wauwatosa", "Brookfield", "Riverwest", "Shorewood", "West Allis"]},
]
