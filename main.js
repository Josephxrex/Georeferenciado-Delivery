import "ol/ol.css";
import { Map, View } from "ol";
import Geolocation from "ol/Geolocation.js";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

// Obtener elementos HTML
var latitudeInput = document.getElementById("latitude");
var longitudeInput = document.getElementById("longitude");
var addPointsButton = document.getElementById("addPointsButton");
var currentLocationButton = document.getElementById("currentLocation");
var mapElement = document.getElementById("map");
var alerMS = document.getElementById("alert");
var infoMS = document.getElementById("info_alert");
var form = document.getElementById("container-form");

// Definir capa base
const osmLayer = new TileLayer({
  source: new OSM(),
});

// Definir capa de puntos
const pointLayer = new VectorLayer({
  source: new VectorSource(),
  style: new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: "red" }),
      stroke: new Stroke({
        color: "white",
        width: 2,
      }),
    }),
  }),
});

// Definir mapa
const map = new Map({
  layers: [osmLayer, pointLayer],
  target: mapElement,
  view: new View({
    center: fromLonLat([-103, 23]),
    zoom: 6,
  }),
});

// Definir estilo personalizado para el punto intermitente
const pulsingStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: "green",
    }),
    stroke: new Stroke({
      color: "white",
      width: 2,
    }),
  }),
});

// Función que cambia el estilo del punto en intervalos de tiempo regulares
function startPulsing(feature) {
  let count = 0;
  let duration = 3000;
  let interval = setInterval(() => {
    if (count > 10) {
      clearInterval(interval);
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: "green",
            }),
            stroke: new Stroke({
              color: "white",
              width: 2,
            }),
          }),
        })
      );
      return;
    }
    count++;
    let radius = (count / 10) * 20;
    let opacity = 1 - count / 10;
    pulsingStyle.getImage().setRadius(radius);
    pulsingStyle.getImage().setOpacity(opacity);
    feature.setStyle(pulsingStyle);
  }, duration);
}

addPointsButton.addEventListener("click", () => {
  const latitude = Number(latitudeInput.value);
  const longitude = Number(longitudeInput.value);

  // Validar si las coordenadas están dentro del rango de México
  if (
    latitude < 14.55 ||
    latitude > 32.71 ||
    longitude < -118.45 ||
    longitude > -86.81
  ) {
    alert("Coordinates outside of Mexican territory");
    return;
  }

  // Validar si ya hay 2 puntos en el mapa
  const features = pointLayer.getSource().getFeatures();
  console.log(features.length);

  const point = new Point(fromLonLat([longitude, latitude]));
  const feature = new Feature(point);
  pointLayer.getSource().addFeature(feature);
  startPulsing(feature);
  map.getView().fit(pointLayer.getSource().getExtent(), {
    padding: [50, 50, 50, 50],
    maxZoom: 17,
  });
  if (features.length == 2) {
    alert("Only two points can be added to the map.");
    infoMS.textContent = "See you soon";
    infoMS.innerHTML = "See you soon!";
    alerMS.style.display = "block";
    return;
  }
  latitudeInput.value = "";
  longitudeInput.value = "";
});


function addCurrentLocationToMap() {
  const features = pointLayer.getSource().getFeatures();

  const geolocation = new Geolocation({
    trackingOptions: {
      enableHighAccuracy: true,
    },
    projection: map.getView().getProjection(),
  });

  geolocation.on("change", () => {
    const position = geolocation.getPosition();

    if (position) {
      map.getView().setCenter(position);
      const point = new Point(position);
      const feature = new Feature(point);

      // Validar que solo hay un punto antes de agregar otro
      if (features.length < 1) {
        pointLayer.getSource().addFeature(feature);
        currentLocationButton.style.display = "none"; // Desactivar el botón
      } else {
        alert("Solo se permite agregar un punto de ubicación actual.");
        currentLocationButton.style.display = "none";
      }
    }
  });

  geolocation.on("error", () => {
    alert("Could not get current location");
  });

  geolocation.setTracking(true);
}


currentLocationButton.addEventListener("click", () => {
  addCurrentLocationToMap();
  infoMS.textContent = "See you soon";
  infoMS.innerHTML = "See you soon!";
  currentLocationButton.style.display = "none";
});
