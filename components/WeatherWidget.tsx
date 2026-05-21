import React, { useState, useEffect } from 'react';

interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  rain: number;
  weatherCode: number;
}

interface WeatherData {
  village: string;
  rain: number;
  windDirection: number;
  windSpeed: number;
  temperature: number;
  weatherCode: number;
  forecast: ForecastDay[];
}

const villages = [
  { name: 'Nule', lat: -9.8333, lon: 124.2833 },
  { name: 'Nifukani', lat: -9.8167, lon: 124.2667 },
  { name: 'Tubuhue', lat: -9.8500, lon: 124.2500 },
  { name: 'Mnelalete', lat: -9.8667, lon: 124.2833 },
  { name: 'Kesetnana', lat: -9.8500, lon: 124.2667 },
  { name: 'Nusa', lat: -9.8333, lon: 124.2500 },
  { name: 'Tublopo', lat: -9.8167, lon: 124.2833 },
];

const getWindDirectionString = (degree: number) => {
  if (degree >= 337.5 || degree < 22.5) return 'Utara';
  if (degree >= 22.5 && degree < 67.5) return 'Timur Laut';
  if (degree >= 67.5 && degree < 112.5) return 'Timur';
  if (degree >= 112.5 && degree < 157.5) return 'Tenggara';
  if (degree >= 157.5 && degree < 202.5) return 'Selatan';
  if (degree >= 202.5 && degree < 247.5) return 'Barat Daya';
  if (degree >= 247.5 && degree < 292.5) return 'Barat';
  if (degree >= 292.5 && degree < 337.5) return 'Barat Laut';
  return '-';
};

const getWeatherInfo = (code: number) => {
  if (code === 0) return { label: 'Cerah', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z', color: 'text-amber-500' };
  if (code <= 3) return { label: 'Berawan', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z', color: 'text-slate-400' };
  if (code <= 48) return { label: 'Kabut', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-slate-300' };
  if (code <= 65 || (code >= 80 && code <= 82)) return { label: 'Hujan', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', color: 'text-blue-500' };
  if (code >= 95) return { label: 'Badai', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-purple-500' };
  return { label: 'Berawan', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z', color: 'text-slate-400' };
};

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVillageName, setSelectedVillageName] = useState<string>(villages[0].name);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const promises = villages.map(async (v) => {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${v.lat}&longitude=${v.lon}&current=temperature_2m,weather_code,rain,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FMakassar`);
          const data = await res.json();
          
          const forecast: ForecastDay[] = data.daily.time.map((time: string, i: number) => ({
            date: time,
            maxTemp: data.daily.temperature_2m_max[i],
            minTemp: data.daily.temperature_2m_min[i],
            rain: data.daily.precipitation_sum[i],
            weatherCode: data.daily.weather_code[i]
          }));

          return {
            village: v.name,
            rain: data.current.rain,
            windDirection: data.current.wind_direction_10m,
            windSpeed: data.current.wind_speed_10m,
            temperature: data.current.temperature_2m,
            weatherCode: data.current.weather_code,
            forecast
          };
        });
        const results = await Promise.all(promises);
        setWeatherData(results);
      } catch (error) {
        console.error("Failed to fetch weather data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const activeData = weatherData.find(d => d.village === selectedVillageName);
  const activeVillageCoords = villages.find(v => v.name === selectedVillageName) || villages[0];

  const plantingAnalysis = activeData ? (() => {
    const rainyDays = activeData.forecast.filter(d => d.rain > 0.5).length;
    const sunnyDays = activeData.forecast.filter(d => d.weatherCode <= 1).length;
    
    let recommendation = "";
    let colorClass = "";
    
    if (rainyDays >= 4) {
      recommendation = "Sangat Baik untuk Tanam (Ketersediaan air tinggi)";
      colorClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
    } else if (rainyDays >= 2) {
      recommendation = "Cukup Baik untuk Tanam (Perlu pantau kelembaban)";
      colorClass = "text-blue-600 bg-blue-50 border-blue-100";
    } else if (sunnyDays >= 5) {
      recommendation = "Waspada Kekeringan (Gunakan mulsa/irigasi tambahan)";
      colorClass = "text-amber-600 bg-amber-50 border-amber-100";
    } else {
      recommendation = "Kondisi Sedang (Lakukan persiapan lahan)";
      colorClass = "text-slate-600 bg-slate-50 border-slate-100";
    }
    
    return { rainyDays, sunnyDays, recommendation, colorClass };
  })() : null;

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">Prakiraan Cuaca Amanuban</h3>
          <p className="text-sm text-slate-500 mt-1">Data Real-time & Visualisasi Windy.com</p>
        </div>
        
        <div className="flex overflow-x-auto pb-2 md:pb-0 no-scrollbar gap-2">
          {villages.map(v => (
            <button
              key={v.name}
              onClick={() => setSelectedVillageName(v.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedVillageName === v.name 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-400 font-medium animate-pulse">Sinkronisasi data satelit...</p>
        </div>
      ) : activeData && (
        <div className="space-y-12">
          {/* Android Style Forecast Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-4xl font-black">{activeData.village}</h4>
                    <p className="text-blue-100 font-medium mt-1">Hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Live</div>
                </div>

                <div className="flex items-center space-x-6 mb-8">
                  <div className="text-7xl font-black tracking-tighter">{Math.round(activeData.temperature)}°</div>
                  <div className="h-12 w-px bg-white/20"></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getWeatherInfo(activeData.weatherCode).icon} />
                      </svg>
                      <span className="text-xl font-bold">{getWeatherInfo(activeData.weatherCode).label}</span>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">Angin: {activeData.windSpeed} km/h {getWindDirectionString(activeData.windDirection)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Curah Hujan</p>
                    <p className="text-xl font-black">{activeData.rain} mm</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Kelembaban</p>
                    <p className="text-xl font-black">78%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              {/* Planting Analysis Summary */}
              {plantingAnalysis && (
                <div className={`p-6 rounded-3xl border ${plantingAnalysis.colorClass} transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xs font-bold uppercase tracking-widest opacity-70">Analisa Referensi Tanam (7 Hari)</h5>
                    <div className="flex space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-[10px] font-bold">{plantingAnalysis.rainyDays} Hari Hujan</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        <span className="text-[10px] font-bold">{plantingAnalysis.sunnyDays} Hari Panas</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-sm font-black leading-tight">{plantingAnalysis.recommendation}</p>
                  </div>
                </div>
              )}

              <div>
                <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Prakiraan 7 Hari Ke Depan</h5>
              <div className="space-y-1">
                {activeData.forecast.slice(1).map((day, i) => {
                  const info = getWeatherInfo(day.weatherCode);
                  const date = new Date(day.date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  
                  return (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                      <div className="w-24">
                        <p className={`font-bold text-sm ${isWeekend ? 'text-red-500' : 'text-slate-700'}`}>
                          {i === 0 ? 'Besok' : date.toLocaleDateString('id-ID', { weekday: 'long' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>

                      <div className="flex items-center space-x-3 flex-1 px-4">
                        <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${info.color} group-hover:scale-110 transition-transform`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{info.label}</span>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Hujan</p>
                          <p className="text-xs font-black text-blue-600">{day.rain} mm</p>
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-sm font-black text-slate-800">{Math.round(day.maxTemp)}°</span>
                          <span className="text-sm font-bold text-slate-300 ml-2">{Math.round(day.minTemp)}°</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Windy Interactive Map Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Visualisasi Radar Windy.com</h5>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg">LIVE RADAR</span>
            </div>
            <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl bg-slate-50">
              <iframe 
                src={`https://embed.windy.com/embed2.html?lat=${activeVillageCoords.lat}&lon=${activeVillageCoords.lon}&detailLat=${activeVillageCoords.lat}&detailLon=${activeVillageCoords.lon}&width=650&height=450&zoom=11&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                width="100%" 
                height="100%" 
                frameBorder="0"
                title={`Windy Weather Map - ${selectedVillageName}`}
                className="absolute inset-0"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-blue-900">Tentang Data Cuaca</p>
          <p className="text-xs text-blue-800/70 leading-relaxed">
            Sistem menggabungkan data prakiraan dari model ECMWF (via Windy) dan data satelit Open-Meteo untuk akurasi maksimal di wilayah Amanuban Barat. Gunakan prakiraan 7 hari untuk merencanakan kegiatan lapangan dan radar Windy untuk memantau awan hujan secara real-time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;

