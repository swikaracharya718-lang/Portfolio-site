(() => {
  const form = document.querySelector('#weather-form');
  const input = document.querySelector('#place');
  const status = document.querySelector('#weather-status');
  const result = document.querySelector('#weather-result');
  const currentContainer = document.querySelector('#weather-current');
  const daysContainer = document.querySelector('#weather-days');
  let activeRequest;

  const descriptions = new Map([
    [0, 'Clear sky'], [1, 'Mainly clear'], [2, 'Partly cloudy'], [3, 'Overcast'],
    [45, 'Fog'], [48, 'Rime fog'], [51, 'Light drizzle'], [53, 'Drizzle'], [55, 'Dense drizzle'],
    [56, 'Light freezing drizzle'], [57, 'Freezing drizzle'], [61, 'Light rain'], [63, 'Rain'],
    [65, 'Heavy rain'], [66, 'Light freezing rain'], [67, 'Freezing rain'], [71, 'Light snow'],
    [73, 'Snow'], [75, 'Heavy snow'], [77, 'Snow grains'], [80, 'Rain showers'],
    [81, 'Rain showers'], [82, 'Heavy rain showers'], [85, 'Snow showers'], [86, 'Heavy snow showers'],
    [95, 'Thunderstorm'], [96, 'Thunderstorm with hail'], [99, 'Thunderstorm with hail']
  ]);

  function description(code) {
    return descriptions.get(code) || 'Conditions unavailable';
  }

  async function getJson(url, signal) {
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
    return response.json();
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function render(location, forecast) {
    currentContainer.replaceChildren();
    daysContainer.replaceChildren();

    const place = makeElement('div', 'weather-location', [location.name, location.admin1, location.country]
      .filter((part, index, parts) => part && parts.indexOf(part) === index).join(', '));
    const summary = makeElement('p', 'weather-description', description(forecast.current.weather_code));
    const details = makeElement('div', 'weather-meta', '');
    details.append(
      makeElement('span', '', `Feels like ${Math.round(forecast.current.apparent_temperature)}°C`),
      makeElement('span', '', `Humidity ${forecast.current.relative_humidity_2m}%`),
      makeElement('span', '', `Wind ${Math.round(forecast.current.wind_speed_10m)} km/h`)
    );
    const currentText = document.createElement('div');
    currentText.append(place, summary, details);
    const temperature = makeElement('div', 'weather-temperature', `${Math.round(forecast.current.temperature_2m)}°C`);
    temperature.setAttribute('aria-label', `${Math.round(forecast.current.temperature_2m)} degrees Celsius`);
    currentContainer.append(currentText, temperature);

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
    });
    forecast.daily.time.forEach((date, index) => {
      const day = document.createElement('article');
      day.className = 'weather-day';
      day.append(
        makeElement('strong', '', dateFormatter.format(new Date(`${date}T12:00:00Z`))),
        makeElement('span', '', description(forecast.daily.weather_code[index])),
        makeElement('span', '', `${Math.round(forecast.daily.temperature_2m_min[index])}°C low · ${Math.round(forecast.daily.temperature_2m_max[index])}°C high`)
      );
      daysContainer.append(day);
    });
    result.hidden = false;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const place = input.value.trim();
    if (!place) {
      input.setCustomValidity('Enter a place name to search.');
      input.reportValidity();
      input.setCustomValidity('');
      return;
    }

    activeRequest?.abort();
    activeRequest = new AbortController();
    const { signal } = activeRequest;
    status.textContent = 'Looking up the place and forecast…';
    delete status.dataset.kind;
    result.hidden = true;

    try {
      const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geocodeUrl.search = new URLSearchParams({ name: place, count: '1', language: 'en', format: 'json' });
      const geocoding = await getJson(geocodeUrl, signal);
      if (!geocoding.results?.length) {
        status.textContent = `No matching place was found for “${place}”. Try adding a region or country.`;
        status.dataset.kind = 'error';
        return;
      }

      const location = geocoding.results[0];
      const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
      forecastUrl.search = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        forecast_days: '3',
        timezone: 'auto'
      });
      const forecast = await getJson(forecastUrl, signal);
      if (!forecast.current || !forecast.daily ||
        !Number.isFinite(forecast.current.temperature_2m) ||
        !Number.isFinite(forecast.current.apparent_temperature) ||
        !Number.isFinite(forecast.current.relative_humidity_2m) ||
        !Number.isFinite(forecast.current.wind_speed_10m) ||
        !Array.isArray(forecast.daily.time) || forecast.daily.time.length !== 3 ||
        !Array.isArray(forecast.daily.weather_code) ||
        !Array.isArray(forecast.daily.temperature_2m_min) ||
        !Array.isArray(forecast.daily.temperature_2m_max)) {
        throw new Error('The weather response was incomplete.');
      }
      render(location, forecast);
      status.textContent = `Forecast for ${location.name}.`;
    } catch (error) {
      if (error.name === 'AbortError') return;
      status.textContent = error instanceof TypeError
        ? 'Could not reach the weather service. Check your connection and try again.'
        : `Could not load this forecast: ${error.message}`;
      status.dataset.kind = 'error';
      console.error('Weather lookup failed.', error);
    }
  });
})();
