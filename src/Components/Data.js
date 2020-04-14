import { useState } from "react";
import useSWR, { mutate } from "swr";

function FetchData() {
  const keyApi = "https://corona.lmao.ninja/v2/jhucsse";

  const getCountriesException = () => {
    const tmp = [];
    tmp["Holy See"] = "Italy";

    return tmp;
  };
  const [data, setData] = useState([]);
  const [dataCountries, setDataCountries] = useState([]);

  const mainFetcher = (url) => fetch(url).then((_) => _.json());

  const onFetchError = (err, key, config) => {
    console.error(`FetchData - An error happened, ${err}, ${key}, ${config}`);
  };

  const onFetchSuccess = (data, key, config) => {
    console.info("FetchData - Data have been fecthed");

    // We map the data in a better format
    const countriesTemp = [];
    setData(
      data.map((point, index) => {
        //#region Country calculation
        if (point.province || countriesTemp[point.country] || getCountriesException()[point.country]) {
          const country = getCountriesException()[point.country]?getCountriesException()[point.country]:point.country;
          if (!countriesTemp[country]) {
            countriesTemp[country] = {
              country: country,
              cases: point.stats.confirmed,
              deaths: point.stats.deaths,
            };
          } else {
            countriesTemp[country].cases += point.stats.confirmed;
            countriesTemp[country].deaths += point.stats.deaths;
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
        return data;
      })
    );
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

  return { data, dataCountries, reValidate };
}

export default FetchData;
