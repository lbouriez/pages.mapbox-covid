import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import lookup from "country-code-lookup";
import mapboxgl from "mapbox-gl";
import { circlesColor, circlesRadius } from "./LayersConst";
import Log from "../Debug";

export default function LayerUnClustered(props) {
  const sourceId = "LayerUnClustered";
  const [isLayerMounted, setIsLayerMounted] = useState(false);
  const [isSourceAdded, setIsSourceAdded] = useState(false);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  const addSource = useCallback(() => {
    if (!isSourceAdded && props.data) {
      props.map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: props.data,
        },
      });

      Log.info("The source has been added", "LayerUnClustered");
      setIsSourceAdded(true);
    }
  }, [isSourceAdded, props]);

  const addLayer = useCallback(() => {
    if (isSourceAdded && !isLayerAdded && props.map) {
      props.map.addLayer({
        id: "LayerUnClustered_circle-layer",
        type: "circle",
        source: sourceId,
        minzoom: 4,
        maxzoom: 22,
        filter: ["all", ["has", "cases"], ["!=", "country", "Holy See"]],
        paint: {
          "circle-opacity": 0.75,
          "circle-stroke-width": 1,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "cases"],
            ...circlesRadius,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "cases"],
            ...circlesColor,
          ],
        },
      });

      props.map.addLayer({
        id: "LayerUnClustered_count-layer",
        type: "symbol",
        source: sourceId,
        minzoom: 4,
        maxzoom: 22,
        filter: ["all", ["has", "cases"], ["!=", "country", "Holy See"]],
        layout: {
          "text-field": "{cases}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
      });

      const openPopup = (e) => {
        popup.remove();
        const { cases, deaths, country, province } = e.features[0].properties;
        const total = JSON.parse(e.features[0].properties.total);
        // Change the pointer type on mouseenter

        const coordinates = e.features[0].geometry.coordinates.slice();
        const countryISO =
          lookup.byCountry(country)?.iso2 || lookup.byInternet(country)?.iso2;
        const provinceHTML =
          province !== "null" ? `<p>Province: <b>${province}</b></p>` : "";
        const mortalityRate = ((deaths / cases) * 100).toFixed(2);
        const countryFlagHTML = Boolean(countryISO)
          ? `<img src="https://www.countryflags.io/${countryISO}/flat/64.png"></img>`
          : "";

        const HTML = `<p>Country: <b>${country}</b></p>
                  ${provinceHTML}
                  <p>Cases: <b>${cases}${
          total !== undefined ? ` <sup>(${total.cases})</sup>` : ""
        }</b></p>
                  <p>Deaths: <b>${deaths}${
          total !== undefined ? ` <sup>(${total.deaths})</sup>` : ""
        }</b></p>
                  <p>Mortality Rate: <b>${mortalityRate}%</b></p>
                  ${countryFlagHTML}`;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates).setHTML(HTML).addTo(props.map);
      };

      props.map.on("mouseenter", "LayerUnClustered_circle-layer", function () {
        props.map.getCanvas().style.cursor = "pointer";
      });
      props.map.on("mouseleave", "LayerUnClustered_circle-layer", function () {
        props.map.getCanvas().style.cursor = "";
      });

      props.map.on("click", "LayerUnClustered_circle-layer", (e) => {
        openPopup(e);
      });

      Log.trace("The layer has been added", "LayerUnClustered");
      setIsLayerAdded(true);
    }
  }, [
    // dataCountries,
    isLayerAdded,
    isSourceAdded,
    props,
  ]);

  /**
   * Add the source
   */
  useEffect(() => {
    if (!isSourceAdded) {
      addSource();
    }
  }, [addSource, isSourceAdded]);

  /**
   * Add the layer
   */
  useEffect(() => {
    if (isSourceAdded && !isLayerAdded) {
      addLayer();
    }
  }, [isLayerAdded, addLayer, isSourceAdded]);

  /**
   * Update the data source
   */
  useEffect(() => {
    if (isLayerMounted) {
      props.map.getSource(sourceId).setData({
        type: "FeatureCollection",
        features: props.data,
      });
      Log.info("The data source has been refreshed", "LayerUnClustered");
    }
  }, [isLayerMounted, props]);

  /**
   * Set to mounted
   */
  useEffect(() => {
    if (!isLayerMounted && isSourceAdded && isLayerAdded) {
      setIsLayerMounted(true);
      Log.info("The layer cluster has been mounted", "LayerUnClustered");
    }
  }, [isLayerMounted, isSourceAdded, isLayerAdded]);

  return <></>;
}

LayerUnClustered.propTypes = {
  map: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
};
