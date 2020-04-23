import React, {useState} from "react";
import CovidData from "./Data/CovidData";
import MapboxGLMap from "./Components/Map";
import ServiceWorkerWrapper from "./Components/ServiceWorkerWrapper";
import LayerUnClustered from "./Components/LayerUnClustered";
import LayerCluster from "./Components/LayerCluster";

import "./App.scss";

const accessToken =
  process.env.NETLIFY === true
    ? "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHVrcHowZTBjMGMzdWpzaWg2cm9rZWsifQ.7C3RW3qcrh5JvaoIMOs2lg"
    : "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHJucWRucjBnaTYzaW4wMWJkYWtna3IifQ.UpQnfoFjE3JFKhQjcIZqFQ";

export default function App() {
  const { data, isLoading, reLoad } = CovidData();
  const [map, setMap] = useState(null);

  const mapControls = {
    geolocate: true,
    navigation: true,
    reload: {
      status: true,
      eventHandler: () => reLoad,
    },
  };

  return (
    <div className="App">
      {data && !isLoading ? (
        <MapboxGLMap controls={mapControls} accessToken={accessToken} setMap={setMap}>
          {map && <LayerUnClustered data={data} map={map} />}
          {map && <LayerCluster data={data} map={map} />}
        </MapboxGLMap>
      ) : (
        <h1>Loading...</h1>
      )}
      <ServiceWorkerWrapper />
    </div>
  );
}
