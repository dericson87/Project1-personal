var handler = function(event) {

  zipCode = $("#user-input").val();

  $(".error").remove(); 
  if (zipCode.length < 1) {
    $('form').append('<p class="error">This field is required.</p>');
  } else {
    $('#user-input').val('');
  }

  isValidZipCode(zipCode);

  zipCodeItem = getZipcodeItem();
  swappedArray = getCoordinates(zipCodeItem.geometry);

  app.updateMap();
  app.layers.forEach(layer => {
    if (layer.active === true) {
      layer.active = false;
      app.layerChanged(layer.id, layer.active);
    }
  });
  }

// Prevents user from clicking enter and reloading the map
$(document).ready(function() {
  $(window).keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      handler();
      return false;
    }
  });
});
//Get's a zip code from the user
$(document).on("click", "#add-input", handler);
function getZipcodeItem() {
  var out;
  geoJson.features.forEach(function(zipCodeItem) {
    if (zipCodeItem.properties.GEOID10 === zipCode) {
      out = zipCodeItem;
    }
  });
  return out;
}

function isValidZipCode(zip) {
  var isValid = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zip);
            if (isValid) {
        } else {
          $('form').append('<p class="error">Please enter a valid zip code.</p>');
      }
    }

function getCoordinates(geometry) {
  var swappedArray = [];

  for (var i = 0; i < geometry.coordinates[0].length; i++) { //grabbing polygon coordinates from the geoJson files for Seattle neighborhoods
    //Swapping the lat/long coordinates so they populate the map correctly
    swappedArray.push([
      geometry.coordinates[0][i][1],
      geometry.coordinates[0][i][0]
    ]);
  }
  return swappedArray;
}

var zipCode = "98101";
var zipCodeItem = getZipcodeItem();
var swappedArray = getCoordinates(zipCodeItem.geometry);

const app = new Vue({
  el: '#app',
  data: { /* Data properties will go here */
    map: null,
    tileLayer: null,
    layers: [{
        id: 0,
        name: 'Elementary',
        active: false,
        features: [],
      },
      {
        id: 1,
        name: 'Middle School',
        active: false,
        features: [],
      },
      {
        id: 2,
        name: 'High School',
        active: false,
        features: [],
      }, {
        id: 3,
        name: 'Option Elementary',
        active: false,
        features: [],
      }, {
        id: 4,
        name: 'Option High School',
        active: false,
        features: [],
      },
      {
        id: 5,
        name: 'Non Standard',
        active: false,
        features: [],
      },
    ],
  },
  mounted() { /* Code to run when app is mounted */
    this.callSchoolData();
    this.initMap();
  },

  methods: { /* Functions for the map object */

    initMap() { //sets the lat/long and zoom level at document load
      this.map = L.map('map').setView([47.6097, -122.3331], 12);
      this.tileLayer = L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>',
        }
      );
      this.tileLayer.addTo(this.map);
      var polygon = L.polygon(swappedArray, {
        color: '#f2a033'
      });
      this.map.fitBounds(polygon.getBounds());
    },
    currentPolygon: null,
    updateMap() {
      if (this.currentPolygon !== null) {
        this.map.removeLayer(this.currentPolygon);
      }
     
      var polygon = L.polygon(swappedArray, {
        color: '#f2a033'
      }).addTo(this.map);
      this.map.fitBounds(polygon.getBounds());
      this.currentPolygon = polygon;
    },

    layerChanged(layerId, active) {
      /* Show or hide the features in the layer */
      const layer = this.layers.find(layer => layer.id === layerId);
      layer.features.forEach((feature) => {
        /* Show or hide the feature depending on the active argument */
        if (active) {
          if (this.currentPolygon === null || feature.type !== 'marker') return;
          if(!this.currentPolygon.getBounds().contains(feature.coords)) return;
          feature.leafletObject = L.marker(feature.coords)
            .bindPopup("<div>" + feature.name + " " + feature.Type + "</div>" + "<div>Grades: " + feature.grade + "</div>" + feature.street + "<br>" + feature.phone + "<br>" + "<a href='" + feature.site + "' target='_blank'>" + feature.site + "</a>")
            feature.leafletObject.addTo(this.map);
        } else {
          if(!feature.leafletObject) return;
          feature.leafletObject.removeFrom(this.map);
          feature.leafletObject = null;
        }
      });
    },

    callSchoolData() { //Performing an AJAX request with the queryURL
      $.ajax({
        url: "https://gisdata.seattle.gov/server/rest/services/COS/COS_Public_Facilities_and_Safety/MapServer/8/query?where=1%3D1&outFields=*&outSR=4326&f=json",
        type: "GET",

      }).done(function(data) { 
        for (var i = 0; i < app._data.layers.length; i++) {
          if (app.layers[i].name === "Elementary") {
            for (var j = 0; j < data.features.length; j++) {
              if (data.features[j].attributes.TYPE === "Elementary") {
                app._data.layers[i].features.push({
                  id: data.features[j].attributes.OBJECTID,
                  name: data.features[j].attributes.NAME,
                  Type: data.features[j].attributes.TYPE,
                  grade: data.features[j].attributes.GRADE,
                  site: data.features[j].attributes.WEBSITE,
                  street: data.features[j].attributes.ADDRESS,
                  phone: data.features[j].attributes.PHONE,
                  type: 'marker',
                  coords: [data.features[j].geometry.y, data.features[j].geometry.x],
                })
              }
            }
          } else if (app.layers[i].name === "Middle School") {

            for (var j = 0; j < data.features.length; j++) {
              if (data.features[j].attributes.TYPE === "Middle School") {
                app._data.layers[i].features.push({
                  id: data.features[j].attributes.OBJECTID,
                  name: data.features[j].attributes.NAME,
                  Type: data.features[j].attributes.TYPE,
                  grade: data.features[j].attributes.GRADE,
                  site: data.features[j].attributes.WEBSITE,
                  street: data.features[j].attributes.ADDRESS,
                  phone: data.features[j].attributes.PHONE,
                  type: 'marker',
                  coords: [data.features[j].geometry.y, data.features[j].geometry.x],
                })
              }
            }
          } else if (app.layers[i].name === "High School") {

            for (var j = 0; j < data.features.length; j++) {
              if (data.features[j].attributes.TYPE === "High School") {
                app._data.layers[i].features.push({
                  id: data.features[j].attributes.OBJECTID,
                  name: data.features[j].attributes.NAME,
                  Type: data.features[j].attributes.TYPE,
                  grade: data.features[j].attributes.GRADE,
                  site: data.features[j].attributes.WEBSITE,
                  street: data.features[j].attributes.ADDRESS,
                  phone: data.features[j].attributes.PHONE,
                  type: 'marker',
                  coords: [data.features[j].geometry.y, data.features[j].geometry.x],
                })
              }
            }
          } else if (app.layers[i].name === "Option Elementary") {

            for (var j = 0; j < data.features.length; j++) {

              if (data.features[j].attributes.TYPE === "Option Elementary") {
                app._data.layers[i].features.push({
                  id: data.features[j].attributes.OBJECTID,
                  name: data.features[j].attributes.NAME,
                  Type: data.features[j].attributes.TYPE,
                  grade: data.features[j].attributes.GRADE,
                  site: data.features[j].attributes.WEBSITE,
                  street: data.features[j].attributes.ADDRESS,
                  phone: data.features[j].attributes.PHONE,
                  type: 'marker',
                  coords: [data.features[j].geometry.y, data.features[j].geometry.x],
                })
              }
            }
          } else if (app.layers[i].name === "Option High School") {

            for (var j = 0; j < data.features.length; j++) {

              if (data.features[j].attributes.TYPE === "Option High School") {
     
                app._data.layers[i].features.push({
                  id: data.features[j].attributes.OBJECTID,
                  name: data.features[j].attributes.NAME,
                  Type: data.features[j].attributes.TYPE,
                  grade: data.features[j].attributes.GRADE,
                  site: data.features[j].attributes.WEBSITE,
                  street: data.features[j].attributes.ADDRESS,
                  phone: data.features[j].attributes.PHONE,
                  type: 'marker',
                  coords: [data.features[j].geometry.y, data.features[j].geometry.x],
                })
              }
            }
          } else if (app.layers[i].name === "Non Standard") {

            for (var j = 0; j < data.features.length; j++) {
              if (data.features[j].attributes.TYPE === "NonStandard") {             
                app._data.layers[i].features.push({
                  id: data.features[j].attributes.OBJECTID,
                  name: data.features[j].attributes.NAME,
                  Type: data.features[j].attributes.TYPE,
                  grade: data.features[j].attributes.GRADE,
                  site: data.features[j].attributes.WEBSITE,
                  street: data.features[j].attributes.ADDRESS,
                  phone: data.features[j].attributes.PHONE,
                  type: 'marker',
                  coords: [data.features[j].geometry.y, data.features[j].geometry.x],
                })
              }
            }
          }
        }
      })
    },
  }
});

