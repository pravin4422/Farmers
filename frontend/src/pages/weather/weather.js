import React, { useEffect, useState, useCallback } from 'react';
import '../../css/weather/weather.css';

const WEATHER_API_KEY = "57c5313ef9bbc7952384da096d3005a9";

function Weather() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [news, setNews] = useState([]);
  const [weatherNews, setWeatherNews] = useState([]);
  const [tamilNaduNews, setTamilNaduNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [weatherNewsLoading, setWeatherNewsLoading] = useState(false);
  const [tnNewsLoading, setTnNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ta');
  const [lastNewsUpdate, setLastNewsUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // News categories
  const newsCategories = [
    { value: 'all', label: { en: 'All News', ta: 'அனைத்து செய்திகள்' } },
    { value: 'national', label: { en: 'National', ta: 'தேசிய' } },
    { value: 'business', label: { en: 'Business', ta: 'வணிகம்' } },
    { value: 'sports', label: { en: 'Sports', ta: 'விளையாட்டு' } },
    { value: 'technology', label: { en: 'Technology', ta: 'தொழில்நுட்பம்' } },
    { value: 'entertainment', label: { en: 'Entertainment', ta: 'பொழுதுபோக்கு' } }
  ];

  // Fetch Tamil Nadu specific news
  const fetchTamilNaduNews = useCallback(async (showLoader = true) => {
    if (showLoader) setTnNewsLoading(true);
    
    try {
      const tnNewsSources = [
        {
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss',
          parser: (data) => data.status === 'ok' ? data.items.slice(0, 8).map(article => ({
            title: article.title,
            content: article.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            url: article.link,
            imageUrl: article.thumbnail || article.enclosure?.link,
            date: new Date(article.pubDate).toLocaleDateString(),
            time: new Date(article.pubDate).toLocaleTimeString(),
            author: article.author || 'The Hindu',
            source: 'The Hindu - Tamil Nadu'
          })) : []
        },
        {
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/dinamalar/tamil-nadu',
          parser: (data) => data.status === 'ok' ? data.items.slice(0, 6).map(article => ({
            title: article.title,
            content: article.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            url: article.link,
            imageUrl: article.thumbnail,
            date: new Date(article.pubDate).toLocaleDateString(),
            time: new Date(article.pubDate).toLocaleTimeString(),
            author: 'Dinamalar',
            source: 'Dinamalar'
          })) : []
        }
      ];

      let tnNewsData = [];
      
      for (const source of tnNewsSources) {
        try {
          const response = await fetch(source.url);
          const data = await response.json();
          const parsed = source.parser(data);
          tnNewsData = [...tnNewsData, ...parsed];
        } catch (error) {
          console.log(`Failed to fetch from ${source.url}:`, error);
        }
      }

      if (tnNewsData.length === 0) {
        tnNewsData = [
          {
            title: lang === 'ta' ? 'தமிழ்நாடு செய்திகள் தற்காலிகமாக இல்லை' : 'Tamil Nadu news temporarily unavailable',
            content: lang === 'ta' ? 'தயவுசெய்து பின்னர் முயற்சிக்கவும்' : 'Please try again later',
            source: 'System',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
          }
        ];
      }

      setTamilNaduNews(tnNewsData.slice(0, 10));
      
    } catch (error) {
      console.error('Tamil Nadu news fetch error:', error);
      setTamilNaduNews([
        {
          title: lang === 'ta' ? 'தமிழ்நாடு செய்திகள் ஏற்ற முடியவில்லை' : 'Failed to load Tamil Nadu news',
          content: lang === 'ta' ? 'தயவுசெய்து பின்னர் முயற்சிக்கவும்' : 'Please try again later',
          source: 'System',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      if (showLoader) setTnNewsLoading(false);
    }
  }, [lang]);

  // Fetch weather-related news
  const fetchWeatherNews = useCallback(async (showLoader = true) => {
    if (showLoader) setWeatherNewsLoading(true);
    
    try {
      const weatherNewsSources = [
        {
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://rss.cnn.com/rss/edition.rss',
          parser: (data) => data.status === 'ok' ? data.items
            .filter(item => 
              item.title.toLowerCase().includes('weather') || 
              item.title.toLowerCase().includes('storm') ||
              item.title.toLowerCase().includes('rain') ||
              item.title.toLowerCase().includes('cyclone') ||
              item.title.toLowerCase().includes('temperature') ||
              item.title.toLowerCase().includes('climate') ||
              item.description?.toLowerCase().includes('weather') ||
              item.description?.toLowerCase().includes('monsoon')
            )
            .slice(0, 5)
            .map(article => ({
              title: article.title,
              content: article.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
              url: article.link,
              imageUrl: article.thumbnail,
              date: new Date(article.pubDate).toLocaleDateString(),
              time: new Date(article.pubDate).toLocaleTimeString(),
              author: 'CNN',
              source: 'CNN Weather'
            })) : []
        },
        {
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/ndtvnews-latest',
          parser: (data) => data.status === 'ok' ? data.items
            .filter(item => 
              item.title.toLowerCase().includes('weather') || 
              item.title.toLowerCase().includes('rain') ||
              item.title.toLowerCase().includes('monsoon') ||
              item.title.toLowerCase().includes('cyclone') ||
              item.title.toLowerCase().includes('imd') ||
              item.description?.toLowerCase().includes('weather')
            )
            .slice(0, 5)
            .map(article => ({
              title: article.title,
              content: article.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
              url: article.link,
              imageUrl: article.thumbnail,
              date: new Date(article.pubDate).toLocaleDateString(),
              time: new Date(article.pubDate).toLocaleTimeString(),
              author: 'NDTV',
              source: 'NDTV Weather'
            })) : []
        }
      ];

      let weatherNewsData = [];
      
      for (const source of weatherNewsSources) {
        try {
          const response = await fetch(source.url);
          const data = await response.json();
          const parsed = source.parser(data);
          weatherNewsData = [...weatherNewsData, ...parsed];
        } catch (error) {
          console.log(`Failed to fetch weather news from ${source.url}:`, error);
        }
      }

      if (weatherNewsData.length === 0) {
        weatherNewsData = [
          {
            title: lang === 'ta' ? 'வானிலை செய்திகள் தற்காலிகமாக இல்லை' : 'Weather news temporarily unavailable',
            content: lang === 'ta' ? 'தயவுசெய்து பின்னர் முயற்சிக்கவும்' : 'Please try again later',
            source: 'System',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
          }
        ];
      }

      setWeatherNews(weatherNewsData.slice(0, 8));
      
    } catch (error) {
      console.error('Weather news fetch error:', error);
      setWeatherNews([
        {
          title: lang === 'ta' ? 'வானிலை செய்திகள் ஏற்ற முடியவில்லை' : 'Failed to load weather news',
          content: lang === 'ta' ? 'தயவுசெய்து பின்னர் முயற்சிக்கவும்' : 'Please try again later',
          source: 'System',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      if (showLoader) setWeatherNewsLoading(false);
    }
  }, [lang]);

  // Fetch general news
  const fetchNews = useCallback(async (category = 'all', showLoader = true) => {
    if (showLoader) setNewsLoading(true);
    setNewsError('');
    
    try {
      const newsAPIs = [
        {
          url: `https://inshortsapi.vercel.app/news?category=${category === 'all' ? 'national' : category}`,
          parser: (data) => data.success ? data.data.map(article => ({
            title: article.title,
            content: article.content,
            url: article.readMoreUrl,
            imageUrl: article.imageUrl,
            date: article.date,
            time: article.time,
            author: article.author,
            source: 'Inshorts'
          })) : []
        },
        {
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/ndtvnews-top-stories',
          parser: (data) => data.status === 'ok' ? data.items.slice(0, 10).map(article => ({
            title: article.title,
            content: article.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            url: article.link,
            imageUrl: article.thumbnail,
            date: new Date(article.pubDate).toLocaleDateString(),
            time: new Date(article.pubDate).toLocaleTimeString(),
            author: article.author || 'NDTV',
            source: 'NDTV'
          })) : []
        }
      ];

      let newsData = [];
      
      try {
        const response = await fetch(newsAPIs[0].url);
        const data = await response.json();
        newsData = newsAPIs[0].parser(data);
      } catch (primaryError) {
        console.log('Primary news source failed, trying backup...');
        try {
          const response = await fetch(newsAPIs[1].url);
          const data = await response.json();
          newsData = newsAPIs[1].parser(data);
        } catch (backupError) {
          throw new Error('All news sources failed');
        }
      }

      if (newsData.length === 0) {
        throw new Error('No news data available');
      }

      setNews(newsData);
      setLastNewsUpdate(new Date());
      
    } catch (error) {
      console.error('News fetch error:', error);
      setNewsError(lang === 'ta' ? 'செய்திகளை ஏற்ற முடியவில்லை' : 'Failed to load news');
      
      setNews([
        {
          title: lang === 'ta' ? 'செய்தி சேவை தற்காலிகமாக கிடைக்கவில்லை' : 'News service temporarily unavailable',
          content: lang === 'ta' ? 'தயவுசெய்து பின்னர் முயற்சிக்கவும்' : 'Please try again later',
          source: 'System',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      if (showLoader) setNewsLoading(false);
    }
  }, [lang]);

  // Auto-refresh all news every 10 minutes
  useEffect(() => {
    fetchNews(selectedNewsCategory);
    fetchWeatherNews();
    fetchTamilNaduNews();
    
    const newsInterval = setInterval(() => {
      fetchNews(selectedNewsCategory, false);
      fetchWeatherNews(false);
      fetchTamilNaduNews(false);
    }, 10 * 60 * 1000);

    return () => clearInterval(newsInterval);
  }, [selectedNewsCategory, fetchNews, fetchWeatherNews, fetchTamilNaduNews]);

  // Get user location and weather
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async ({ coords }) => {
      const { latitude, longitude } = coords;
      try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_KEY}`);
        const geoData = await geoRes.json();
        if (geoData[0]?.name) {
          setCity(geoData[0].name);
          fetchAll(geoData[0].name, latitude, longitude);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }, []);

  const fetchAll = async (inputCity, lat = null, lon = null) => {
    if (!inputCity?.trim()) {
      setError(lang === 'ta' ? 'நகரத்தின் பெயரை உள்ளிடவும்' : 'Please enter city name');
      setWeather(null);
      setForecast(null);
      setAlerts([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(inputCity)}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
      const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(inputCity)}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;

      const weatherRes = await fetch(weatherURL);
      const forecastRes = await fetch(forecastURL);

      if (!weatherRes.ok) throw new Error('City not found');
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);

      const latFinal = lat || weatherData.coord.lat;
      const lonFinal = lon || weatherData.coord.lon;

      const alertURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${latFinal}&lon=${lonFinal}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
      const alertRes = await fetch(alertURL);
      const alertData = await alertRes.json();
      setAlerts(alertData.alerts || []);
    } catch (e) {
      setError(e.message);
      setWeather(null);
      setForecast(null);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
    recognition.onresult = (e) => {
      const heard = e.results[0][0].transcript;
      setCity(heard);
      fetchAll(heard);
    };
    recognition.start();
  };

  const refreshAllNews = () => {
    fetchNews(selectedNewsCategory);
    fetchWeatherNews();
    fetchTamilNaduNews();
  };

  const t = {
    ta: {
      title: 'வானிலை தகவல்',
      placeholder: 'நகரத்தின் பெயரை உள்ளிடவும்',
      getWeather: 'வானிலை பெறுக',
      loading: 'ஏற்றுகிறது...',
      temp: 'வெப்பநிலை',
      cond: 'நிலை',
      hum: 'ஈரப்பதம்',
      wind: 'காற்று வேகம்',
      toggle: 'English',
      newsLoading: 'செய்திகளை ஏற்றுகிறது...',
      alerts: 'அவசர எச்சரிக்கை',
      newsTitle: 'நேரலை செய்திகள்',
      weatherNewsTitle: 'வானிலை செய்திகள்',
      tnNewsTitle: 'தமிழ்நாடு செய்திகள்',
      refreshNews: 'செய்திகளை புதுப்பி',
      lastUpdated: 'கடைசியாக புதுப்பிக்கப்பட்டது',
      readMore: 'மேலும் படிக்க',
      newsCategory: 'செய்தி வகை',
      generalNews: 'பொது செய்திகள்',
      weatherNews: 'வானிலை செய்திகள்',
      tamilNaduNews: 'தமிழ்நாடு செய்திகள்'
    },
    en: {
      title: 'Weather Info',
      placeholder: 'Enter city name',
      getWeather: 'Get Weather',
      loading: 'Loading...',
      temp: 'Temperature',
      cond: 'Condition',
      hum: 'Humidity',
      wind: 'Wind Speed',
      toggle: 'தமிழ்',
      newsLoading: 'Loading news...',
      alerts: 'Weather Alerts',
      newsTitle: 'Live News',
      weatherNewsTitle: 'Weather News',
      tnNewsTitle: 'Tamil Nadu News',
      refreshNews: 'Refresh News',
      lastUpdated: 'Last updated',
      readMore: 'Read More',
      newsCategory: 'News Category',
      generalNews: 'General News',
      weatherNews: 'Weather News',
      tamilNaduNews: 'Tamil Nadu News'
    },
  }[lang];

  const renderNewsCards = (newsData, loading) => {
    if (loading) return <p className="loading-text">{t.newsLoading}</p>;
    if (newsData.length === 0) return <p className="no-news">No news available</p>;
    
    return (
      <div className="news-grid">
        {newsData.slice(0, 6).map((article, index) => (
          <div key={index} className="news-card">
            {article.imageUrl && (
              <img 
                src={article.imageUrl} 
                alt="" 
                className="news-image"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <div className="news-content">
              <h4 className="news-title">{article.title}</h4>
              {article.content && (
                <p className="news-description">{article.content}</p>
              )}
              <div className="news-meta">
                <span className="news-source">{article.source}</span>
                <span className="news-time">{article.date} {article.time}</span>
              </div>
              {article.url && (
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="read-more-link"
                >
                  {t.readMore} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="weather-container">
      <div className="weather-header">
        <h2 className="weather-main-title">{t.title}</h2>
        <button className="lang-toggle" onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}>
          {t.toggle}
        </button>
      </div>

      {/* Enhanced News Section with Tabs */}
      <div className="news-section">
        <div className="news-section-header">
          <h3 className="news-section-title">{t.newsTitle}</h3>
          <button onClick={refreshAllNews} className="refresh-btn">
            {t.refreshNews}
          </button>
        </div>

        {lastNewsUpdate && (
          <p className="last-updated">
            {t.lastUpdated}: {lastNewsUpdate.toLocaleTimeString()}
          </p>
        )}

        {/* News Tabs */}
        <div className="news-tabs">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            {t.generalNews}
          </button>
          <button 
            className={`tab-button ${activeTab === 'weather' ? 'active' : ''}`}
            onClick={() => setActiveTab('weather')}
          >
            {t.weatherNews}
          </button>
          <button 
            className={`tab-button ${activeTab === 'tamilnadu' ? 'active' : ''}`}
            onClick={() => setActiveTab('tamilnadu')}
          >
            {t.tamilNaduNews}
          </button>
        </div>

        {/* General News Tab */}
        {activeTab === 'general' && (
          <div className="tab-content">
            <div className="news-controls">
              <select 
                value={selectedNewsCategory} 
                onChange={(e) => setSelectedNewsCategory(e.target.value)}
                className="news-category-select"
              >
                {newsCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flash-news">
              <marquee>
                {newsLoading ? t.newsLoading : 
                 newsError ? newsError :
                 news.length > 0 ? news.map(n => n.title).join(' | ') : 
                 'No news available'}
              </marquee>
            </div>

            <div className="news-cards">
              {newsError && <p className="error-message">{newsError}</p>}
              {renderNewsCards(news, newsLoading)}
            </div>
          </div>
        )}

        {/* Weather News Tab */}
        {activeTab === 'weather' && (
          <div className="tab-content">
            <div className="flash-news">
              <marquee>
                {weatherNewsLoading ? t.newsLoading : 
                 weatherNews.length > 0 ? weatherNews.map(n => n.title).join(' | ') : 
                 'No weather news available'}
              </marquee>
            </div>
            <div className="news-cards">
              {renderNewsCards(weatherNews, weatherNewsLoading)}
            </div>
          </div>
        )}

        {/* Tamil Nadu News Tab */}
        {activeTab === 'tamilnadu' && (
          <div className="tab-content">
            <div className="flash-news">
              <marquee>
                {tnNewsLoading ? t.newsLoading : 
                 tamilNaduNews.length > 0 ? tamilNaduNews.map(n => n.title).join(' | ') : 
                 'No Tamil Nadu news available'}
              </marquee>
            </div>
            <div className="news-cards">
              {renderNewsCards(tamilNaduNews, tnNewsLoading)}
            </div>
          </div>
        )}
      </div>

      {/* Weather Section */}
      <div className="weather-search-section">
        <div className="input-row">
          <input
            value={city}
            placeholder={t.placeholder}
            onChange={e => setCity(e.target.value)}
            className="city-input"
          />
          <button onClick={() => fetchAll(city)} className="get-weather-btn">
            {t.getWeather}
          </button>
          <button onClick={handleVoice} className="voice-btn">🎤</button>
        </div>

        {loading && <p className="loading-text">{t.loading}</p>}
        {error && <p className="error-message">{error}</p>}

        {alerts.length > 0 && (
          <div className="alert-box">
            <h3 className="alert-title">{t.alerts}</h3>
            {alerts.map((a, i) => (
              <div key={i} className="alert-item">
                <strong>{a.event}</strong>
                <p>{a.description}</p>
              </div>
            ))}
          </div>
        )}

        {weather && (
          <div className="weather-result">
            <h3 className="weather-location">{weather.name}, {weather.sys.country}</h3>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt="weather icon"
              className="weather-icon"
            />
            <div className="weather-details">
              <p><strong>{t.temp}:</strong> {weather.main.temp.toFixed(1)} °C</p>
              <p><strong>{t.cond}:</strong> {weather.weather[0].description}</p>
              <p><strong>{t.hum}:</strong> {weather.main.humidity} %</p>
              <p><strong>{t.wind}:</strong> {weather.wind.speed} km/h</p>
            </div>
          </div>
        )}

        {forecast && (
          <div className="forecast-container">
            {forecast.list
              .filter((_, i) => i % 8 === 0)
              .slice(0, 5)
              .map((f, idx) => (
                <div key={idx} className="forecast-day">
                  <p className="forecast-date">
                    {new Date(f.dt * 1000).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
                      weekday: 'short', day: 'numeric'
                    })}
                  </p>
                  <img
                    src={`https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png`}
                    alt="forecast icon"
                    className="forecast-icon"
                  />
                  <p className="forecast-temp">{f.main.temp.toFixed(1)}°C</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Weather;