import { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGLButtonControl from "./MapboxGLButtonControl";
import { mutate } from "swr";

import "./Map.scss";

mapboxgl.accessToken =
  process.env.NETLIFY === true
    ? "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHVrcHowZTBjMGMzdWpzaWg2cm9rZWsifQ.7C3RW3qcrh5JvaoIMOs2lg"
    : "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHJucWRucjBnaTYzaW4wMWJkYWtna3IifQ.UpQnfoFjE3JFKhQjcIZqFQ";

function Map() {
  const mapboxElRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [longitude, setLongitude] = useState(16);
  const [latitude, setLatitude] = useState(27);
  const [zoom, setZoom] = useState(2);
  const [map, setMap] = useState(null);
  const [geoControl, setGeoControl] = useState(null);
  const [reloadControl, setReloadControl] = useState(null);

  useEffect(() => {
    if (!isLoaded && map === null) {
      const mapTemp = new mapboxgl.Map({
        container: mapboxElRef.current,
        style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
        center: [longitude, latitude],
        zoom: zoom,
      });

      const geoControlTemp = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: false,
          timeout: 6000,
        },
        fitBoundsOptions: {
          maxZoom: 4,
        },
        trackUserLocation: true,
      });

      const reloadControlTemp = new MapboxGLButtonControl({
        className: "mapbox-gl-draw_reload",
        title: "Reload",
        eventHandler: () => {
          mutate("https://corona.lmao.ninja/v2/jhucsse");
        },
      });

      mapTemp.addControl(new mapboxgl.NavigationControl());
      mapTemp.addControl(geoControlTemp);
      mapTemp.addControl(reloadControlTemp);
      setGeoControl(geoControl);
      setReloadControl(reloadControlTemp);
      setMap(mapTemp);
      mapTemp.once("load", () => {
        setIsLoaded(true);
        geoControlTemp.trigger();
      });
      
      console.info("Map - The map has been initialized");
    }
  }, [mapboxElRef, latitude, longitude, zoom, map, geoControl, isLoaded, reloadControl]);

  return {
    map,
    longitude,
    latitude,
    zoom,
    geoControl,
    setLongitude,
    setLatitude,
    setZoom,
    isLoaded,
    mapboxElRef,
  };
}

export default Map;
