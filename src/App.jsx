import { useState, useEffect } from "react";
import { useWeather } from "./hooks/useWeather";

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem("weather-recent")) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeCity, setActiveCity] = useState("Los Baños");
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const { data, loading, error, fetchWeather } = useWeather();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("weather-theme");
      if (saved !== null) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("weather-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("weather-theme", "light");
    }
  }, [isDarkMode]);

  // AUTO-UPDATE LOGIC: Fetches data for the active city and refreshes every 15 minutes
 useEffect(() => {
    fetchWeather("Los Baños"); // <-- Update this

    const refreshInterval = setInterval(() => {
      fetchWeather(activeCity);
    }, 15 * 60 * 1000); 

    return () => clearInterval(refreshInterval);
  }, [activeCity, fetchWeather]);

  useEffect(() => {
    localStorage.setItem("weather-recent", JSON.stringify(recentSearches));
  }, [recentSearches]);

  function handleSearch(e, searchCity = query) {
    if (e) e.preventDefault();
    if (!searchCity.trim()) return;

    // Setting the active city automatically triggers the useEffect above to fetch fresh data
    setActiveCity(searchCity);
    
    setRecentSearches((prev) => {
      const filtered = prev.filter(c => c.toLowerCase() !== searchCity.toLowerCase());
      return [searchCity, ...filtered].slice(0, 4); 
    });
    setQuery("");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col p-4 md:p-8">
      
      {/* Search Header */}
      <header className="mb-8 flex w-full max-w-2xl items-start gap-4">
        <div className="w-full flex-1">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <span className="absolute left-5 text-xl text-slate-400">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a city..."
              className="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-14 pr-5 text-sm text-slate-900 shadow-sm placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:shadow-xl dark:focus:bg-slate-800"
            />
          </form>
          
          {recentSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recent:</span>
              {recentSearches.map(city => (
                <button 
                  key={city}
                  onClick={() => handleSearch(null, city)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:shadow-xl dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-slate-700" />
          <p className="text-sm font-medium tracking-wide">Analyzing atmospheric data...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-2xl rounded-2xl border border-red-500/30 bg-red-50/50 p-6 text-red-700 backdrop-blur-md dark:bg-red-500/10 dark:text-red-200">
          <h3 className="mb-1 font-bold">Search Failed</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Bento Box Dashboard */}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 lg:grid-cols-3 lg:gap-6">
          
          {/* Main Weather Card */}
          <section className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800/40 dark:shadow-2xl lg:col-span-2 lg:row-span-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                {data.city}
              </h1>
              <p className="mt-2 text-lg font-medium text-slate-500 dark:text-slate-400">
                {data.current.text}
              </p>
            </div>
            
            <div className="mt-12 flex items-end justify-between">
              <span className="text-[100px] font-black leading-none tracking-tighter text-slate-900 dark:text-white md:text-[140px]">
                {data.current.temp}°
              </span>
              <span className="text-7xl drop-shadow-lg dark:drop-shadow-2xl md:text-8xl">
                {data.current.icon}
              </span>
            </div>
          </section>

          {/* Detailed Metrics Grid */}
          <section className="grid grid-cols-2 gap-4 lg:col-span-1">
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-700 dark:bg-slate-800/40">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Feels Like</span>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.current.feelsLike}°</span>
            </div>
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-700 dark:bg-slate-800/40">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">UV Index</span>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.details.uvIndex}</span>
            </div>
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-700 dark:bg-slate-800/40">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Humidity</span>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.current.humidity}%</span>
            </div>
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-700 dark:bg-slate-800/40">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Wind</span>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.current.wind} <span className="text-sm text-slate-500 dark:text-slate-400">km/h</span></span>
            </div>
          </section>

          {/* Sunrise / Sunset */}
          <section className="flex items-center justify-around rounded-3xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-700 dark:bg-slate-800/40 lg:col-span-1">
             <div className="flex flex-col items-center gap-2">
               <span className="text-2xl">🌅</span>
               <span className="text-sm font-bold text-slate-900 dark:text-white">{data.details.sunrise}</span>
             </div>
             <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
             <div className="flex flex-col items-center gap-2">
               <span className="text-2xl">🌇</span>
               <span className="text-sm font-bold text-slate-900 dark:text-white">{data.details.sunset}</span>
             </div>
          </section>

          {/* 24-Hour Forecast */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-700 dark:bg-slate-800/40 lg:col-span-2">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Today</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
              {data.hourly.map((hour, i) => (
                <div key={i} className="flex min-w-20 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 transition-colors dark:bg-slate-900/50">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{i === 0 ? 'Now' : hour.time}</span>
                  <span className="text-2xl">{hour.condition.icon}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{hour.temp}°</span>
                </div>
              ))}
            </div>
          </section>

          {/* 7-Day Forecast */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-700 dark:bg-slate-800/40 lg:col-span-1">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">7-Day Forecast</h2>
            <div className="flex flex-col gap-1">
              {data.forecast.map((day, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <span className="w-12 text-sm font-medium text-slate-700 dark:text-slate-300">{i === 0 ? 'Today' : day.date}</span>
                  <div className="flex items-center gap-2">
                    <span>{day.condition.icon}</span>
                    <span className="hidden w-24 text-xs text-slate-500 dark:text-slate-400 sm:block">{day.condition.text}</span>
                  </div>
                  <div className="flex w-16 justify-end gap-2 text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">{day.max}°</span>
                    <span className="text-slate-500">{day.min}°</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </main>
  );
}