import { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";

function LayerCluster({
  map,
  data,
  circlesColor,
  circlesRadius,
  isMapLoaded = false,
}) {
  const sourceId = "LayerCluster";
  const [isLayerMounted, setIsLayerMounted] = useState(false);
  const [isSourceAdded, setIsSourceAdded] = useState(false);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  const addSource = useCallback(() => {
    if (
      !isSourceAdded &&
      data &&
      data.length > 0 &&
      isMapLoaded
    ) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data,
        },
        maxzoom: 4,
        cluster: true,
        clusterMaxZoom: 3,
        clusterRadius: 50,
        clusterProperties: {
          "sum_cases": ["+", ["get", "cases"]],
          "sum_deaths": ["max", ["get", "deaths"]],
          "sum_cases_abbreviated": ["+", ["get", "cases"]],
        }
      });
      console.info("LayerCluster - The source has been added");
      setIsSourceAdded(true);
    }
  }, [isSourceAdded, data, map, isMapLoaded]);

  const addLayer = useCallback(() => {
    if (isSourceAdded && !isLayerAdded && map) {
      //#region Then the layers
      map.addLayer({
        id: "LayerCluster_circle-layer",
        type: "circle",
        source: sourceId,
        filter: ['==', ['get', 'cluster'], true],
        minzoom: 0,
        maxzoom: 4,
        paint: {
          "circle-opacity": 0.75,
          "circle-stroke-width": 1,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "sum_cases"],
            ...circlesRadius,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "sum_cases"],
            ...circlesColor,
          ],
        },
      });

      map.addLayer({
        id: "LayerCluster_count-layer",
        type: "symbol",
        source: sourceId,
        minzoom: 0,
        maxzoom: 4,
        filter: ['==', ['get', 'cluster'], true],
        layout: {
          "text-field": "{sum_cases}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });
      //#endregion

      map.on("click", "LayerCluster_circle-layer", function (e) {
        var features = map.queryRenderedFeatures(e.point, {
          layers: ["LayerCluster_circle-layer"],
        });
        var clusterId = features[0].properties.cluster_id;
        map
          .getSource(sourceId)
          .getClusterExpansionZoom(clusterId, function (err, zoom) {
            if (err) return;

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      map.on("mouseenter", "LayerCluster_circle-layer", function () {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "LayerCluster_circle-layer", function () {
        map.getCanvas().style.cursor = "";
      });

      console.info("LayerCluster - The layer has been added");
      setIsLayerAdded(true);
    }
  }, [
    isSourceAdded,
    isLayerAdded,
    setIsLayerAdded,
    map,
    circlesColor,
    circlesRadius,
  ]);

  /**
   * Add the source
   */
  useEffect(() => {
    if (isMapLoaded && !isSourceAdded) {
      addSource();
    }
  }, [isMapLoaded, addSource, isSourceAdded]);

  /**
   * Add the layer
   */
  useEffect(() => {
    if (isMapLoaded && isSourceAdded && !isLayerAdded) {
      addLayer();
    }
  }, [isLayerAdded, addLayer, isSourceAdded, isMapLoaded]);

  /**
   * Update the data source
   */
  useEffect(() => {
    if (isLayerMounted) {
      map.getSource(sourceId).setData({
        type: "FeatureCollection",
        features: data,
      });
      console.info("LayerCluster - The data source has been refreshed");
    }
  }, [map, isLayerMounted, data]);

  /**
   * Set to mounted
   */
  useEffect(() => {
    if (!isLayerMounted && isSourceAdded && isLayerAdded) {
      setIsLayerMounted(true);
      console.info("LayerCluster - The layer cluster has been mounted");
    }
  }, [isLayerMounted, isSourceAdded, isLayerAdded]);
}

LayerCluster.propTypes = {
  map: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
  circlesColor: PropTypes.array,
  circlesRadius: PropTypes.array,
  isMapMounted: PropTypes.bool.isRequired,
};

export default LayerCluster;
