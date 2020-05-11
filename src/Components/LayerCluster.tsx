import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import {circlesColor, circlesRadius} from "./LayersConst";
import Log from "../Debug";
import { Geometry, Feature, GeoJsonProperties } from "geojson";

type LayerClusterProps = {
  map: mapboxgl.Map,
  data: Feature<Geometry, GeoJsonProperties>[],
}

export default function LayerCluster(props: LayerClusterProps) {
  const sourceId = "LayerCluster";
  const [isLayerMounted, setIsLayerMounted] = useState(false);
  const [isSourceAdded, setIsSourceAdded] = useState(false);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  const addSource = useCallback(() => {
    if (
      !isSourceAdded &&
      props.data &&
      props.data.length > 0
    ) {
      props.map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: props.data,
        },
        maxzoom: 4,
        cluster: true,
        clusterMaxZoom: 3,
        clusterRadius: 50,
        // @ts-ignore
        clusterProperties: {
          "sum_cases": ["+", ["get", "cases"]],
          "sum_deaths": ["max", ["get", "deaths"]],
          "sum_cases_abbreviated": ["+", ["get", "cases"]],
        }
      });
      Log.info("The source has been added", "LayerCluster");
      setIsSourceAdded(true);
    }
  }, [isSourceAdded, props]);

  const addLayer = useCallback(() => {
    if (isSourceAdded && !isLayerAdded && props.map) {
      //#region Then the layers
      props.map.addLayer({
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

      props.map.addLayer({
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

      props.map.on("click", "LayerCluster_circle-layer", function (e) {
        var features = props.map.queryRenderedFeatures(e.point, {
          layers: ["LayerCluster_circle-layer"],
        });
        // @ts-ignore
        var clusterId = features[0].properties.cluster_id;
        props.map
          .getSource(sourceId)
          // @ts-ignore
          .getClusterExpansionZoom(clusterId, function (err, zoom) {
            if (err) return;

            props.map.easeTo({
              // @ts-ignore
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      props.map.on("mouseenter", "LayerCluster_circle-layer", function () {
        props.map.getCanvas().style.cursor = "pointer";
      });
      props.map.on("mouseleave", "LayerCluster_circle-layer", function () {
        props.map.getCanvas().style.cursor = "";
      });

      Log.trace("The layer has been added", "LayerCluster");
      setIsLayerAdded(true);
    }
  }, [isSourceAdded, isLayerAdded, setIsLayerAdded, props]);

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
      // @ts-ignore
      props.map.getSource(sourceId).setData({
        type: "FeatureCollection",
        features: props.data,
      });
      Log.info("The data source has been refreshed", "LayerCluster");
    }
  }, [props, isLayerMounted]);

  /**
   * Set to mounted
   */
  useEffect(() => {
    if (!isLayerMounted && isSourceAdded && isLayerAdded) {
      setIsLayerMounted(true);
      Log.info("The layer cluster has been mounted", "LayerCluster");
    }
  }, [isLayerMounted, isSourceAdded, isLayerAdded]);

  return (<></>);
}

LayerCluster.propTypes = {
  map: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
};