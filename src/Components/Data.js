import { useState } from "react";
import useSWR, { mutate } from "swr";

function FetchData() {
  const keyApi = "https://corona.lmao.ninja/v2/jhucsse";

  const [data, setData] = useState([]);
  const [dataExploded, setDataExploded] = useState([]);
  const [dataCountries, setDataCountries] = useState([]);

  const mainFetcher = (url) => fetch(url).then((_) => _.json());

  const onFetchError = (err, key, config) => {
    console.error(`FetchData - An error happened, ${err}, ${key}, ${config}`);
  };

  const onFetchSuccess = (data, key, config) => {
    console.info("FetchData - Data have been fecthed");

    // We map the data in a better format
    const explodedTemp = [];
    const countriesTemp = [];
    setData(
      data.map((point, index) => {
        //#region Country calculation
        if (point.province || countriesTemp[point.country]) {
          if (!countriesTemp[point.country]) {
            countriesTemp[point.country] = {
              country: point.country,
              cases: point.stats.confirmed,
              deaths: point.stats.deaths,
            };
          } else {
            countriesTemp[point.country].cases += point.stats.confirmed;
            countriesTemp[point.country].deaths += point.stats.deaths;
          }
        }
        //#endregion
        //#region Main Data
        const data = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              point.coordinates.longitude,
              point.coordinates.latitude,
            ],
          },
          properties: {
            id: index,
            country: point.country,
            province: point.province,
            cases: point.stats.confirmed,
            deaths: point.stats.deaths,
          },
        };
        //#endregion
        //#region Exploded data
        let clonedElement = {
          ...data,
          properties: { ...data.properties, cases: 1, deaths: 0 },
        };
        for (let i = 0; i < data.properties.cases; i++) {
          const clonedElementCases = { ...clonedElement };
          explodedTemp.push(clonedElementCases);
        }
        clonedElement = {
          ...data,
          properties: { ...data.properties, cases: 0, deaths: 1 },
        };
        for (let i = 0; i < data.properties.deaths; i++) {
          const clonedElementDeaths = { ...clonedElement };
          explodedTemp.push(clonedElementDeaths);
        }
        //#endregion
        return data;
      })
    );
    setDataExploded(explodedTemp);
    setDataCountries(countriesTemp);
    console.info("FetchData - Data have been parsed");
  };

  useSWR(keyApi, {
    fetcher: mainFetcher,
    refreshInterval: 86400,
    onSuccess: onFetchSuccess,
    onError: onFetchError,
    revalidateOnFocus: false,
  });

  const reValidate = () => {
    mutate(keyApi);
  };

  return { data, dataExploded, dataCountries, reValidate };
}

export default FetchData;
