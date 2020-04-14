import React from "react";
import FetchData from "./Components/Data";
import Map from "./Components/Map";
import LayerCluster from "./Components/LayerCluster";
import LayerUnClustered from "./Components/LayerUnClustered";

// CSS impots
import "./App.scss";
import "mapbox-gl/dist/mapbox-gl.css";

function App() {
  const circlesColor = [
    1,
    "#ffffb2",
    5000,
    "#fed976",
    10000,
    "#feb24c",
    25000,
    "#fd8d3c",
    50000,
    "#fc4e2a",
    75000,
    "#e31a1c",
    100000,
    "#b10026",
    200000,
    "#80001c",
    300000,
    "#e60000",
    500000,
    "#ba0a0f",
  ];
  const circlesRadius = [
    1,
    6,
    1000,
    10,
    5000,
    12,
    10000,
    16,
    20000,
    20,
    100000,
    25,
    200000,
    29,
    300000,
    34,
    500000,
    40,
  ];
  const { map, isLoaded: isMapLoaded, mapboxElRef } = Map();
  const { data, dataExploded, dataCountries } = FetchData();
  LayerCluster({map, dataExploded, circlesColor, circlesRadius, isMapLoaded});
  LayerUnClustered({map, data, dataCountries, circlesColor, circlesRadius, isMapLoaded});

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assigned Mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
