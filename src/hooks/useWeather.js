import { useState, useCallback } from 'react';

function getWeatherCondition(code) {
  if (code === 0) return { text: 'Clear sky', icon: '☀️' };
  if (code === 1 || code === 2 || code === 3) return { text: 'Partly cloudy', icon: '⛅' };
  if (code >= 45 && code <= 48) return { text: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { text: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: '❄️' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', icon: '⛈️' };
  return { text: 'Unknown', icon: '🌡️' };
}

export function useWeather() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (city) => {
    if (!city) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (!geoRes.ok) throw new Error("Location service unavailable.");
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Could not find "${city}". Check spelling.`);
      }

      const location = geoData.results[0];

      // Expanded API call for Hourly and Advanced Daily Metrics
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto`);
      if (!weatherRes.ok) throw new Error("Weather data unavailable.");
      const weatherData = await weatherRes.json();

      const currentCondition = getWeatherCondition(weatherData.current.weather_code);
      
      const forecast = weatherData.daily.time.slice(0, 7).map((time, index) => ({
        date: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
        max: Math.round(weatherData.daily.temperature_2m_max[index]),
        min: Math.round(weatherData.daily.temperature_2m_min[index]),
        condition: getWeatherCondition(weatherData.daily.weather_code[index])
      }));

      // Map the next 24 hours
      const currentHourIndex = weatherData.hourly.time.findIndex(t => new Date(t) > new Date());
      const hourly = weatherData.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((time, index) => ({
        time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric' }),
        temp: Math.round(weatherData.hourly.temperature_2m[currentHourIndex + index]),
        condition: getWeatherCondition(weatherData.hourly.weather_code[currentHourIndex + index])
      }));

      setData({
        city: `${location.name}, ${location.country}`,
        current: {
          temp: Math.round(weatherData.current.temperature_2m),
          feelsLike: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          wind: weatherData.current.wind_speed_10m,
          ...currentCondition
        },
        details: {
          uvIndex: weatherData.daily.uv_index_max[0] || 0,
          sunrise: new Date(weatherData.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          sunset: new Date(weatherData.daily.sunset[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        },
        forecast,
        hourly
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchWeather };
}