/*
 * Locations – Expressive Identification: fixed location bank and photo metadata.
 *
 * Do NOT add, remove or rename locations (clinical requirement).
 *
 * Each location has exactly three photos, in unlock order (Photo 1, 2, 3).
 * Drop the image files next to index.html using the exact file names below.
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
      { file: "bedroom-1.jpg", people: "none" },
      { file: "bedroom-2.jpg", people: "none" },
      { file: "bedroom-3.jpg", people: "none" },
    ],
    "bathroom": [
      { file: "bathroom-1.jpg", people: "none" },
      { file: "bathroom-2.jpg", people: "none" },
      { file: "bathroom-3.jpg", people: "none" },
    ],
    "kitchen": [
      { file: "kitchen-1.jpg", people: "group" },
      { file: "kitchen-2.jpg", people: "female" },
      { file: "kitchen-3.jpg", people: "none" },
    ],
    "living-room": [
      { file: "living-room-1.jpg", people: "none" },
      { file: "living-room-2.jpg", people: "none" },
      { file: "living-room-3.jpg", people: "none" },
    ],
    "backyard": [
      { file: "backyard-1.jpg", people: "none" },
      { file: "backyard-2.jpg", people: "none" },
      { file: "backyard-3.jpg", people: "none" },
    ],
    "garage": [
      { file: "garage-1.jpg", people: "none" },
      { file: "garage-2.jpg", people: "none" },
      { file: "garage-3.jpg", people: "none" },
    ],
    "swimming-pool": [
      { file: "swimming-pool-1.jpg", people: "none" },
      { file: "swimming-pool-2.jpg", people: "group" },
      { file: "swimming-pool-3.jpg", people: "group" },
    ],
    "post-office": [
      { file: "post-office-1.jpg", people: "group" },
      { file: "post-office-2.jpg", people: "group" },
      { file: "post-office-3.jpg", people: "group" },
    ],
    "school": [
      { file: "school-1.jpg", people: "group" },
      { file: "school-2.jpg", people: "group" },
      { file: "school-3.jpg", people: "group" },
    ],
    "beach": [
      { file: "beach-1.jpg", people: "none" },
      { file: "beach-2.jpg", people: "group" },
      { file: "beach-3.jpg", people: "group" },
    ],
    "grocery-store": [
      { file: "grocery-store-1.jpg", people: "none" },
      { file: "grocery-store-2.jpg", people: "none" },
      { file: "grocery-store-3.jpg", people: "female" },
    ],
    "library": [
      { file: "library-1.jpg", people: "none" },
      { file: "library-2.jpg", people: "group" },
      { file: "library-3.jpg", people: "none" },
    ],
    "hospital": [
      { file: "hospital-1.jpg", people: "none" },
      { file: "hospital-2.jpg", people: "group" },
      { file: "hospital-3.jpg", people: "none" },
    ],
    "gas-station": [
      { file: "gas-station-1.jpg", people: "none" },
      { file: "gas-station-2.jpg", people: "male" },
      { file: "gas-station-3.jpg", people: "none" },
    ],
    "police-station": [
      { file: "police-station-1.jpg", people: "none" },
      { file: "police-station-2.jpg", people: "male" },
      { file: "police-station-3.jpg", people: "none" },
    ],
    "fire-station": [
      { file: "fire-station-1.jpg", people: "none" },
      { file: "fire-station-2.jpg", people: "none" },
      { file: "fire-station-3.jpg", people: "none" },
    ],
    "park": [
      { file: "park-1.jpg", people: "group" },
      { file: "park-2.jpg", people: "group" },
      { file: "park-3.jpg", people: "group" },
    ],
    "zoo": [
      { file: "zoo-1.jpg", people: "group" },
      { file: "zoo-2.jpg", people: "group" },
      { file: "zoo-3.jpg", people: "female" },
    ],
    "farm": [
      { file: "farm-1.jpg", people: "none" },
      { file: "farm-2.jpg", people: "none" },
      { file: "farm-3.jpg", people: "group" },
    ],
    "gym": [
      { file: "gym-1.jpg", people: "male" },
      { file: "gym-2.jpg", people: "group" },
      { file: "gym-3.jpg", people: "female" },
    ],
    "hair-salon": [
      { file: "hair-salon-1.jpg", people: "group" },
      { file: "hair-salon-2.jpg", people: "group" },
      { file: "hair-salon-3.jpg", people: "unclear" },
    ],
    "restaurant": [
      { file: "restaurant-1.jpg", people: "group" },
      { file: "restaurant-2.jpg", people: "group" },
      { file: "restaurant-3.jpg", people: "group" },
    ],
    "dentists-office": [
      { file: "dentists-office-1.jpg", people: "group" },
      { file: "dentists-office-2.jpg", people: "group" },
      { file: "dentists-office-3.jpg", people: "group" },
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
