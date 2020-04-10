import React, { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr"; // React hook to fetch the data
import lookup from "country-code-lookup"; // npm module to get ISO Code for countries
import "./App.scss";

// CSS impots
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHJucHY2ZTBncnIzZ24wbzc3YXNra28ifQ.9hGdFuMrqySLI5YDfw2V3w";
// mapboxgl.accessToken = "pk.eyJ1Ijoid2VlYm9vIiwiYSI6ImNrOHJucWRucjBnaTYzaW4wMWJkYWtna3IifQ.UpQnfoFjE3JFKhQjcIZqFQ";

function App() {
  //#region Fetch Data
  const apiURL = "https://corona.lmao.ninja/v2";

  // const historicalFetcher = (url, country, province) =>
  //   fetch(`${url}/historical/${country}/${province != null ? province : ""}`)
  //     .then((res) => res.json());

  // const hist = await historicalFetcher(url, point.country, point.province);

  const mainFetcher = (url) =>
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        data.map((point, index) => {
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                point.coordinates.longitude,
                point.coordinates.latitude,
              ],
            },
            properties: {
              id: index, // unique identifier in this case the index
              country: point.country,
              province: point.province,
              cases: point.stats.confirmed,
              deaths: point.stats.deaths,
            },
          };
        })
      );

  const explodeData = () => {
    const explodedTemp = [];
    const countriesTemp = [];
    if (data) {
      data.forEach((element) => {
        // We calculate the total / country if the country has a province
        if (element.properties.province) {
          if (!countriesTemp[element.properties.country]) {
            countriesTemp[element.properties.country] = {
              country: element.properties.country,
              cases: element.properties.cases,
              deaths: element.properties.deaths,
            };
          } else {
            countriesTemp[element.properties.country].cases +=
              element.properties.cases;
            countriesTemp[element.properties.country].deaths +=
              element.properties.deaths;
          }
        }

        let clonedElement = {
          ...element,
          properties: { ...element.properties, cases: 1, deaths: 0 },
        };
        // clonedElement.properties.cases = 1;
        // clonedElement.properties.deaths = 0;
        for (let i = 0; i < element.properties.cases; i++) {
          const clonedElementCases = { ...clonedElement };
          explodedTemp.push(clonedElementCases);
        }
        clonedElement = {
          ...element,
          properties: { ...element.properties, cases: 0, deaths: 1 },
        };
        for (let i = 0; i < element.properties.deaths; i++) {
          const clonedElementDeaths = { ...clonedElement };
          explodedTemp.push(clonedElementDeaths);
        }
      });
      return { explodedTemp, countriesTemp };
    }
    return {};
  };

  // Fetching our data with swr package
  const { data } = useSWR(`${apiURL}/jhucsse`, mainFetcher);
  const {
    explodedTemp: explodedData,
    countriesTemp: countriesData,
  } = explodeData();
  const mapboxElRef = useRef(null); // DOM element to render map

  //#endregion

  const initMap = useCallback(() => {
    const map = new mapboxgl.Map({
      container: mapboxElRef.current,
      style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
      center: [16, 27],
      zoom: 2,
    });

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

    // Add geolocate control to the map.
    map.addControl(geoControl);

    return { map, geoControl };
  }, []);

  const addClusters = useCallback(
    (map) => {
      if (explodedData) {
        const sourceData = {
          source: {
            id: "pointsCluster",
            clusterMaxZoom: 3,
            clusterRadius: 50,
            maxZoom: 4,
            data: {
              type: "FeatureCollection",
              features: explodedData,
            },
          },
          layers: {
            minZoom: 0,
            maxZoom: 4,
            circle: {
              id: "pointsCluster_clusters",
            },
            counts: {
              id: "pointsCluster_counts",
            },
          },
        };

        // First the source
        map.addSource(sourceData.source.id, {
          type: "geojson",
          data: sourceData.source.data,
          maxzoom: sourceData.source.maxZoom,
          cluster: true,
          clusterMaxZoom: sourceData.source.clusterMaxZoom,
          clusterRadius: sourceData.source.clusterRadius,
        });

        //#region Then the layers
        map.addLayer({
          id: sourceData.layers.circle.id,
          type: "circle",
          source: sourceData.source.id,
          filter: ["has", "point_count"],
          minzoom: sourceData.layers.minZoom,
          maxzoom: sourceData.layers.maxZoom,
          paint: {
            "circle-opacity": 0.75,
            "circle-stroke-width": 1,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              1,
              4,
              1000,
              8,
              4000,
              10,
              8000,
              14,
              12000,
              18,
              100000,
              22,
              200000,
              27,
              300000,
              40,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              1,
              "#ffffb2",
              5000,
              "#fed976",
              10000,
              "#feb24c",
              25000,
              "#fd8d3c",
              50000,
              "#fc4e2a",
              75000,
              "#e31a1c",
              100000,
              "#b10026",
              200000,
              "#80001c",
              300000,
              "#e60000",
            ],
          },
        });

        map.addLayer({
          id: sourceData.layers.counts.id,
          type: "symbol",
          source: sourceData.source.id,
          minzoom: sourceData.layers.minZoom,
          maxzoom: sourceData.layers.maxZoom,
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });
        //#endregion

        //#region Then the events
        // inspect a cluster on click
        map.on("click", sourceData.layers.circle.id, function (e) {
          var features = map.queryRenderedFeatures(e.point, {
            layers: [sourceData.layers.circle.id],
          });
          var clusterId = features[0].properties.cluster_id;
          map
            .getSource(sourceData.source.id)
            .getClusterExpansionZoom(clusterId, function (err, zoom) {
              if (err) return;

              map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom,
              });
            });
        });

        map.on("mouseenter", sourceData.layers.circle.id, function () {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", sourceData.layers.circle.id, function () {
          map.getCanvas().style.cursor = "";
        });
        //#endregion
      }
    },
    [explodedData]
  );

  const addData = useCallback(
    (map) => {
      if (data && countriesData) {
        const sourceData = {
          source: {
            id: "points-unclustered",
            data: {
              type: "FeatureCollection",
              features: data,
            },
          },
          layers: {
            minZoom: 4,
            maxZoom: 22,
            circle: {
              id: "points-unclustered_circle",
            },
            counts: {
              id: "points-unclustered_counts",
            },
          },
        };

        // First the source
        map.addSource(sourceData.source.id, {
          type: "geojson",
          data: sourceData.source.data,
        });

        // Then the layers
        map.addLayer({
          id: sourceData.layers.circle.id,
          type: "circle",
          source: sourceData.source.id,
          minzoom: sourceData.layers.minZoom,
          maxzoom: sourceData.layers.maxZoom,
          paint: {
            "circle-opacity": 0.75,
            "circle-stroke-width": 1,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              4,
              1000,
              8,
              4000,
              10,
              8000,
              14,
              12000,
              18,
              100000,
              22,
              200000,
              27,
              300000,
              40,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              "#ffffb2",
              5000,
              "#fed976",
              10000,
              "#feb24c",
              25000,
              "#fd8d3c",
              50000,
              "#fc4e2a",
              75000,
              "#e31a1c",
              100000,
              "#b10026",
              200000,
              "#80001c",
              300000,
              "#e60000",
            ],
          },
        });

        map.addLayer({
          id: sourceData.layers.counts.id,
          type: "symbol",
          source: sourceData.source.id,
          minzoom: sourceData.layers.minZoom,
          maxzoom: sourceData.layers.maxZoom,
          filter: ["has", "cases"],
          layout: {
            "text-field": "{cases}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });

        // Then the events
        map.on("mouseenter", sourceData.layers.circle.id, function () {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", sourceData.layers.circle.id, function () {
          map.getCanvas().style.cursor = "";
        });

        //#region The popup
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
        });

        let lastId;

        const openPopup = (e) => {
          const id = e.features[0].properties.id;

          if (id !== lastId) {
            lastId = id;
            const {
              cases,
              deaths,
              country,
              province,
            } = e.features[0].properties;

            // Change the pointer type on mouseenter

            const coordinates = e.features[0].geometry.coordinates.slice();
            const countryISO =
              lookup.byCountry(country)?.iso2 ||
              lookup.byInternet(country)?.iso2;
            const provinceHTML =
              province !== "null" ? `<p>Province: <b>${province}</b></p>` : "";
            const mortalityRate = ((deaths / cases) * 100).toFixed(2);
            const countryFlagHTML = Boolean(countryISO)
              ? `<img src="https://www.countryflags.io/${countryISO}/flat/64.png"></img>`
              : "";

            const HTML = `<p>Country: <b>${country}</b></p>
                ${provinceHTML}
                <p>Cases: <b>${cases}${
              countriesData[country] !== undefined
                ? ` <sup>(${countriesData[country].cases})</sup>`
                : ""
            }</b></p>
                <p>Deaths: <b>${deaths}${
              countriesData[country] !== undefined
                ? ` <sup>(${countriesData[country].deaths})</sup>`
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
          }
        };

        map.on("mousemove", sourceData.layers.circle.id, (e) => {
          openPopup(e);
        });
        //#endregion
      }
    },
    [data, countriesData]
  );

  useEffect(() => {
    if (data && explodedData) {
      // You can store the map instance with useRef too
      const { map, geoControl } = initMap();

      // Call this method when the map is loaded
      map.once("load", () => {
        addClusters(map);
        addData(map);
        geoControl.trigger();
      });
    }
  }, [data, explodedData, addClusters, addData, initMap]);

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assigned Mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
