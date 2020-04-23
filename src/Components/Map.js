import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";
import MapboxGLButtonControl from "./MapboxGLButtonControl";
import Log from "../Debug";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.scss";

export default function MapboxGLMap(props) {
  mapboxgl.accessToken = props.accessToken;
  const [map, setMap] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [controlsMap, setControlsMap] = useState({
    GeoControl: null,
    Navigation: null,
    Reload: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const mapContainer = useRef(null);

  const addGeoControl = useCallback(
    (map, setControlsMap) => {
      if (!map || !props.controls.geolocate) {
        return;
      }
      const geoControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: false,
          timeout: 6000,
        },
        fitBoundsOptions: {
          maxZoom: 4,
        },
        trackUserLocation: true,
      });
      map.addControl(geoControl);
      setControlsMap((prevControlsMap) => ({
        ...prevControlsMap,
        GeoControl: geoControl,
      }));
      map.on("load", () => {
        geoControl.trigger();
      });
      Log.info("The control GeoControl has been added", "Map");
    },
    [props.controls.geolocate]
  );

  const addNavigationControl = useCallback(
    (map, setControlsMap) => {
      if (!map || !props.controls.navigation) {
        return;
      }
      const navigationControl = new mapboxgl.NavigationControl();
      map.addControl(navigationControl);
      setControlsMap((prevControlsMap) => ({
        ...prevControlsMap,
        Navigation: navigationControl,
      }));
      Log.info("The control Navigation has been added", "Map");
    },
    [props.controls.navigation]
  );

  const addReloadControl = useCallback(
    (map, setControlsMap) => {
      if (!map || !props.controls.reload || !props.controls.reload.status) {
        return;
      }
      const reloadControl = new MapboxGLButtonControl({
        className: "mapbox-gl-draw_reload",
        title: "Reload",
        eventHandler: props.controls.reload.eventHandler(),
      });

      map.addControl(reloadControl);
      setControlsMap((prevControlsMap) => ({
        ...prevControlsMap,
        Reload: reloadControl,
      }));
      Log.info("The control Reload has been added", "Map");
    },
    [props.controls.reload]
  );

  useEffect(() => {
    const initializeMap = ({ setMap, mapContainer }) => {
      if (!isLoading) {
        setIsLoading(true);
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
          center: [props.longitude, props.latitude],
          zoom: props.zoom,
        });

        addNavigationControl(map, setControlsMap);
        addGeoControl(map, setControlsMap);
        addReloadControl(map, setControlsMap);

        map.on("load", () => {
          Log.trace("The map has been initialized", "Map");
          setMap(map);
          if (props.setMap) {
            props.setMap(map);
          }
          setIsLoading(false);
          map.resize();
        });
      }
    };

    if (!map) {
      initializeMap({ setMap, mapContainer });
    }
    // return () => {
    //   if (map) {
    //     map.remove();
    //   }
    // };
  }, [
    map,
    props,
    addGeoControl,
    addNavigationControl,
    addReloadControl,
    isLoading,
  ]);

  return (
    <div className="mapContainer">
      <div className="mapBox" ref={(el) => (mapContainer.current = el)}>
        {props.children}
      </div>
    </div>
  );
}

MapboxGLMap.defaultProps = {
  longitude: 16,
  latitude: 27,
  zoom: 2,
  controls: {
    geolocate: false,
    navigation: false,
    reload: {
      status: false,
      eventHandler: null,
    },
  },
};

MapboxGLMap.propTypes = {
  longitude: PropTypes.number,
  latitude: PropTypes.number,
  zoom: PropTypes.number,
  accessToken: PropTypes.string.isRequired,
  controls: PropTypes.shape({
    geolocate: PropTypes.bool,
    navigation: PropTypes.bool,
    reload: PropTypes.shape({
      status: PropTypes.bool,
      eventHandler: PropTypes.func,
    }),
  }),
};
