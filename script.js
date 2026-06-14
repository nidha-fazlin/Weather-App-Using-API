const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const locationName = document.getElementById('locationName');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const feelsLike = document.getElementById('feelsLike');
const errorMessage = document.getElementById('errorMessage');

const geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
const weatherUrl = 'https://api.open-meteo.com/v1/forecast';

async function fetchWeather(city) {
  errorMessage.textContent = '';
  locationName.textContent = 'Searching...';
  condition.textContent = 'Fetching weather information';
  temperature.textContent = '--';
  humidity.textContent = '--';
  windSpeed.textContent = '--';
  feelsLike.textContent = '--';

  try {
    const geoResponse = await fetch(`${geocodingUrl}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found. Try another name.');
    }

    const location = geoData.results[0];
    const { latitude, longitude, name, country, admin1 } = location;
    const locationLabel = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;

    const weatherResponse = await fetch(
      `${weatherUrl}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,windspeed_10m&timezone=auto`);
    const weatherData = await weatherResponse.json();

    if (!weatherData.current_weather) {
      throw new Error('Unable to fetch weather details.');
    }

    const current = weatherData.current_weather;
    let timeIndex = weatherData.hourly?.time?.findIndex((time) => time === current.time);
    let humidityValue = null;
    let feelsLikeValue = null;
    const windValue = current.windspeed;

    if (timeIndex >= 0) {
      humidityValue = weatherData.hourly.relativehumidity_2m[timeIndex];
      feelsLikeValue = weatherData.hourly.apparent_temperature[timeIndex];
    } else if (weatherData.hourly?.time?.length) {
      const currentMs = Date.parse(current.time);
      let nearestIndex = -1;
      let nearestDiff = Infinity;

      weatherData.hourly.time.forEach((hourTime, index) => {
        const diff = Math.abs(Date.parse(hourTime) - currentMs);
        if (diff < nearestDiff) {
          nearestDiff = diff;
          nearestIndex = index;
        }
      });

      if (nearestIndex >= 0) {
        humidityValue = weatherData.hourly.relativehumidity_2m[nearestIndex];
        feelsLikeValue = weatherData.hourly.apparent_temperature[nearestIndex];
      }
    }

    const weatherDescriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail'
    };

    locationName.textContent = locationLabel;
    temperature.textContent = Math.round(current.temperature);
    condition.textContent = weatherDescriptions[current.weathercode] || 'Weather update';
    humidity.textContent = humidityValue !== null ? `${Math.round(humidityValue)}%` : 'N/A';
    windSpeed.textContent = `${Math.round(windValue)} km/h`;
    feelsLike.textContent = feelsLikeValue !== null ? `${Math.round(feelsLikeValue)}°C` : `${Math.round(current.temperature)}°C`;
  } catch (error) {
    locationName.textContent = 'Search for a city';
    condition.textContent = 'Unable to load weather data';
    errorMessage.textContent = error.message;
  }
}

searchButton.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  } else {
    errorMessage.textContent = 'Please enter a city name.';
  }
});

cityInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    searchButton.click();
  }
});
