import { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { isIOS } from "react-device-detect";

function LayerCluster({
  map,
  dataExploded,
  circlesColor,
  circlesRadius,
  isMapMounted = false,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isSourceAdded, setIsSourceAdded] = useState(false);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  const addSource = useCallback(() => {
    if (!isSourceAdded && dataExploded && dataExploded.length > 0 && isMapMounted) {
      map.addSource("LayerCluster", {
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
  }, [isSourceAdded, dataExploded, map, isMapMounted]);

  const addLayer = useCallback(() => {
    if (isSourceAdded && !isLayerAdded && map) {
      //#region Then the layers
      map.addLayer({
        id: "LayerCluster_circle-layer",
        type: "circle",
        source: "LayerCluster",
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
        source: "LayerCluster",
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
          .getSource("LayerCluster")
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

  useEffect(() => {
    if (!isMapMounted) {
      console.warn("LayerCluster - The map is not mounted yet");
      return;
    }
    if (!isMounted && isIOS) {
      setIsMounted(true);
      console.warn(
        "LayerCluster - The layer cluster is ignored because we are on IOS..."
      );
    }
    if (!isMounted) {
      addSource();
      addLayer();
    }
    if (!isMounted && isSourceAdded && isLayerAdded) {
      setIsMounted(true);
      console.info("LayerCluster - The layer cluster has been mounted");
    }
  }, [
    map,
    dataExploded,
    isMounted,
    addSource,
    addLayer,
    isSourceAdded,
    isLayerAdded,
    isMapMounted,
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
