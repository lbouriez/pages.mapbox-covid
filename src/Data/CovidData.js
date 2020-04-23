import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import Log from "../Debug";

const API = {
  key: "https://corona.lmao.ninja/v2/",
  queryData: "jhucsse",
  // queryHistoricalData: "historical",
};

export default function CovidData() {
  const [data, setData] = useState(null);
  const [totalCountry, setTotalCountry] = useState(null);

  const { data: dailyData, isLoading: isLoadingDailyData } = useSWR(
    `${API.key}${API.queryData}`,
    {
      fetcher: (url) => fetch(url).then((_) => _.json()),
      refreshInterval: 86400,
      onSuccess: () => Log.info("DailyData have been fecthed", "CovidData"),
      onError: (err, key, config) =>
        Log.error(
          `DailyData - An error happened, ${err}, ${key}, ${config}`,
          "CovidData"
        ),
      revalidateOnFocus: false,
    }
  );

  // const { data: historicalData, isLoading: isLoadingHistoricalData } = useSWR(
  //   `${API.key}${API.queryHistoricalData}`,
  //   {
  //     fetcher: (url) => fetch(url).then((_) => _.json()),
  //     refreshInterval: 86400,
  //     onSuccess: () =>
  //       Log.info("HistoricalData have been fecthed", "CovidData"),
  //     onError: (err, key, config) =>
  //       Log.error(
  //         `HistoricalData - An error happened, ${err}, ${key}, ${config}`,
  //         "CovidData"
  //       ),
  //     revalidateOnFocus: false,
  //   }
  // );

  const reLoad = () => {
    mutate(`${API.key}${API.queryData}`);
    // mutate(`${API.key}${API.queryHistoricalData}`);
  };

  /**
   * Calculate the total per country
   * @param  {} (
   */
  useEffect(() => {
    if (dailyData && !isLoadingDailyData) {
      const countriesTotal = [];
      dailyData.forEach((element) => {
        const country = element.country;
        if (!countriesTotal[country]) {
          countriesTotal[country] = {
            country: country,
            cases: element.stats.confirmed,
            deaths: element.stats.deaths,
            recovered: element.stats.recovered,
          };
        } else {
          countriesTotal[country].cases += element.stats.confirmed;
          countriesTotal[country].deaths += element.stats.deaths;
          countriesTotal[country].recovered += element.stats.recovered;
        }
      });
      setTotalCountry(countriesTotal);
      Log.trace("Total per country has been calculated", "CovidData");
    }
  }, [dailyData, isLoadingDailyData]);

  /**
   * Format the data
   * @param  {} (
   */
  useEffect(() => {
    if (dailyData && !isLoadingDailyData && totalCountry) {
      const dataUpdated = dailyData.map((element, index) => {
        const data = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              element.coordinates.longitude,
              element.coordinates.latitude,
            ],
          },
          properties: {
            id: index,
            country: element.country,
            province: element.province,
            cases: element.stats.confirmed,
            deaths: element.stats.deaths,
            total: {
              ...totalCountry[element.country]
            }
          },
        };
        return data;
      });
      setData(dataUpdated);
      Log.trace("Dataset created", "CovidData");
    }
  }, [totalCountry, dailyData, isLoadingDailyData]);

  // useEffect(() => {
  //   if (
  //     dailyData &&
  //     historicalData &&
  //     !isLoadingDailyData &&
  //     !isLoadingHistoricalData
  //   ) {
  //     const countriesCoordinates = [];
  //     const countriesTotal = [];
  //     const historicalDataTransformed = [];
  //     const getKey = (country, province) => {
  //       const countries = [];
  //       countries["USA"] = "US";
  //       countries["UK"] = "United Kingdom";
  //       countries['Lao People"s Democratic Republic'] = "Laos";
  //       countries["Bosnia"] = "Bosnia and Herzegovina";
  //       countries["Libyan Arab Jamahiriya"] = "Libya";
  //       countries["Syrian Arab Republic"] = "Syria";
  //       countries["DRC"] = "Congo (Kinshasa)";
  //       countries["Congo"] = "Congo (Brazzaville)";
  //       countries["Swaziland"] = "Eswatini";
  //       countries["S. Korea"] = "Korea, South";
  //       countries["Macedonia"] = "North Macedonia";
  //       countries["Taiwan"] = "Taiwan*";
  //       countries["UAE"] = "United Arab Emirates";
  //       const countryCorrespondance = countries[country] ? countries[country] : country;
  //       return {
  //         key: `${countryCorrespondance}$${province}`.toLowerCase(),
  //         country: countryCorrespondance,
  //         province: province
  //       };
  //     };

  //     // Get the total per country
  //     dailyData.forEach((element) => {
  //       const country = element.country;
  //       if (!countriesTotal[country]) {
  //         countriesTotal[country] = {
  //           country: country,
  //           cases: element.stats.confirmed,
  //           deaths: element.stats.deaths,
  //           recovered: element.stats.recovered,
  //         };
  //       } else {
  //         countriesTotal[country].cases += element.stats.confirmed;
  //         countriesTotal[country].deaths += element.stats.deaths;
  //         countriesTotal[country].recovered += element.stats.recovered;
  //       }
  //       // Todo: calculate the total / country for the popup
  //     });

  //     dailyData.forEach((element) => {
  //       const key = `${element.country}$${
  //         element.province ? element.province : ""
  //       }`.toLowerCase();
  //       if (!countriesCoordinates[key]) {
  //         countriesCoordinates[key] = element;
  //       }
  //       if (!countriesTotal[element.country]) {
  //         countriesTotal[element.country] = {
  //           country: element.country,
  //           cases: element.stats.confirmed,
  //           deaths: element.stats.deaths,
  //           recovered: element.stats.recovered,
  //         };
  //       } else {
  //         countriesTotal[element.country].cases += element.stats.confirmed;
  //         countriesTotal[element.country].deaths += element.stats.deaths;
  //         countriesTotal[element.country].recovered += element.stats.recovered;
  //       }
  //       // Todo: calculate the total / country for the popup
  //     });

  //     historicalData.forEach((element, index) => {
  //       const province = element.province ? element.province : "";
  //       const {key, country} = getKey(element.country, province);
  //       const coordinates = countriesCoordinates[key]
  //         ? countriesCoordinates[key].coordinates
  //         : null;
  //       if (!coordinates) {
  //         Log.warn(
  //           `No coordinates found for the country [${country}] / province [${province}]`,
  //           "CovidData"
  //         );
  //       } else {
  //         Object.keys(element.timeline.cases).forEach((date, indexCases) => {
  //           const data = {
  //             type: "Feature",
  //             geometry: {
  //               type: "Point",
  //               coordinates: [coordinates.longitude, coordinates.latitude],
  //             },
  //             properties: {
  //               id: `${country}$${province}$${date}`,
  //               country: country,
  //               province: province,
  //               date: date,
  //               cases: element.timeline.cases[date],
  //               recovered: element.timeline.recovered[date],
  //               deaths: element.timeline.deaths[date],
  //             },
  //           };
  //           historicalDataTransformed.push(data);
  //         });
  //       }
  //     });

  //     Log.error(
  //       "The total of the country has to be improved to handle the slider",
  //       "CovidData"
  //     );
  //     setTotalCountry(countriesTotal);

  //     setData(historicalDataTransformed);
  //     Log.trace("Data have been parsed", "CovidData");
  //   }
  // }, [dailyData, historicalData, isLoadingDailyData, isLoadingHistoricalData]);

  return {
    data,
    isLoading: isLoadingDailyData /* && isLoadingHistoricalData*/,
    reLoad
  };
}
