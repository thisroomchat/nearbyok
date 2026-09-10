"""Multi-country config (Indeed-style sub-folders): nearbyok.com = USA, /in, /ae, /ca, /uk, /au."""

COUNTRIES = {
    "us": {"code": "us", "name": "United States", "short": "USA", "flag": "🇺🇸", "prefix": "", "currency": "USD", "symbol": "$",
           "unit": "mi", "region_label": "State", "phone_cc": "+1", "google_region": "US", "hreflang": "en-US", "iso": "US"},
    "in": {"code": "in", "name": "India", "short": "India", "flag": "🇮🇳", "prefix": "/in", "currency": "INR", "symbol": "₹",
           "unit": "km", "region_label": "State", "phone_cc": "+91", "google_region": "IN", "hreflang": "en-IN", "iso": "IN"},
    "ae": {"code": "ae", "name": "United Arab Emirates", "short": "UAE", "flag": "🇦🇪", "prefix": "/ae", "currency": "AED", "symbol": "AED ",
           "unit": "km", "region_label": "Emirate", "phone_cc": "+971", "google_region": "AE", "hreflang": "en-AE", "iso": "AE"},
    "ca": {"code": "ca", "name": "Canada", "short": "Canada", "flag": "🇨🇦", "prefix": "/ca", "currency": "CAD", "symbol": "C$",
           "unit": "km", "region_label": "Province", "phone_cc": "+1", "google_region": "CA", "hreflang": "en-CA", "iso": "CA"},
    "uk": {"code": "uk", "name": "United Kingdom", "short": "UK", "flag": "🇬🇧", "prefix": "/uk", "currency": "GBP", "symbol": "£",
           "unit": "mi", "region_label": "Region", "phone_cc": "+44", "google_region": "GB", "hreflang": "en-GB", "iso": "GB"},
    "au": {"code": "au", "name": "Australia", "short": "Australia", "flag": "🇦🇺", "flag_": "", "prefix": "/au", "currency": "AUD", "symbol": "A$",
           "unit": "km", "region_label": "State", "phone_cc": "+61", "google_region": "AU", "hreflang": "en-AU", "iso": "AU"},
}
COUNTRY_CODES = list(COUNTRIES.keys())


def _c(slug, name, state, state_name, abbr, lat, lng, tz, areas):
    return {"slug": slug, "name": name, "state": state, "state_name": state_name, "abbr": abbr,
            "lat": lat, "lng": lng, "tz": tz, "areas": [a.strip() for a in areas.split(",")]}


IN_CITIES = [
    _c("delhi", "Delhi", "delhi", "Delhi", "DL", 28.6139, 77.2090, 5.5, "Connaught Place, Karol Bagh, Lajpat Nagar, Dwarka, Rohini, Saket, Janakpuri, Pitampura"),
    _c("mumbai", "Mumbai", "maharashtra", "Maharashtra", "MH", 19.0760, 72.8777, 5.5, "Andheri, Bandra, Borivali, Dadar, Powai, Thane, Malad, Colaba"),
    _c("bangalore", "Bangalore", "karnataka", "Karnataka", "KA", 12.9716, 77.5946, 5.5, "Koramangala, Indiranagar, Whitefield, Jayanagar, HSR Layout, Electronic City, Malleshwaram, Marathahalli"),
    _c("hyderabad", "Hyderabad", "telangana", "Telangana", "TS", 17.3850, 78.4867, 5.5, "Banjara Hills, Gachibowli, Madhapur, Kukatpally, Secunderabad, Jubilee Hills, Ameerpet, Kondapur"),
    _c("chennai", "Chennai", "tamil-nadu", "Tamil Nadu", "TN", 13.0827, 80.2707, 5.5, "T Nagar, Anna Nagar, Adyar, Velachery, Tambaram, Nungambakkam, Porur, OMR"),
    _c("kolkata", "Kolkata", "west-bengal", "West Bengal", "WB", 22.5726, 88.3639, 5.5, "Salt Lake, Park Street, Howrah, Behala, Dum Dum, Ballygunge, New Town, Garia"),
    _c("pune", "Pune", "maharashtra", "Maharashtra", "MH", 18.5204, 73.8567, 5.5, "Kothrud, Hinjewadi, Viman Nagar, Hadapsar, Baner, Wakad, Kalyani Nagar, Pimpri"),
    _c("ahmedabad", "Ahmedabad", "gujarat", "Gujarat", "GJ", 23.0225, 72.5714, 5.5, "Satellite, Navrangpura, Maninagar, Bopal, Prahlad Nagar, Vastrapur, Naroda, SG Highway"),
    _c("jaipur", "Jaipur", "rajasthan", "Rajasthan", "RJ", 26.9124, 75.7873, 5.5, "Vaishali Nagar, Malviya Nagar, C Scheme, Mansarovar, Tonk Road, Jagatpura, Raja Park, Sanganer"),
    _c("lucknow", "Lucknow", "uttar-pradesh", "Uttar Pradesh", "UP", 26.8467, 80.9462, 5.5, "Gomti Nagar, Hazratganj, Aliganj, Indira Nagar, Alambagh, Chowk, Mahanagar, Aashiana"),
    _c("chandigarh", "Chandigarh", "chandigarh", "Chandigarh", "CH", 30.7333, 76.7794, 5.5, "Sector 17, Sector 22, Sector 35, Manimajra, Zirakpur, Mohali, Panchkula, Industrial Area"),
    _c("ludhiana", "Ludhiana", "punjab", "Punjab", "PB", 30.9010, 75.8573, 5.5, "Model Town, Sarabha Nagar, Civil Lines, Dugri, Pakhowal Road, BRS Nagar, Ferozepur Road, Haibowal"),
    _c("amritsar", "Amritsar", "punjab", "Punjab", "PB", 31.6340, 74.8723, 5.5, "Ranjit Avenue, Lawrence Road, Hall Bazaar, Majitha Road, Green Avenue, Batala Road, Chheharta, Mall Road"),
    _c("jalandhar", "Jalandhar", "punjab", "Punjab", "PB", 31.3260, 75.5762, 5.5, "Model Town, Urban Estate, Civil Lines, Adarsh Nagar, Nakodar Road, Rama Mandi, Basti Bawa Khel, Cantt"),
    _c("surat", "Surat", "gujarat", "Gujarat", "GJ", 21.1702, 72.8311, 5.5, "Adajan, Vesu, Piplod, Varachha, Katargam, Athwa, Udhna, Pal"),
    _c("kochi", "Kochi", "kerala", "Kerala", "KL", 9.9312, 76.2673, 5.5, "Fort Kochi, Kakkanad, Edappally, Marine Drive, Vyttila, Palarivattom, Kaloor, Aluva"),
    _c("indore", "Indore", "madhya-pradesh", "Madhya Pradesh", "MP", 22.7196, 75.8577, 5.5, "Vijay Nagar, Palasia, Rajwada, Bhawarkua, Sapna Sangeeta, Scheme 54, MR 10, Rau"),
    _c("nagpur", "Nagpur", "maharashtra", "Maharashtra", "MH", 21.1458, 79.0882, 5.5, "Dharampeth, Sitabuldi, Sadar, Manish Nagar, Pratap Nagar, Wardha Road, Civil Lines, Hingna"),
    _c("gurgaon", "Gurgaon", "haryana", "Haryana", "HR", 28.4595, 77.0266, 5.5, "DLF Phase 1, Sector 29, Golf Course Road, Sohna Road, MG Road, Cyber City, Sector 56, Palam Vihar"),
    _c("goa", "Goa", "goa", "Goa", "GA", 15.4909, 73.8278, 5.5, "Panaji, Calangute, Baga, Margao, Vasco, Anjuna, Candolim, Mapusa"),
]

AE_CITIES = [
    _c("dubai", "Dubai", "dubai", "Dubai", "UAE", 25.2048, 55.2708, 4, "Deira, Bur Dubai, Jumeirah, Dubai Marina, Business Bay, Al Barsha, Downtown Dubai, Karama"),
    _c("abu-dhabi", "Abu Dhabi", "abu-dhabi", "Abu Dhabi", "UAE", 24.4539, 54.3773, 4, "Al Khalidiyah, Al Reem Island, Khalifa City, Mussafah, Al Bateen, Yas Island, Corniche, Al Zahiyah"),
    _c("sharjah", "Sharjah", "sharjah", "Sharjah", "UAE", 25.3463, 55.4209, 4, "Al Nahda, Al Majaz, Al Qasimia, Muwaileh, Al Taawun, Rolla, Al Khan, Industrial Area"),
    _c("ajman", "Ajman", "ajman", "Ajman", "UAE", 25.4052, 55.5136, 4, "Al Nuaimiya, Al Rashidiya, Al Jurf, Al Rawda, Al Mowaihat, Corniche, Al Bustan, Al Hamidiya"),
    _c("al-ain", "Al Ain", "abu-dhabi", "Abu Dhabi", "UAE", 24.2075, 55.7447, 4, "Al Jimi, Al Mutarad, Al Towayya, Al Khabisi, Falaj Hazza, Zakher, Al Muwaiji, Hili"),
    _c("ras-al-khaimah", "Ras Al Khaimah", "ras-al-khaimah", "Ras Al Khaimah", "UAE", 25.8007, 55.9762, 4, "Al Nakheel, Al Hamra, Al Dhait, Khuzam, Al Qusaidat, Mina Al Arab, Al Jazirah Al Hamra, Old Town"),
    _c("fujairah", "Fujairah", "fujairah", "Fujairah", "UAE", 25.1288, 56.3265, 4, "Al Faseel, Sakamkam, Al Gurfa, Merashid, Madhab, Al Hilal, Corniche, Dibba Road"),
    _c("umm-al-quwain", "Umm Al Quwain", "umm-al-quwain", "Umm Al Quwain", "UAE", 25.5647, 55.5552, 4, "Old Town, Al Salamah, Al Raas, Al Humrah, Al Ramlah, Falaj Al Mualla, Al Khor, King Faisal Street"),
    _c("khor-fakkan", "Khor Fakkan", "sharjah", "Sharjah", "UAE", 25.3391, 56.3419, 4, "Corniche, Al Zubarah, Al Harai, Al Mudaifi, Al Bardi, Hayawa, Al Luluyah, Old Souq"),
    _c("kalba", "Kalba", "sharjah", "Sharjah", "UAE", 25.0742, 56.3542, 4, "Corniche, Al Ghail, Al Qadisiya, Al Bardi, Khor Kalba, Al Suhaila, Al Tuwaiya, Sur Kalba"),
    _c("dibba-al-fujairah", "Dibba Al Fujairah", "fujairah", "Fujairah", "UAE", 25.5920, 56.2616, 4, "Al Ghurfa, Al Rugaylat, Al Akamiya, Corniche, Al Fanaitees, Al Baraha, Sharm, Al Sanaiya"),
    _c("madinat-zayed", "Madinat Zayed", "abu-dhabi", "Abu Dhabi", "UAE", 23.6570, 53.7070, 4, "City Centre, Al Dhafra, Industrial Area, Al Mirfa Road, Al Marfa, Bida Zayed, Zayed Street, Al Wathba Road"),
    _c("ruwais", "Ruwais", "abu-dhabi", "Abu Dhabi", "UAE", 24.1100, 52.7300, 4, "Ruwais Housing, Al Ruwais Mall, Industrial Area, Ruwais Beach, Al Sila Road, Al Dhafra, Jebel Dhanna, Al Mirfa"),
    _c("al-dhaid", "Al Dhaid", "sharjah", "Sharjah", "UAE", 25.2882, 55.8814, 4, "Al Dhaid Centre, Al Madam Road, Al Nakhla, Al Bataeh, Mleiha Road, Al Ghafia, Fili, Al Sajaa"),
    _c("hatta", "Hatta", "dubai", "Dubai", "UAE", 24.8030, 56.1250, 4, "Hatta Dam, Heritage Village, Hatta Hill Park, Wadi Hub, Al Ghail, Hatta Fort, Hatta Souq, Hatta Wadi"),
    _c("jebel-ali", "Jebel Ali", "dubai", "Dubai", "UAE", 24.9857, 55.0272, 4, "Jebel Ali Village, Jebel Ali Free Zone, Discovery Gardens, Jebel Ali Industrial, Palm Jebel Ali, Dubai Investments Park, Jebel Ali Downtown, Al Furjan"),
    _c("ghayathi", "Ghayathi", "abu-dhabi", "Abu Dhabi", "UAE", 23.8380, 52.8100, 4, "Ghayathi Centre, Al Dhafra Road, Industrial Area, Ghayathi Park, Ghayathi Mall, Al Sila Road, Ghayathi Souq, Ghayathi Housing"),
    _c("liwa", "Liwa", "abu-dhabi", "Abu Dhabi", "UAE", 23.1300, 53.7700, 4, "Mezaira, Al Mariah, Hameem, Liwa Oasis, Tal Moreeb, Al Qua'a, Al Wathba Road, Liwa Centre"),
    _c("masafi", "Masafi", "ras-al-khaimah", "Ras Al Khaimah", "UAE", 25.3050, 56.1600, 4, "Friday Market, Masafi Centre, Wadi Masafi, Al Tawiyeen, Masafi Farms, Dibba Road, Fujairah Road, Masafi Hills"),
    _c("al-madam", "Al Madam", "sharjah", "Sharjah", "UAE", 24.9530, 55.7660, 4, "Al Madam Centre, Ghost Village, Al Madam Dunes, Hatta Road, Al Madam Souq, Al Madam Farms, Al Ghubaiba Road, Al Madam Park"),
]

CA_CITIES = [
    _c("toronto", "Toronto", "ontario", "Ontario", "ON", 43.6532, -79.3832, -4, "Downtown, Scarborough, North York, Etobicoke, Yorkville, Liberty Village, The Annex, Leslieville"),
    _c("montreal", "Montreal", "quebec", "Quebec", "QC", 45.5017, -73.5673, -4, "Plateau, Old Montreal, Downtown, Mile End, Griffintown, Westmount, Verdun, Laval"),
    _c("vancouver", "Vancouver", "british-columbia", "British Columbia", "BC", 49.2827, -123.1207, -7, "Downtown, Kitsilano, Yaletown, Gastown, Mount Pleasant, Burnaby, Richmond, Kerrisdale"),
    _c("calgary", "Calgary", "alberta", "Alberta", "AB", 51.0447, -114.0719, -6, "Beltline, Kensington, Inglewood, Downtown, Bridgeland, Marda Loop, Mission, Airdrie"),
    _c("edmonton", "Edmonton", "alberta", "Alberta", "AB", 53.5461, -113.4938, -6, "Downtown, Whyte Avenue, Old Strathcona, West Edmonton, Sherwood Park, Oliver, Windermere, St. Albert"),
    _c("ottawa", "Ottawa", "ontario", "Ontario", "ON", 45.4215, -75.6972, -4, "ByWard Market, Centretown, The Glebe, Kanata, Westboro, Orleans, Barrhaven, Nepean"),
    _c("winnipeg", "Winnipeg", "manitoba", "Manitoba", "MB", 49.8951, -97.1384, -5, "Downtown, Osborne Village, St. Boniface, The Forks, St. Vital, Transcona, River Heights, Exchange District"),
    _c("quebec-city", "Quebec City", "quebec", "Quebec", "QC", 46.8139, -71.2080, -4, "Old Quebec, Sainte-Foy, Limoilou, Saint-Roch, Montcalm, Beauport, Charlesbourg, Levis"),
    _c("hamilton", "Hamilton", "ontario", "Ontario", "ON", 43.2557, -79.8711, -4, "Downtown, Westdale, Stoney Creek, Dundas, Ancaster, Locke Street, Waterdown, Concession Street"),
    _c("kitchener", "Kitchener", "ontario", "Ontario", "ON", 43.4516, -80.4925, -4, "Downtown, Waterloo, Cambridge, Doon, Forest Heights, Stanley Park, Uptown Waterloo, Huron Park"),
    _c("london", "London", "ontario", "Ontario", "ON", 42.9849, -81.2453, -4, "Downtown, Byron, Masonville, Old East Village, Wortley Village, Westmount, White Oaks, Oakridge"),
    _c("halifax", "Halifax", "nova-scotia", "Nova Scotia", "NS", 44.6488, -63.5752, -3, "Downtown, North End, South End, Dartmouth, Bedford, Clayton Park, Spryfield, Sackville"),
    _c("victoria", "Victoria", "british-columbia", "British Columbia", "BC", 48.4284, -123.3656, -7, "Downtown, James Bay, Oak Bay, Fernwood, Saanich, Langford, Esquimalt, Fairfield"),
    _c("saskatoon", "Saskatoon", "saskatchewan", "Saskatchewan", "SK", 52.1332, -106.6700, -6, "Downtown, Broadway, Nutana, Stonebridge, Lawson Heights, Sutherland, Riversdale, Evergreen"),
    _c("regina", "Regina", "saskatchewan", "Saskatchewan", "SK", 50.4452, -104.6189, -6, "Downtown, Cathedral, Harbour Landing, Warehouse District, Lakeview, Normanview, Albert Park, Glencairn"),
    _c("mississauga", "Mississauga", "ontario", "Ontario", "ON", 43.5890, -79.6441, -4, "Square One, Port Credit, Streetsville, Erin Mills, Meadowvale, Cooksville, Clarkson, Malton"),
    _c("brampton", "Brampton", "ontario", "Ontario", "ON", 43.7315, -79.7624, -4, "Downtown, Bramalea, Mount Pleasant, Springdale, Heart Lake, Fletcher's Meadow, Castlemore, Sandalwood"),
    _c("surrey", "Surrey", "british-columbia", "British Columbia", "BC", 49.1913, -122.8490, -7, "Guildford, Newton, Fleetwood, Cloverdale, South Surrey, Whalley, Surrey Central, White Rock"),
    _c("windsor", "Windsor", "ontario", "Ontario", "ON", 42.3149, -83.0364, -4, "Downtown, Walkerville, South Windsor, Riverside, Tecumseh, LaSalle, Forest Glade, Sandwich Town"),
    _c("oshawa", "Oshawa", "ontario", "Ontario", "ON", 43.8971, -78.8658, -4, "Downtown, North Oshawa, Whitby, Courtice, Lakeview, Taunton, Windfields, Ajax"),
]

UK_CITIES = [
    _c("london", "London", "england", "England", "UK", 51.5074, -0.1278, 1, "Westminster, Camden, Shoreditch, Kensington, Islington, Croydon, Stratford, Wimbledon"),
    _c("manchester", "Manchester", "england", "England", "UK", 53.4808, -2.2426, 1, "City Centre, Salford, Didsbury, Chorlton, Ancoats, Northern Quarter, Stockport, Trafford"),
    _c("birmingham", "Birmingham", "england", "England", "UK", 52.4862, -1.8904, 1, "City Centre, Edgbaston, Solihull, Digbeth, Moseley, Harborne, Sutton Coldfield, Jewellery Quarter"),
    _c("leeds", "Leeds", "england", "England", "UK", 53.8008, -1.5491, 1, "City Centre, Headingley, Chapel Allerton, Roundhay, Horsforth, Morley, Armley, Hyde Park"),
    _c("glasgow", "Glasgow", "scotland", "Scotland", "UK", 55.8642, -4.2518, 1, "City Centre, West End, Finnieston, Merchant City, Southside, Partick, Shawlands, Dennistoun"),
    _c("edinburgh", "Edinburgh", "scotland", "Scotland", "UK", 55.9533, -3.1883, 1, "Old Town, New Town, Leith, Stockbridge, Morningside, Bruntsfield, Portobello, Haymarket"),
    _c("liverpool", "Liverpool", "england", "England", "UK", 53.4084, -2.9916, 1, "City Centre, Baltic Triangle, Allerton, Wavertree, Anfield, Aigburth, Bootle, Woolton"),
    _c("bristol", "Bristol", "england", "England", "UK", 51.4545, -2.5879, 1, "City Centre, Clifton, Bedminster, Stokes Croft, Redland, Southville, Bishopston, Fishponds"),
    _c("sheffield", "Sheffield", "england", "England", "UK", 53.3811, -1.4701, 1, "City Centre, Ecclesall Road, Kelham Island, Hillsborough, Crookes, Nether Edge, Meadowhall, Broomhill"),
    _c("newcastle", "Newcastle", "england", "England", "UK", 54.9783, -1.6178, 1, "City Centre, Jesmond, Quayside, Gosforth, Heaton, Ouseburn, Byker, Gateshead"),
    _c("nottingham", "Nottingham", "england", "England", "UK", 52.9548, -1.1581, 1, "City Centre, West Bridgford, Beeston, Hockley, Lace Market, Sherwood, Mapperley, Arnold"),
    _c("leicester", "Leicester", "england", "England", "UK", 52.6369, -1.1398, 1, "City Centre, Belgrave, Oadby, Clarendon Park, Stoneygate, Evington, Braunstone, Wigston"),
    _c("cardiff", "Cardiff", "wales", "Wales", "UK", 51.4816, -3.1791, 1, "City Centre, Cardiff Bay, Canton, Roath, Pontcanna, Llandaff, Whitchurch, Cathays"),
    _c("belfast", "Belfast", "northern-ireland", "Northern Ireland", "UK", 54.5973, -5.9301, 1, "City Centre, Cathedral Quarter, Titanic Quarter, Lisburn Road, Ormeau, Stranmillis, Ballyhackamore, Andersonstown"),
    _c("southampton", "Southampton", "england", "England", "UK", 50.9097, -1.4044, 1, "City Centre, Ocean Village, Portswood, Shirley, Bitterne, Bedford Place, Woolston, Bassett"),
    _c("brighton", "Brighton", "england", "England", "UK", 50.8225, -0.1372, 1, "The Lanes, North Laine, Kemptown, Hove, Seven Dials, Hanover, Preston Park, Brighton Marina"),
    _c("oxford", "Oxford", "england", "England", "UK", 51.7520, -1.2577, 1, "City Centre, Jericho, Cowley, Headington, Summertown, Botley, East Oxford, Iffley"),
    _c("cambridge", "Cambridge", "england", "England", "UK", 52.2053, 0.1218, 1, "City Centre, Mill Road, Chesterton, Cherry Hinton, Newnham, Trumpington, Arbury, Romsey"),
    _c("coventry", "Coventry", "england", "England", "UK", 52.4068, -1.5197, 1, "City Centre, Earlsdon, Canley, Tile Hill, Foleshill, Stoke, Binley, Coundon"),
    _c("aberdeen", "Aberdeen", "scotland", "Scotland", "UK", 57.1497, -2.0943, 1, "City Centre, Old Aberdeen, Rosemount, Ferryhill, Bridge of Don, Dyce, Torry, Cults"),
]

AU_CITIES = [
    _c("sydney", "Sydney", "new-south-wales", "New South Wales", "NSW", -33.8688, 151.2093, 10, "CBD, Surry Hills, Bondi, Parramatta, Newtown, Manly, Chatswood, Penrith"),
    _c("melbourne", "Melbourne", "victoria", "Victoria", "VIC", -37.8136, 144.9631, 10, "CBD, Fitzroy, St Kilda, Richmond, South Yarra, Footscray, Brunswick, Dandenong"),
    _c("brisbane", "Brisbane", "queensland", "Queensland", "QLD", -27.4698, 153.0251, 10, "CBD, South Bank, Fortitude Valley, West End, Chermside, Indooroopilly, Carindale, Mount Gravatt"),
    _c("perth", "Perth", "western-australia", "Western Australia", "WA", -31.9505, 115.8605, 8, "CBD, Fremantle, Subiaco, Northbridge, Joondalup, Cannington, Scarborough, Midland"),
    _c("adelaide", "Adelaide", "south-australia", "South Australia", "SA", -34.9285, 138.6007, 9.5, "CBD, North Adelaide, Glenelg, Norwood, Unley, Prospect, Marion, Modbury"),
    _c("gold-coast", "Gold Coast", "queensland", "Queensland", "QLD", -28.0167, 153.4000, 10, "Surfers Paradise, Broadbeach, Southport, Burleigh Heads, Robina, Coolangatta, Nerang, Helensvale"),
    _c("canberra", "Canberra", "australian-capital-territory", "Australian Capital Territory", "ACT", -35.2809, 149.1300, 10, "Civic, Braddon, Belconnen, Woden, Gungahlin, Kingston, Manuka, Tuggeranong"),
    _c("newcastle", "Newcastle", "new-south-wales", "New South Wales", "NSW", -32.9283, 151.7817, 10, "CBD, Hamilton, Merewether, Charlestown, Kotara, Mayfield, The Junction, Wallsend"),
    _c("wollongong", "Wollongong", "new-south-wales", "New South Wales", "NSW", -34.4278, 150.8931, 10, "CBD, North Wollongong, Fairy Meadow, Shellharbour, Figtree, Corrimal, Dapto, Thirroul"),
    _c("hobart", "Hobart", "tasmania", "Tasmania", "TAS", -42.8821, 147.3272, 10, "CBD, Salamanca, Battery Point, Sandy Bay, North Hobart, Glenorchy, Kingston, Moonah"),
    _c("geelong", "Geelong", "victoria", "Victoria", "VIC", -38.1499, 144.3617, 10, "CBD, Waterfront, Newtown, Belmont, Corio, Lara, Highton, Torquay"),
    _c("townsville", "Townsville", "queensland", "Queensland", "QLD", -19.2590, 146.8169, 10, "CBD, The Strand, Aitkenvale, Kirwan, North Ward, Thuringowa, Douglas, Magnetic Island"),
    _c("cairns", "Cairns", "queensland", "Queensland", "QLD", -16.9186, 145.7781, 10, "CBD, Esplanade, Edge Hill, Smithfield, Earlville, Palm Cove, Trinity Beach, Manunda"),
    _c("darwin", "Darwin", "northern-territory", "Northern Territory", "NT", -12.4634, 130.8456, 9.5, "CBD, Waterfront, Casuarina, Palmerston, Nightcliff, Parap, Stuart Park, Fannie Bay"),
    _c("sunshine-coast", "Sunshine Coast", "queensland", "Queensland", "QLD", -26.6500, 153.0667, 10, "Maroochydore, Mooloolaba, Noosa, Caloundra, Buderim, Nambour, Kawana, Coolum"),
    _c("toowoomba", "Toowoomba", "queensland", "Queensland", "QLD", -27.5598, 151.9507, 10, "CBD, East Toowoomba, Rangeville, Kearneys Spring, Wilsonton, Highfields, Newtown, Drayton"),
    _c("ballarat", "Ballarat", "victoria", "Victoria", "VIC", -37.5622, 143.8503, 10, "CBD, Sturt Street, Wendouree, Sebastopol, Alfredton, Delacombe, Bakery Hill, Mount Clear"),
    _c("bendigo", "Bendigo", "victoria", "Victoria", "VIC", -36.7570, 144.2794, 10, "CBD, Strathdale, Kangaroo Flat, Eaglehawk, Golden Square, Epsom, Flora Hill, Kennington"),
    _c("launceston", "Launceston", "tasmania", "Tasmania", "TAS", -41.4332, 147.1441, 10, "CBD, Kings Meadows, Mowbray, Newstead, Riverside, Invermay, Prospect, Trevallyn"),
    _c("mackay", "Mackay", "queensland", "Queensland", "QLD", -21.1411, 149.1860, 10, "CBD, Mount Pleasant, North Mackay, Andergrove, Ooralea, Rural View, Glenella, Sarina"),
]

COUNTRY_CITIES = {"in": IN_CITIES, "ae": AE_CITIES, "ca": CA_CITIES, "uk": UK_CITIES, "au": AU_CITIES}
for _cc, _lst in COUNTRY_CITIES.items():
    for _city in _lst:
        _city["country"] = _cc

# Browser timezone -> country (client-side detection, no paid geo-IP).
TZ_MAP = {"in": ["Asia/Kolkata", "Asia/Calcutta"], "ae": ["Asia/Dubai"], "uk": ["Europe/London", "Europe/Belfast"],
          "au": ["Australia/"], "ca": ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax",
                                        "America/Regina", "America/St_Johns", "America/Montreal", "Canada/"]}


def public_country(c):
    return {k: c[k] for k in ("code", "name", "short", "flag", "prefix", "currency", "symbol", "unit", "region_label", "hreflang", "iso")}
