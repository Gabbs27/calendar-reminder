/* eslint-disable no-undef */
import WeatherMapInstance from "./config/WeatherMapInstance";

const getWeatherConditions = async (cityName) => {
  if (cityName === undefined) throw Error();
  try {
    const response = await WeatherMapInstance.get(`/weather`, {
      params: {
        q: cityName,
        appid: "886705b4c1182eb1c69f28eb8c520e20",
      },
    });

    return response.data.weather;
  } catch (error) {
    console.log(error.toJSON());
  }
};

export { getWeatherConditions };
