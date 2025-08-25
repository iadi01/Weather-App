// Starting Date 17-aug-2025
// Ending Date 24-aug-2025

// DOM Elements
const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-Found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windSpeedValueTxt = document.querySelector('.wind-speed-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container');

// API Key
const apiKey = 'cdbe96f859967ec3a88dca6820311a8f';

// Event Listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city !== '') {
    updateWeatherInfo(city);
    cityInput.value = '';
    cityInput.blur();
  }
});

cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && cityInput.value.trim() !== '') {
    updateWeatherInfo(cityInput.value.trim());
    cityInput.value = '';
    cityInput.blur();
  }
});

// Fetch API Data
async function getFetchData(endpoint, city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/${endpoint}?q=${city}&appid=${apiKey}&units=metric`;
  const response = await fetch(apiUrl);
  return response.json();
}

// Weather Icon Map
function getWeatherIcon(id) {
  if (id >= 200 && id <= 232) return 'thunderstorm.svg';
  if (id >= 300 && id <= 321) return 'drizzle.svg';
  if (id >= 500 && id <= 531) return 'rain.svg';
  if (id >= 600 && id <= 622) return 'snow.svg';
  if (id >= 701 && id <= 781) return 'atmosphere.svg';
  if (id === 800) return 'clear.svg';
  if (id >= 801 && id <= 804) return 'clouds.svg';
  return 'clear.svg';
}

// Get Current Date
function getCurrentDate() {
  const currentDate = new Date();
  const options = { weekday: 'short', day: '2-digit', month: 'short' };
  return currentDate.toLocaleDateString('en-GB', options);
}

// Update Weather Info (Current + Forecast)
async function updateWeatherInfo(city) {
  const weatherData = await getFetchData('weather', city);

  if (weatherData.cod !== 200) {
    showDisplaySection(notFoundSection);
    return;
  }

  const {
    name: country,
    main: { temp, humidity },
    weather: [{ id, main }],
    wind: { speed }
  } = weatherData;

  countryTxt.textContent = country;
  tempTxt.textContent = Math.round(temp) + '°C';
  conditionTxt.textContent = main;
  humidityValueTxt.textContent = humidity + '%';
  windSpeedValueTxt.textContent = speed + ' M/s';
  currentDateTxt.textContent = getCurrentDate();
  weatherSummaryImg.src = `Mainimg/weather/${getWeatherIcon(id)}`;

  await updateForecastsInfo(city);
  showDisplaySection(weatherInfoSection);
}

// Update 7-Day Forecast Info
async function updateForecastsInfo(city) {
  const forecastsData = await getFetchData('forecast', city);

  const targetTime = '12:00:00';
  const todayDate = new Date().toISOString().split('T')[0];
  const uniqueDays = new Set();

  forecastItemsContainer.innerHTML = '';

  forecastsData.list.forEach(forecast => {
    const date = forecast.dt_txt.split(' ')[0];

    if (
      forecast.dt_txt.includes(targetTime) &&
      !uniqueDays.has(date) &&
      date !== todayDate
    ) {
      uniqueDays.add(date);
      updateForecastItem(forecast);
    }
  });
}

// Create One Forecast Item
function updateForecastItem(weatherData) {
  const {
    dt_txt: date,
    weather: [{ id }],
    main: { temp }
  } = weatherData;

  const dateObj = new Date(date);
  const options = { day: '2-digit', month: 'short' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  const itemHTML = `
    <div class="forecast-item">
      <h5 class="forecast-item-date regular-txt">${formattedDate}</h5>
      <img src="Mainimg/weather/${getWeatherIcon(id)}" class="forecast-item-img">
      <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
    </div>
  `;

  forecastItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
}

// Handle Section Display
function showDisplaySection(activeSection) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach(section => {
    section.style.display = 'none';
  });

  activeSection.style.display = 'flex';
}


// 🎤 Voice Search: Press "V" to speak city name
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === '') {
    startVoiceSearch();
  }
});

function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const spokenCity = event.results[0][0].transcript;
    updateWeatherInfo(spokenCity);
    lastSearchedCity = spokenCity;
  };

  recognition.onerror = (event) => {
    console.warn("❌ Voice recognition error:", event.error);
  };
}

// 📍 Auto-detect Location
window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}`;

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data && data.location) {
        updateWeatherInfo(data.location.name);
        lastSearchedCity = data.location.name;
      }
    }, () => {
      console.warn("Location access denied.");
    });
  }
});

// 🔄 Auto-refresh every 2 minutes
let lastSearchedCity = '';

setInterval(() => {
  if (lastSearchedCity) {
    console.log(`🔄 Auto-refreshing for ${lastSearchedCity}`);
    updateWeatherInfo(lastSearchedCity);
  }
}, 120000); // 2 minutes
