import axios from "axios";

const WeatherMapInstance = axios.create({
  //couldn't implement visualcrossing.
  //   baseURL: `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/`,
  baseURL: `http://api.openweathermap.org/data/2.5`,
  timeout: 1000,
});

export default WeatherMapInstance;
