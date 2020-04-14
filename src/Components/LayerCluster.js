import { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { isIOS } from "react-device-detect";

function LayerCluster({
  map,
  dataExploded,
  circlesColor,
  circlesRadius,
  isMapLoaded = false,
}) {
  const sourceId = "LayerCluster";
  const [isLayerMounted, setIsLayerMounted] = useState(false);
  const [isSourceAdded, setIsSourceAdded] = useState(false);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  const addSource = useCallback(() => {
    if (!isSourceAdded && dataExploded && dataExploded.length > 0 && isMapLoaded) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: dataExploded,
        },
        maxzoom: 4,
        cluster: true,
        clusterMaxZoom: 3,
        clusterRadius: 50,
      });
      console.info("LayerCluster - The source has been added");
      setIsSourceAdded(true);
    }
  }, [isSourceAdded, dataExploded, map, isMapLoaded]);

  const addLayer = useCallback(() => {
    if (isSourceAdded && !isLayerAdded && map) {
      //#region Then the layers
      map.addLayer({
        id: "LayerCluster_circle-layer",
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        minzoom: 0,
        maxzoom: 4,
        paint: {
          "circle-opacity": 0.75,
          "circle-stroke-width": 1,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            ...circlesRadius,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
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
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
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
        features: dataExploded,
      },);
      console.info("LayerCluster - The data source has been refreshed");
    }
  }, [
    map,
    isLayerMounted,
    dataExploded,
  ]);

  /**
   * Set to mounted
   */
  useEffect(() => {
    if (!isLayerMounted && isSourceAdded && isLayerAdded) {
      setIsLayerMounted(true);
      console.info("LayerCluster - The layer cluster has been mounted");
    }
  }, [
    isLayerMounted,
    isSourceAdded,
    isLayerAdded,
  ]);
}

LayerCluster.propTypes = {
  map: PropTypes.object.isRequired,
  dataExploded: PropTypes.array.isRequired,
  circlesColor: PropTypes.array,
  circlesRadius: PropTypes.array,
  isMapMounted: PropTypes.bool.isRequired,
};

export default LayerCluster;
