import { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";
import MapboxGLButtonControl from "./MapboxGLButtonControl";
import { mutate } from "swr";

import "./Map.scss";

mapboxgl.accessToken =
  process.env.NETLIFY === true
    ? "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHVrcHowZTBjMGMzdWpzaWg2cm9rZWsifQ.7C3RW3qcrh5JvaoIMOs2lg"
    : "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHJucWRucjBnaTYzaW4wMWJkYWtna3IifQ.UpQnfoFjE3JFKhQjcIZqFQ";

function Map({mapboxElRef}) {
  const [isMounted, setIsMounted] = useState(false);
  const [longitude, setLongitude] = useState(16);
  const [latitude, setLatitude] = useState(27);
  const [zoom, setZoom] = useState(2);
  const [map, setMap] = useState(null);
  const [geoControl, setGeoControl] = useState(null);
  const [reloadControl, setReloadControl] = useState(null);

  useEffect(() => {
    if (!isMounted && map === null) {
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
      mapTemp.once("load", () => {
        setIsMounted(true);
        geoControlTemp.trigger();
      });
      setGeoControl(geoControl);
      setReloadControl(reloadControlTemp);
      setMap(mapTemp);
      
      console.info("Map - The map has been initialized");
    }
  }, [mapboxElRef, latitude, longitude, zoom, map, geoControl, isMounted, reloadControl]);

  return {
    map,
    longitude,
    latitude,
    zoom,
    geoControl,
    setLongitude,
    setLatitude,
    setZoom,
    isMounted
  };
}

Map.propTypes = {
  mapboxElRef: PropTypes.shape({
    current: PropTypes.object.isRequired,
  }).isRequired,
};

export default Map;
