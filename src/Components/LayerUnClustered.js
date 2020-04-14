import { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import lookup from "country-code-lookup";
import mapboxgl from "mapbox-gl";
import { isIOS } from "react-device-detect";

function LayerUnClustered({
  map,
  data,
  dataCountries,
  circlesColor,
  circlesRadius,
  isMapLoaded = false,
}) {
  const sourceId = "LayerUnClustered";
  const [isLayerMounted, setIsLayerMounted] = useState(false);
  const [isSourceAdded, setIsSourceAdded] = useState(false);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  const addSource = useCallback(() => {
    if (!isSourceAdded && data && isMapLoaded) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data,
        },
      });

      console.info("LayerUnClustered - The source has been added");
      setIsSourceAdded(true);
    }
  }, [isSourceAdded, data, map, isMapLoaded]);

  const addLayer = useCallback(() => {
    if (isSourceAdded && !isLayerAdded && map) {
      map.addLayer({
        id: "LayerUnClustered_circle-layer",
        type: "circle",
        source: sourceId,
        minzoom: isIOS ? 0 : 4,
        maxzoom: 22,
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

      map.addLayer({
        id: "LayerUnClustered_count-layer",
        type: "symbol",
        source: sourceId,
        minzoom: isIOS ? 0 : 4,
        maxzoom: 22,
        filter: ["has", "cases"],
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
          dataCountries[country] !== undefined
            ? ` <sup>(${dataCountries[country].cases})</sup>`
            : ""
        }</b></p>
                  <p>Deaths: <b>${deaths}${
          dataCountries[country] !== undefined
            ? ` <sup>(${dataCountries[country].deaths})</sup>`
            : ""
        }</b></p>
                  <p>Mortality Rate: <b>${mortalityRate}%</b></p>
                  ${countryFlagHTML}`;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates).setHTML(HTML).addTo(map);
      };

      map.on("mouseenter", "LayerUnClustered_circle-layer", function () {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "LayerUnClustered_circle-layer", function () {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "LayerUnClustered_circle-layer", (e) => {
        openPopup(e);
      });

      console.info("LayerUnClustered - The layer has been added");
      setIsLayerAdded(true);
    }
  }, [
    circlesColor,
    circlesRadius,
    dataCountries,
    isLayerAdded,
    isSourceAdded,
    map,
  ]);

  /**
   * Add the source
   */
  useEffect(() => {
    if (isMapLoaded && !isSourceAdded) {
      addSource();
    }
  }, [
    isMapLoaded,
    addSource,
    isSourceAdded
  ]);

  /**
   * Add the layer
   */
  useEffect(() => {
    if (isMapLoaded && isSourceAdded && !isLayerAdded) {
      addLayer();
    }
  }, [
    isLayerAdded,
    addLayer,
    isSourceAdded,
    isMapLoaded,
  ]);

  /**
   * Update the data source
   */
  useEffect(() => {
    if (isLayerMounted) {
      map.getSource(sourceId).setData({
        type: "FeatureCollection",
        features: data,
      },);
      console.info("LayerUnClustered - The data source has been refreshed");
    }
  }, [
    map,
    isLayerMounted,
    data,
  ]);

  /**
   * Set to mounted
   */
  useEffect(() => {
    if (!isLayerMounted && isSourceAdded && isLayerAdded) {
      setIsLayerMounted(true);
      console.info("LayerUnClustered - The layer cluster has been mounted");
    }
  }, [
    isLayerMounted,
    isSourceAdded,
    isLayerAdded,
  ]);
}

LayerUnClustered.propTypes = {
  map: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
  dataCountries: PropTypes.array.isRequired,
  circlesColor: PropTypes.array,
  circlesRadius: PropTypes.array,
  isMapLoaded: PropTypes.bool.isRequired,
};

export default LayerUnClustered;
