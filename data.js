/*
 * Locations – Expressive Identification: fixed location bank and photo metadata.
 *
 * Do NOT add, remove or rename locations (clinical requirement).
 *
 * Each location has exactly three photos, in unlock order (Photo 1, 2, 3).
 * Drop the image files into /photos using the exact file names below.
 *
 * "people" controls which SDs may be shown for that photo:
 *   "none"   -> general SDs only ("Where is this?", "Where is it?", ...)
 *   "male"   -> general SDs + "Where is he?"   (ONE clearly identifiable male)
 *   "female" -> general SDs + "Where is she?"  (ONE clearly identifiable female)
 *   "group"  -> general SDs + "Where are they?" (multiple people)
 *   "unclear"-> general SDs only (person present but gender not clearly established)
 * When in doubt, leave "none" or use "unclear". Never guess gender.
 */
(function (root) {
  var LOCATIONS = [
    { id: "bedroom", name: "Bedroom" },
    { id: "bathroom", name: "Bathroom" },
    { id: "kitchen", name: "Kitchen" },
    { id: "living-room", name: "Living room" },
    { id: "backyard", name: "Backyard" },
    { id: "garage", name: "Garage" },
    { id: "swimming-pool", name: "Swimming pool" },
    { id: "post-office", name: "Post office" },
    { id: "school", name: "School" },
    { id: "beach", name: "Beach" },
    { id: "grocery-store", name: "Grocery store" },
    { id: "library", name: "Library" },
    { id: "hospital", name: "Hospital" },
    { id: "gas-station", name: "Gas station" },
    { id: "police-station", name: "Police station" },
    { id: "fire-station", name: "Fire station" },
    { id: "park", name: "Park" },
    { id: "zoo", name: "Zoo" },
    { id: "farm", name: "Farm" },
    { id: "gym", name: "Gym" },
    { id: "hair-salon", name: "Hair salon" },
    { id: "restaurant", name: "Restaurant" },
    { id: "dentists-office", name: "Dentist's office" },
  ];

  var PHOTOS = {
    "bedroom": [
      { file: "photos/bedroom-1.jpg", people: "none" },
      { file: "photos/bedroom-2.jpg", people: "none" },
      { file: "photos/bedroom-3.jpg", people: "none" },
    ],
    "bathroom": [
      { file: "photos/bathroom-1.jpg", people: "none" },
      { file: "photos/bathroom-2.jpg", people: "none" },
      { file: "photos/bathroom-3.jpg", people: "none" },
    ],
    "kitchen": [
      { file: "photos/kitchen-1.jpg", people: "group" },
      { file: "photos/kitchen-2.jpg", people: "female" },
      { file: "photos/kitchen-3.jpg", people: "none" },
    ],
    "living-room": [
      { file: "photos/living-room-1.jpg", people: "none" },
      { file: "photos/living-room-2.jpg", people: "none" },
      { file: "photos/living-room-3.jpg", people: "none" },
    ],
    "backyard": [
      { file: "photos/backyard-1.jpg", people: "none" },
      { file: "photos/backyard-2.jpg", people: "none" },
      { file: "photos/backyard-3.jpg", people: "none" },
    ],
    "garage": [
      { file: "photos/garage-1.jpg", people: "none" },
      { file: "photos/garage-2.jpg", people: "none" },
      { file: "photos/garage-3.jpg", people: "none" },
    ],
    "swimming-pool": [
      { file: "photos/swimming-pool-1.jpg", people: "none" },
      { file: "photos/swimming-pool-2.jpg", people: "group" },
      { file: "photos/swimming-pool-3.jpg", people: "group" },
    ],
    "post-office": [
      { file: "photos/post-office-1.jpg", people: "group" },
      { file: "photos/post-office-2.jpg", people: "group" },
      { file: "photos/post-office-3.jpg", people: "group" },
    ],
    "school": [
      { file: "photos/school-1.jpg", people: "group" },
      { file: "photos/school-2.jpg", people: "group" },
      { file: "photos/school-3.jpg", people: "group" },
    ],
    "beach": [
      { file: "photos/beach-1.jpg", people: "none" },
      { file: "photos/beach-2.jpg", people: "group" },
      { file: "photos/beach-3.jpg", people: "group" },
    ],
    "grocery-store": [
      { file: "photos/grocery-store-1.jpg", people: "none" },
      { file: "photos/grocery-store-2.jpg", people: "none" },
      { file: "photos/grocery-store-3.jpg", people: "female" },
    ],
    "library": [
      { file: "photos/library-1.jpg", people: "none" },
      { file: "photos/library-2.jpg", people: "group" },
      { file: "photos/library-3.jpg", people: "none" },
    ],
    "hospital": [
      { file: "photos/hospital-1.jpg", people: "none" },
      { file: "photos/hospital-2.jpg", people: "group" },
      { file: "photos/hospital-3.jpg", people: "none" },
    ],
    "gas-station": [
      { file: "photos/gas-station-1.jpg", people: "none" },
      { file: "photos/gas-station-2.jpg", people: "male" },
      { file: "photos/gas-station-3.jpg", people: "none" },
    ],
    "police-station": [
      { file: "photos/police-station-1.jpg", people: "none" },
      { file: "photos/police-station-2.jpg", people: "male" },
      { file: "photos/police-station-3.jpg", people: "none" },
    ],
    "fire-station": [
      { file: "photos/fire-station-1.jpg", people: "none" },
      { file: "photos/fire-station-2.jpg", people: "none" },
      { file: "photos/fire-station-3.jpg", people: "none" },
    ],
    "park": [
      { file: "photos/park-1.jpg", people: "group" },
      { file: "photos/park-2.jpg", people: "group" },
      { file: "photos/park-3.jpg", people: "group" },
    ],
    "zoo": [
      { file: "photos/zoo-1.jpg", people: "group" },
      { file: "photos/zoo-2.jpg", people: "group" },
      { file: "photos/zoo-3.jpg", people: "female" },
    ],
    "farm": [
      { file: "photos/farm-1.jpg", people: "none" },
      { file: "photos/farm-2.jpg", people: "none" },
      { file: "photos/farm-3.jpg", people: "group" },
    ],
    "gym": [
      { file: "photos/gym-1.jpg", people: "male" },
      { file: "photos/gym-2.jpg", people: "group" },
      { file: "photos/gym-3.jpg", people: "female" },
    ],
    "hair-salon": [
      { file: "photos/hair-salon-1.jpg", people: "group" },
      { file: "photos/hair-salon-2.jpg", people: "group" },
      { file: "photos/hair-salon-3.jpg", people: "unclear" },
    ],
    "restaurant": [
      { file: "photos/restaurant-1.jpg", people: "group" },
      { file: "photos/restaurant-2.jpg", people: "group" },
      { file: "photos/restaurant-3.jpg", people: "group" },
    ],
    "dentists-office": [
      { file: "photos/dentists-office-1.jpg", people: "group" },
      { file: "photos/dentists-office-2.jpg", people: "group" },
      { file: "photos/dentists-office-3.jpg", people: "group" },
    ],
  };

  /*
   * Extra responses the team has agreed to score as correct, shown to the BT
   * by the "Show Answer" button. Natural phrasing that names the location
   * ("the kitchen", "we're at the park") always counts and need not be listed.
   */
  var ACCEPTED = {
    "bedroom": ["room"],
    "bathroom": ["restroom", "potty"],
    "swimming-pool": ["pool"],
    "school": ["classroom", "class"],
    "grocery-store": ["store"],
    "park": ["playground"],
    "restaurant": ["McDonald's", "any restaurant name"],
    "dentists-office": ["doctor's office"],
    "hair-salon": ["salon", "barbershop"]
  };

  /* Optional BT guidance shown on the "Show Answer" card. */
  var NOTES = {
    "dentists-office": "If the learner says \u201Cdoctor\u2019s office,\u201D score it correct, then model \u201Cdentist\u2019s office\u201D to shape the response."
  };

  var data = { LOCATIONS: LOCATIONS, PHOTOS: PHOTOS, ACCEPTED: ACCEPTED, NOTES: NOTES };
  root.LOC_DATA = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof self !== "undefined" ? self : this);
