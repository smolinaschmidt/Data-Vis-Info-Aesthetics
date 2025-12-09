let chartInitialized = false;
let mapInitialized = false;
let allData = [];
let countryDataMap = {}; 
let svg, x, y, color, size, tooltip, width, margin;

mapboxgl.accessToken = 'pk.eyJ1IjoibW9saXM3MjYiLCJhIjoiY21oeHFrNGxhMDEzYzJrcHk0czJqejVlbCJ9.qLIfPy7V7FfgnEWg6CPQcA'; 

// TMDB API Configuration
const TMDB_API_KEY = '18dea89aea654fde541b73b5f34e97da';

// TMDB API Configuration - OBTÉN UNA NUEVA API KEY GRATUITA AQUÍ: https://www.themoviedb.org/settings/api
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w300';

let currentGlobalFilter = 'All';
let currentSearchTerm = '';
const SERIES_ROW_HEIGHT = 30; 

const ROMAN_TO_INT = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
    'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25, 'XXVI': 26, 'XXVII': 27, 'XXVIII': 28
};
const romanRegex = new RegExp(`\\s+(${Object.keys(ROMAN_TO_INT).join('|')})$`, 'i');

const countryCoordinates = {
    "United States": [-95.7129, 37.0902], "Spain": [-3.7492, 40.4637], "Canada": [-106.3468, 56.1304],
    "Brazil": [-51.9253, -14.2350], "Germany": [10.4515, 51.1657], "Italy": [12.5674, 41.8719],
    "Japan": [138.2529, 36.2048], "United Kingdom": [-3.4360, 55.3781], "Poland": [19.1451, 51.9194],
    "South Korea": [127.7669, 35.9078], "Malaysia": [101.9758, 4.2105], "Ireland": [-7.6921, 53.1424],
    "Belgium": [4.4699, 50.5039], "Mexico": [-102.5528, 23.6345], "India": [78.9629, 20.5937],
    "Russia": [105.3188, 61.5240], "Finland": [25.7482, 61.9241], "France": [2.2137, 46.2276],
    "Colombia": [-74.2973, 4.5709], "Turkey": [35.2433, 38.9637], "Australia": [133.7751, -25.2744],
    "South Africa": [22.9375, -30.5595], "China": [104.1954, 35.8617], "Israel": [34.8516, 31.0461],
    "Jordan": [36.2384, 30.5852], "Norway": [8.4689, 60.4720], "Denmark": [9.5018, 56.2639],
    "Philippines": [121.7740, 12.8797], "Argentina": [-63.6167, -38.4161], "Chile": [-71.5430, -35.6751],
    "Taiwan": [120.9605, 23.6978], "Thailand": [100.9925, 15.8700], "Sweden": [18.6435, 60.1282],
    "Netherlands": [5.2913, 52.1326], "Saudi Arabia": [45.0792, 23.8859], "Egypt": [30.8025, 26.8206]
};

const countryNameMap = {
    'USA': 'United States',
    'US': 'United States',
    'United States of America': 'United States',
    'U.S.': 'United States',
    'U.S.A.': 'United States',
    'Espana': 'Spain',
    'España': 'Spain',
    'UK': 'United Kingdom',
    'England': 'United Kingdom',
    'South Korea': 'South Korea',
    'Korea': 'South Korea'
};

function normalizeCountryName(countryName) {
    if (!countryName) return 'Unknown';
    let trimmed = countryName.trim();
    

    if (/united\s*[e|s]states/i.test(trimmed) || /^usa$/i.test(trimmed) || /^u\.s\./i.test(trimmed)) {
        return 'United States';
    }

    if (/espa[n|ñ]a/i.test(trimmed)) {
        return 'Spain';
    }

    if (countryNameMap[trimmed]) return countryNameMap[trimmed];

    const lower = trimmed.toLowerCase();
    for (const key in countryNameMap) {
        if (key.toLowerCase() === lower) return countryNameMap[key];
    }
    
    return trimmed;
}

function getCleanSeriesName(name) {
    return name.trim().replace(/\s*:\s*$/, '').trim(); 
}

function getMatchKey(name) {
    return getCleanSeriesName(name).toLowerCase().replace(/\s+/g, ' ').trim();
}

function getBaseSeriesName(title) {
    let cleanTitle = getCleanSeriesName(title);
    cleanTitle = cleanTitle.replace(/:\s*(season|temporada|part|vol|volume|s)\s*\d+.*/i, '');
    cleanTitle = cleanTitle.replace(/\s+(season|temporada|part|vol|volume|s)\s*\d+/gi, '');
    cleanTitle = cleanTitle.replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|XXVI|XXVII|XXVIII)$/i, '');
    cleanTitle = cleanTitle.replace(/\s+\d+$/, '');
    cleanTitle = cleanTitle.replace(/\s*(vol|volume)\.?/gi, '');
    cleanTitle = cleanTitle.replace(/\(\d+\)/g, '');
    cleanTitle = cleanTitle.replace(/\bchapters?\b/gi, '');
    cleanTitle = cleanTitle.replace(/\b(collection|series)\b/gi, '');
    return toTitleCase(cleanTitle.trim());
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showChart() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('chart-page').classList.remove('hidden');
    if (!chartInitialized) {
        initializeDataAndVisuals().then(() => toggleView('chart'));
        chartInitialized = true;
    } else {
        toggleView('chart');
    }
}

function showMapFromLanding() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('chart-page').classList.remove('hidden');
    if (!chartInitialized) {
        initializeDataAndVisuals().then(() => toggleView('map'));
        chartInitialized = true;
    } else {
        toggleView('map');
    }
}

function showLanding() {
    document.getElementById('chart-page').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
}

function toggleView(view) {
    const chartWrapper = document.getElementById('chart-wrapper');
    const mapWrapper = document.getElementById('map-wrapper');
    const chartFilters = document.getElementById('chart-filters');
    const chartBtn = document.getElementById('view-chart-btn');
    const mapBtn = document.getElementById('view-map-btn');

    if (view === 'chart') {
        chartWrapper.classList.remove('hidden');
        mapWrapper.classList.add('hidden');
        chartFilters.style.visibility = 'visible';
        chartBtn.classList.add('active');
        mapBtn.classList.remove('active');
    } else if (view === 'map') {
        chartWrapper.classList.add('hidden');
        mapWrapper.classList.remove('hidden');
        chartFilters.style.visibility = 'hidden';
        chartBtn.classList.remove('active');
        mapBtn.classList.add('active');

        if (!mapInitialized) {
            createDualMaps();
            mapInitialized = true;
        }
        if (mapSeasons) mapSeasons.resize();
        if (mapSeries) mapSeries.resize();
    }
}

function initializeDataAndVisuals() {
    return Promise.all([
        d3.csv("NETFLIX.csv"),
        d3.csv("Country.csv")
    ]).then(function([netflixData, countryData]) {
        console.log("🔍 Checking raw country names in CSVs...");
        
        netflixData.forEach(d => {
            const key = getMatchKey(d.Title);
            const rawCountry = d['Country of Origin'] || d['Country'] || 'Unknown';
            countryDataMap[key] = normalizeCountryName(rawCountry);
        });

        const countryToSeriesMap = {};
        countryData.forEach(d => {
            let rawCountry = (d['Country'] || 'Unknown').trim();
            let country = normalizeCountryName(rawCountry);
            
            if (rawCountry.toLowerCase().includes('united') || rawCountry.toLowerCase().includes('estates')) {
                console.log(`Raw: "${rawCountry}" -> Normalized: "${country}"`);
            }

            if (!countryToSeriesMap[country]) {
                countryToSeriesMap[country] = [];
            }
            countryToSeriesMap[country].push(d.Title);
        });

        window.countryToSeriesMap = countryToSeriesMap;
        
        window.rawNetflixData = netflixData;
        
        console.log("📍 Countries loaded in map:", Object.keys(countryToSeriesMap).sort());
        
        createBubbleChart(netflixData);
        return true;
    }).catch(function(err) {
        console.error("Error loading CSV files:", err);
        alert("Error loading databases");
    });
}

let mapSeasons, mapSeries;

function createDualMaps() {
    const countryCountsSeries = {};
    const countryCountsSeasons = {};

    const rawNetflixData = window.rawNetflixData || [];
    const seasonSet = new Set();
    
    rawNetflixData.forEach(d => {
        const key = getMatchKey(d.Title);
        const country = countryDataMap[key];
        
        if (country && country !== 'Unknown' && countryCoordinates[country]) {
            const seasonRegex = /:\s*Season\s+(\d+)|:\s*Part\s+(\d+)|:\s*S(\d+)/i;
            const romanMatch = d.Title.match(romanRegex);
            let season = 1;
            
            if (romanMatch) {
                season = ROMAN_TO_INT[romanMatch[1].toUpperCase()];
            } else {
                const match = d.Title.match(seasonRegex);
                if (match) {
                    season = parseInt(match[1] || match[2] || match[3]);
                }
            }
            
            const baseName = getBaseSeriesName(d.Title);
            const uniqueKey = `${country}|${baseName}|${season}`;
            
            if (!seasonSet.has(uniqueKey)) {
                seasonSet.add(uniqueKey);
                countryCountsSeasons[country] = (countryCountsSeasons[country] || 0) + 1;
            }
        }
    });

    const countryToSeriesMap = window.countryToSeriesMap || {};
    Object.entries(countryToSeriesMap).forEach(([country, seriesList]) => {
        if (country && country !== 'Unknown' && countryCoordinates[country]) {
            const baseNameToFullName = {};
            seriesList.forEach(seriesName => {
                const baseName = getBaseSeriesName(seriesName);
                if (!baseNameToFullName[baseName]) {
                    baseNameToFullName[baseName] = [];
                }
                baseNameToFullName[baseName].push(seriesName);
            });
            
            let matchedCount = 0;
            Object.keys(baseNameToFullName).forEach(baseName => {
                const hasMatch = rawNetflixData.some(rawEntry => {
                    const rawBaseName = getBaseSeriesName(rawEntry.Title);
                    const rawCountry = countryDataMap[getMatchKey(rawEntry.Title)];
                    return rawCountry === country && rawBaseName === baseName;
                });
                if (hasMatch) {
                    matchedCount++;
                }
            });
            
            countryCountsSeries[country] = matchedCount;
        }
    });

    console.log("SERIES per country (from Country.csv - UNIQUE with NETFLIX.csv match):", countryCountsSeries);
    console.log("SEASONS per country (from NETFLIX.csv - UNIQUE SEASON COMBINATIONS):", countryCountsSeasons);

    const maxSeriesCount = Object.values(countryCountsSeries).length ? Math.max(...Object.values(countryCountsSeries)) : 0;
    const maxSeasonsCount = Object.values(countryCountsSeasons).length ? Math.max(...Object.values(countryCountsSeasons)) : 0;
    const globalMaxCount = Math.max(maxSeriesCount, maxSeasonsCount, 1);
    const radiusStopsSeries = ['interpolate', ['linear'], ['get', 'countSeries'], 0, 0, 1, 12, globalMaxCount, 65];
    const radiusStopsSeasons = ['interpolate', ['linear'], ['get', 'countSeasons'], 0, 0, 1, 12, globalMaxCount, 65];

    const features = [];
    const allCountries = new Set([...Object.keys(countryCountsSeries), ...Object.keys(countryCountsSeasons)]);
    
    allCountries.forEach(country => {
        const coords = countryCoordinates[country];
        if (!coords) return;
        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
                title: country,
                countSeries: countryCountsSeries[country] || 0,
                countSeasons: countryCountsSeasons[country] || 0
            }
        });
    });
    const geojson = { type: 'FeatureCollection', features };

    mapSeries = new mapboxgl.Map({
        container: 'map-series',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-85, 15],
        zoom: 1.8,
        preserveDrawingBuffer: true
    });
    mapSeries.on('load', () => {
        mapSeries.addSource('series-countries-source', { type: 'geojson', data: geojson });
        mapSeries.addLayer({
            id: 'country-circles-series',
            type: 'circle',
            source: 'series-countries-source',
            paint: {
                'circle-color': '#E50914',
                'circle-radius': radiusStopsSeries,
                'circle-opacity': 0.85,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
        mapSeries.addLayer({
            id: 'country-labels-series',
            type: 'symbol',
            source: 'series-countries-source',
            layout: {
                'text-field': ['to-string', ['get', 'countSeries']],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: { 'text-color': '#ffffff' }
        });
        mapSeries.on('click', 'country-circles-series', (e) => {
            openSidePanel(e.features[0].properties.title);
            focusMapsOnCountry(e.features[0].properties.title);
        });
        mapSeries.on('mouseenter', 'country-circles-series', () => mapSeries.getCanvas().style.cursor = 'pointer');
        mapSeries.on('mouseleave', 'country-circles-series', () => mapSeries.getCanvas().style.cursor = '');
    });

    mapSeasons = new mapboxgl.Map({
        container: 'map-seasons',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-85, 15],
        zoom: 1.8,
        preserveDrawingBuffer: true
    });
    mapSeasons.on('load', () => {
        mapSeasons.addSource('seasons-countries', { type: 'geojson', data: geojson });
        mapSeasons.addLayer({
            id: 'country-circles-seasons',
            type: 'circle',
            source: 'seasons-countries',
            paint: {
                'circle-color': 'white', 
                'circle-radius': radiusStopsSeasons,
                'circle-opacity': 0.85,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#E50914'
            }
        });
        mapSeasons.addLayer({
            id: 'country-labels-seasons',
            type: 'symbol',
            source: 'seasons-countries',
            layout: {
                'text-field': ['to-string', ['get', 'countSeasons']],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: { 'text-color': 'black' }
        });
        mapSeasons.on('click', 'country-circles-seasons', (e) => {
            openSidePanel(e.features[0].properties.title);
            focusMapsOnCountry(e.features[0].properties.title);
        });
        mapSeasons.on('mouseenter', 'country-circles-seasons', () => mapSeasons.getCanvas().style.cursor = 'pointer');
        mapSeasons.on('mouseleave', 'country-circles-seasons', () => mapSeasons.getCanvas().style.cursor = '');
    });
}

function focusMapsOnCountry(country) {
    const coords = countryCoordinates[country];
    if (!coords) return;
    const flyOpts = { center: coords, zoom: 3.5, essential: true };
    if (mapSeasons) mapSeasons.flyTo(flyOpts);
    if (mapSeries) mapSeries.flyTo(flyOpts);
}

function openSidePanel(country) {
    const panel = document.getElementById('side-panel');
    const title = document.getElementById('panel-country-title');
    const content = document.getElementById('panel-content');
    const mapWrapper = document.getElementById('map-wrapper');
    
    const countryToSeriesMap = window.countryToSeriesMap || {};
    const rawNetflixData = window.rawNetflixData || [];
    
    console.log(`🔍 Opening panel for: "${country}"`);
    
    if (!countryCoordinates[country]) {
        console.error(`Country "${country}" not found in coordinates! Available countries:`, Object.keys(countryCoordinates));
        return;
    }
    
    let seriesListFromCountry = rawNetflixData
        .filter(d => countryDataMap[getMatchKey(d.Title)] === country)
        .map(d => d.Title);
    
    seriesListFromCountry = [...new Set(seriesListFromCountry)];
    
    console.log(` Raw series found in netflix.csv for ${country}:`, seriesListFromCountry);
    
    if (seriesListFromCountry.length === 0) {
        console.log(` No series found in NETFLIX.csv for ${country}, trying Country.csv...`);
        seriesListFromCountry = countryToSeriesMap[country] || [];
        console.log(` Series from Country.csv for ${country}:`, seriesListFromCountry);
    }
    
    console.log(`📊 Total series found for ${country}: ${seriesListFromCountry.length}`);
    
    if (seriesListFromCountry.length === 0) {
        console.warn(` No series data available for ${country}`);
        title.innerText = country;
        content.innerHTML = '';
        const msg = document.createElement('p');
        msg.style.cssText = 'color: #999; text-align: center; padding: 20px; margin: 0; font-size: 0.9em;';
        msg.innerText = `No series data available for ${country}.`;
        content.appendChild(msg);
        panel.classList.remove('hidden-panel');
        mapWrapper.classList.add('panel-open');
        setTimeout(() => {
            if (mapSeasons) mapSeasons.resize();
            if (mapSeries) mapSeries.resize();
        }, 310);
        return;
    }
    
    const baseNameToFullName = {};
    seriesListFromCountry.forEach(seriesName => {
        const baseName = getBaseSeriesName(seriesName);
        if (!baseNameToFullName[baseName]) {
            baseNameToFullName[baseName] = [];
        }
        baseNameToFullName[baseName].push(seriesName);
    });
    
    const matchedSeriesNames = {};
    Object.keys(baseNameToFullName).forEach(baseName => {
        const hasMatch = rawNetflixData.some(rawEntry => {
            const rawBaseName = getBaseSeriesName(rawEntry.Title);
            const rawCountry = countryDataMap[getMatchKey(rawEntry.Title)];
            return rawCountry === country && rawBaseName === baseName;
        });
        if (hasMatch) {
            matchedSeriesNames[baseName] = baseNameToFullName[baseName][0];
        }
    });

    console.log(` Matched series for ${country}:`, Object.keys(matchedSeriesNames));

    const seriesDataList = [];
    
    Object.entries(matchedSeriesNames).forEach(([baseName, displayName]) => {
        const rawEntries = rawNetflixData.filter(rawEntry => {
            const rawBaseName = getBaseSeriesName(rawEntry.Title);
            const rawCountry = countryDataMap[getMatchKey(rawEntry.Title)];
            return rawCountry === country && rawBaseName === baseName;
        });

        const seasonSet = new Set();
        rawEntries.forEach(entry => {
            const seasonRegex = /:\s*Season\s+(\d+)|:\s*Part\s+(\d+)|:\s*S(\d+)/i;
            const romanMatch = entry.Title.match(seasonRegex);
            let season = 1;
            
            if (romanMatch) {
                season = ROMAN_TO_INT[romanMatch[1].toUpperCase()];
            } else {
                const match = entry.Title.match(seasonRegex);
                if (match) {
                    season = parseInt(match[1] || match[2] || match[3]);
                }
            }
            seasonSet.add(season);
        });

        const seasonCount = seasonSet.size;
        const totalViews = rawEntries.length > 0 ? d3.sum(rawEntries, e => {
            const views = e['Views'] ? parseInt(e['Views'].replace(/,/g, '')) : 0;
            return views;
        }) : 0;
        
        seriesDataList.push({
            displayName: capitalizeFirstLetter(baseName),
            baseName: baseName,
            seasonCount: seasonCount,
            totalViews: totalViews,
            hasData: rawEntries.length > 0
        });
    });

    title.innerText = country;
    content.innerHTML = '';

    if (seriesDataList.length === 0) {
        const msg = document.createElement('p');
        msg.style.cssText = 'color: #999; text-align: center; padding: 20px; margin: 0; font-size: 0.9em;';
        msg.innerText = `No series data available for ${country}.`;
        content.appendChild(msg);
    } else {
        seriesDataList.sort((a, b) => b.totalViews - a.totalViews);
        
        seriesDataList.forEach(seriesData => {
            const div = document.createElement('div');
            div.className = 'series-item';
            div.innerHTML = `
                <span class="series-title">${seriesData.displayName}</span>
                <div class="series-meta">
                    <span class="season-count">${seriesData.seasonCount > 0 ? seriesData.seasonCount + ' Season' + (seriesData.seasonCount > 1 ? 's' : '') : 'No data'}</span>
                </div>
                <div class="series-poster" data-series="${seriesData.displayName}">
                    <img src="" alt="${seriesData.displayName}" style="width:100%; height:auto; border-radius:4px; margin-top:8px; display:none;">
                    <div class="poster-loading">Cargando...</div>
                </div>
            `;
            content.appendChild(div);
            
            fetchSeriesPoster(seriesData.displayName, div.querySelector('.series-poster'));

            div.querySelector('.series-title').addEventListener('click', () => openImdbForSeries(seriesData.displayName));
            div.querySelector('.series-poster').addEventListener('click', () => openImdbForSeries(seriesData.displayName));
        });
    }
    
    panel.classList.remove('hidden-panel');
    mapWrapper.classList.add('panel-open');
    
    setTimeout(() => {
        if (mapSeasons) mapSeasons.resize();
        if (mapSeries) mapSeries.resize();
    }, 310);
}

async function fetchSeriesPoster(seriesName, posterContainer) {
    console.log(`🎬 Fetching poster for: "${seriesName}"`); 
    
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(seriesName)}&language=es-ES`
        );
        
        console.log(`🎬 Response status: ${response.status}`);  

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('API key inválida o expirada. Ve a https://www.themoviedb.org/settings/api para obtener una nueva.');
            } else if (response.status === 429) {
                throw new Error('Demasiadas peticiones. Espera unos minutos.');
            } else {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log(`TMDB data for "${seriesName}":`, data); 
        
        if (data.results && data.results.length > 0) {
            const series = data.results[0];
            const posterPath = series.poster_path;
            
            console.log(`🎬 Found poster path: ${posterPath}`);
            
            if (posterPath) {
                const img = posterContainer.querySelector('img');
                img.src = TMDB_IMAGE_URL + posterPath;
                img.onload = () => {
                    img.style.display = 'block';
                    posterContainer.querySelector('.poster-loading').style.display = 'none';
                    console.log(` Poster loaded for "${seriesName}"`);
                };
                img.onerror = () => {
                    posterContainer.querySelector('.poster-loading').textContent = 'Imagen no disponible';
                    console.error(` Image failed to load for "${seriesName}"`);
                };
            } else {
                posterContainer.querySelector('.poster-loading').textContent = 'Sin imagen';
            }
            
            try {
                const detailResponse = await fetch(
                    `${TMDB_BASE_URL}/tv/${series.id}?api_key=${TMDB_API_KEY}&language=es-ES`
                );
                if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    if (detailData.number_of_seasons) {
                        const seriesItem = posterContainer.closest('.series-item');
                        const metaDiv = seriesItem.querySelector('.series-meta');
                        const seasonSpan = metaDiv.querySelector('span:first-child');
                        const tmdbSeasons = detailData.number_of_seasons;
                        seasonSpan.innerHTML = `${tmdbSeasons} Season${tmdbSeasons !== 1 ? 's' : ''} <span style="font-size:0.7em; color:#666;">(TMDB)</span>`;
                        console.log(` Season info updated for "${seriesName}": ${tmdbSeasons} seasons`);
                    }
                } else {
                    console.warn(` Could not fetch details for "${seriesName}": ${detailResponse.status}`);
                }
            } catch (detailError) {
                console.error(` Detail fetch error for "${seriesName}":`, detailError);
            }
        } else {
            posterContainer.querySelector('.poster-loading').textContent = 'Serie no encontrada';
            console.log(` No results found for "${seriesName}"`);
        }
    } catch (error) {
        console.error(` Error fetching poster for "${seriesName}":`, error.message);
        posterContainer.querySelector('.poster-loading').textContent = `Error: ${error.message}`;
        
        if (error.message.includes('API key')) {
            console.error('🔑 TMDB API Key Issue: La key actual es inválida. Obtén una nueva en https://www.themoviedb.org/settings/api');
        }
    }
}

function closePanel() {
    const panel = document.getElementById('side-panel');
    const mapWrapper = document.getElementById('map-wrapper');
    
    panel.classList.add('hidden-panel');
    mapWrapper.classList.remove('panel-open');
    resetMapsZoom();
    
    setTimeout(() => {
        if (mapSeasons) mapSeasons.resize();
        if (mapSeries) mapSeries.resize();
    }, 310);
}

function resetMapsZoom() {
    const flyOpts = { center: [10, 20], zoom: 1.5, essential: true };
    if (mapSeasons) mapSeasons.flyTo(flyOpts);
    if (mapSeries) mapSeries.flyTo(flyOpts);
}

function createBubbleChart(rawData) {
    margin = { top: 40, right: 40, bottom: 40, left: 280 };
    width = 1600 - margin.left - margin.right; 
    
    d3.select("#bubble-chart").select("svg").remove();
    svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", 1000)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const seasonRegex = /:\s*Season\s+(\d+)|:\s*Part\s+(\d+)|:\s*S(\d+)/i;
    
    const processedData = rawData.map(d => {
        let title = d.Title;
        let base_series_name = title;
        let season = 1; 

        if (base_series_name.includes('//')) base_series_name = base_series_name.split('//')[0].trim();
        title = base_series_name;

        const romanMatch = title.match(romanRegex);
        if (romanMatch) {
            season = ROMAN_TO_INT[romanMatch[1].toUpperCase()];
            base_series_name = title.replace(romanRegex, '').trim();
        } else {
            const match = title.match(seasonRegex);
            if (match) {
                season = parseInt(match[1] || match[2] || match[3]);
                base_series_name = title.replace(seasonRegex, '').trim();
            }
        }
        
        base_series_name = getBaseSeriesName(title);
        const views = d['Views'] ? parseInt(d['Views'].replace(/,/g, '')) : 0;
        
        return {
            series_name: base_series_name,
            season: season,
            total_views: views,
            available_globally: d['Available Globally?']
        };
    }).filter(d => d.total_views > 0);

    const groupedBySeason = d3.groups(processedData, d => d.series_name, d => d.season);

    allData = groupedBySeason.flatMap(([seriesName, seasons]) => 
        seasons.map(([seasonNumber, parts]) => {
            const totalViewsSum = d3.sum(parts, d => d.total_views);
            const isGlobal = parts.some(d => d.available_globally === 'Yes') ? 'Yes' : 'No';
            return {
                series_name: seriesName,
                season: seasonNumber,
                total_views: totalViewsSum,
                available_globally: isGlobal
            };
        })
    );

    setupChartComponents();
    updateChart();
}

function setupChartComponents() {
    x = d3.scaleLinear().range([0, width]);
    y = d3.scaleBand().padding(1); 
    size = d3.scaleSqrt().range([6, 35]);
    color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#E50914", "#564d4d"]); 

    tooltip = d3.select("#bubble-chart").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "rgba(0,0,0,0.95)")
        .style("color", "white")
        .style("border", "1px solid #444")
        .style("padding", "15px")
        .style("border-radius", "8px")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("font-family", "sans-serif")
        .style("font-size", "0.9em")
        .style("z-index", "100")
        .style("max-width", "300px")
        .style("display", "flex")
        .style("align-items", "center");
}

function updateChart(filterType, filterValue, buttonElement) {
    if (!chartInitialized) return;

    if (filterType === 'GlobalFilter') {
        currentGlobalFilter = filterValue;
        if (buttonElement) {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            buttonElement.classList.add('active');
            if (buttonElement.id === 'all-filter-button') document.getElementById('global-filter').value = 'All';
        } else {
            document.getElementById('all-filter-button').classList.remove('active');
        }
    } else if (filterType === 'Search') {
        currentSearchTerm = filterValue.toLowerCase();
    }

    let filteredData = allData.filter(d => {
        const globalMatch = currentGlobalFilter === 'All' || d.available_globally === currentGlobalFilter;
        const searchMatch = d.series_name.toLowerCase().includes(currentSearchTerm);
        return globalMatch && searchMatch;
    });

    const seriesTotalViews = d3.rollup(filteredData, v => d3.sum(v, d => d.total_views), d => d.series_name);
    filteredData.sort((a, b) => {
        const viewsA = seriesTotalViews.get(a.series_name);
        const viewsB = seriesTotalViews.get(b.series_name);
        return viewsB - viewsA || a.season - b.season;
    });

    let uniqueSeries = Array.from(new Set(filteredData.map(d => d.series_name)));
    uniqueSeries.sort((a, b) => seriesTotalViews.get(b) - seriesTotalViews.get(a));
    
    const dynamicHeight = Math.max(1000, uniqueSeries.length * SERIES_ROW_HEIGHT + 80);
    d3.select("#bubble-chart svg").attr("height", dynamicHeight);

    const maxSeasons = d3.max(filteredData, d => d.season) || 1;
    x.domain([0, maxSeasons]); 

    y.domain(uniqueSeries).range([0, uniqueSeries.length * SERIES_ROW_HEIGHT]);
    
    size.domain([0, d3.max(allData, d => d.total_views)]); 

    let xAxis = svg.select(".x-axis");
    if (xAxis.empty()) xAxis = svg.append("g").attr("class", "x-axis");
    xAxis.transition().duration(1000).call(d3.axisTop(x).ticks(maxSeasons));

    let yAxis = svg.select(".y-axis");
    if (yAxis.empty()) yAxis = svg.append("g").attr("class", "y-axis");
    yAxis.transition().duration(1000).call(d3.axisLeft(y).tickSize(0));
    yAxis.selectAll(".tick text").style("font-size", "16px").style("fill", "#E5E5E5");
    
    svg.selectAll(".grid-line").remove();
    svg.selectAll(".grid-line").data(uniqueSeries).enter().append("line")
        .attr("class", "grid-line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", d => y(d) + y.bandwidth()/2)
        .attr("y2", d => y(d) + y.bandwidth()/2)
        .attr("stroke", "#333").attr("stroke-dasharray", "2,2");

    const circles = svg.selectAll("circle").data(filteredData, d => d.series_name + '-' + d.season);
    circles.exit().transition().duration(500).attr("r", 0).remove();

    circles.enter().append("circle")
        .attr("cx", d => x(d.season))
        .attr("cy", d => y(d.series_name) + y.bandwidth() / 2)
        .attr("r", 0)
        .style("fill", d => color(d.available_globally))
        .style("opacity", 0.7)
        .style("stroke", "black")
        .merge(circles)
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "#fff").style("stroke-width", 2);
            tooltip.html(`
                <img id="tooltip-poster" src="" style="width:80px; height:auto; margin-right:20px; border-radius:4px; border:1px solid #666;">
                <div>
                    <div style="margin-bottom:8px; font-size:1.3em; font-weight:bold; color:#E50914;">${d.series_name}</div>
                    <div style="margin-bottom:5px;">Season: <span style="color:#fff; font-weight:600;">${d.season}</span></div>
                    <div style="margin-bottom:5px;">Views: <span style="color:#fff; font-weight:600;">${d3.format(",")(d.total_views)}</span></div>
                </div>
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("opacity", 1);
            
            getPosterUrl(d.series_name, d.season).then(url => {
                const img = document.getElementById('tooltip-poster');
                if (img) img.src = url;
            });
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style("stroke", "black").style("stroke-width", 1);
            tooltip.style("opacity", 0);
        })
        .transition().duration(700)
        .attr("cx", d => x(d.season))
        .attr("cy", d => y(d.series_name) + y.bandwidth() / 2)
        .attr("r", d => size(d.total_views));
}

async function getPosterUrl(seriesName, season = null) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(seriesName)}&language=es-ES`);
        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                let tmdbSeries = data.results.find(r => r.name.toLowerCase().trim() === seriesName.toLowerCase().trim());
                if (!tmdbSeries) {
                    tmdbSeries = data.results[0];
                }
                
                console.log(` "${seriesName}" - TMDB reports ${tmdbSeries.number_of_seasons} total seasons`);
                
                if (season && tmdbSeries.id) {
                    try {
                        const seasonRes = await fetch(`${TMDB_BASE_URL}/tv/${tmdbSeries.id}/season/${season}?api_key=${TMDB_API_KEY}&language=es-ES`);
                        if (seasonRes.ok) {
                            const seasonData = await seasonRes.json();
                            if (seasonData.poster_path) {
                                return TMDB_IMAGE_URL + seasonData.poster_path;
                            }
                        }
                    } catch (e) {
                        console.warn(`Could not fetch season ${season} poster for "${seriesName}"`);
                    }
                }
                
                if (tmdbSeries.poster_path) {
                    return TMDB_IMAGE_URL + tmdbSeries.poster_path;
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching poster URL for "${seriesName}":`, error);
    }
    return '';
}

async function openImdbForSeries(seriesName) {
    try {
        const searchRes = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(seriesName)}&language=es-ES`);
        if (!searchRes.ok) throw new Error(`TMDB search error: ${searchRes.status}`);
        const searchData = await searchRes.json();
        if (!searchData.results || searchData.results.length === 0) throw new Error('Serie no encontrada en TMDB');

        const tmdbId = searchData.results[0].id;
        const extRes = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}&language=es-ES`);
        if (!extRes.ok) throw new Error(`TMDB external_ids error: ${extRes.status}`);
        const extData = await extRes.json();
        if (!extData.imdb_id) throw new Error('IMDb ID no disponible');

        window.open(`https://www.imdb.com/title/${extData.imdb_id}`, '_blank');
    } catch (err) {
        console.error(` IMDb open error for "${seriesName}":`, err.message);
        alert(`No se pudo abrir IMDb para "${seriesName}". ${err.message}`);
    }
}