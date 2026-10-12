/*
NOMBRE : YUREM RAFAEL QUISBERT PAÑUNI
*/

const API_KEY = 'ea6205aa0543255a2153c44550df9211'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();


// ############################################################################
// #                                                                          #
// #                          TU CÓDIGO AQUÍ                    #
// #                                                                          #
// ############################################################################
/*
const cargarSeriesPopulares = async () => {
    const response = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`);
    const data = await response.json();
    console.log('Series populares cargadas:', data.results);
};

cargarSeriesPopulares();
*/

const obtenerSeriesPopulares = async () => {
    const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    
    if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status}`);
    }
    
    const datos = await respuesta.json();
    return datos.results;
};

const crearTarjeta = (serie) => {
    const { id, name, first_air_date, vote_average, poster_path } = serie;
    const anio = first_air_date ? first_air_date.split('-')[0] : 'N/A';
    const image = poster_path ? `${IMAGE_URL}${poster_path}` : 'https://via.placeholder.com/500x750?text=Sin+Imagen';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';

    return `
        <article class="serie-card" data-id="${id}">
            <div class="serie-card__poster">
                <img class="serie-card__image" src="${image}" alt="${name}">
                <span class="serie-card__rating">⭐ ${rating}</span>
            </div>
            <div class="serie-card__info">
                <h3 class="serie-card__title">${name}</h3>
                <p class="serie-card__year">${anio}</p>
            </div>
        </article>
    `;
};

const iniciar = async () => {
    mostrarLoading();
    try {
        const series = await obtenerSeriesPopulares();
        
        resultsTitle.textContent = "Series Populares";
        resultsCount.textContent = `(${series.length})`;

        seriesGrid.innerHTML = series.map(crearTarjeta).join('');
        ocultarLoading();
    } catch (error) {
        console.error('Error al cargar:', error);
        let mensaje = 'Error de conexión';
        
        if (error.message.includes('401')) {
            mensaje = 'API Key inválida';
        } else if (error.message.includes('429')) {
            mensaje = 'Existen demasiadas peticiones. Espera un momento';
        }
        
        mostrarError(mensaje);
    }
};

retryBtn.addEventListener('click', iniciar);

iniciar();

const buscarSeries = async (texto) => {
    if (!texto || texto.trim() === '') {
        return obtenerSeriesPopulares();
    }
    const query = encodeURIComponent(texto.trim());
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${query}`;
    const respuesta = await fetch(url);
    
    if (!respuesta.ok) {
        if (respuesta.status === 401) throw new Error("API Key inválida");
        throw new Error("Error de conexión");
    }

    const datos = await respuesta.json();
    return datos.results;
};

let timeoutBusqueda = null;

searchInput.addEventListener('input', (evento) => {
    const texto = evento.target.value;
    clearTimeout(timeoutBusqueda);

    if (!texto.trim()) {
        iniciar();
        return;
    }

    timeoutBusqueda = setTimeout(async () => {
        mostrarLoading();
        try {
            const series = await buscarSeries(texto);
            ocultarLoading(); 

            resultsTitle.textContent = `Resultados para: "${texto}"`;
            resultsCount.textContent = `(${series.length})`;

            if (series.length === 0) {
                seriesGrid.innerHTML = `<p class="no-results">No se encontraron series para: ${texto}</p>`;
                return;
            }

            // AQUÍ PINTAMOS LAS TARJETAS EN EL DOM:
            seriesGrid.innerHTML = series.map(crearTarjeta).join('');

        } catch (error) {
            console.error('Error de búsqueda', error);
            mostrarError("Error de conexión");
        }
    }, 500);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    iniciar();
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    iniciar();
});

const abrirModal = () => modal.classList.add('modal--show');
const cerrarModal = () => modal.classList.remove('modal--show');

const obtenerDetalleSerie = async (id) => {
    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    return await respuesta.json();
};

const mostrarDetalleEnModal = (serie) => {
    const {
        name,
        overview,
        number_of_seasons,
        number_of_episodes,
        genres,
        status
    } = serie;

    const listaGeneros = genres && genres.length > 0 
        ? genres.map(g => g.name).join(', ') 
        : 'Sin géneros';
    const sinopsis = overview || 'No hay sinopsis disponible.';

    modalBody.innerHTML = `
        <h2 class="modal__title">${name}</h2>
        <div class="modal__info">
            <p><strong>Estado:</strong> ${status || 'N/A'}</p>
            <p><strong>Temporadas:</strong> ${number_of_seasons ?? 'N/A'}</p>
            <p><strong>Episodios:</strong> ${number_of_episodes ?? 'N/A'}</p>
            <p><strong>Géneros:</strong> ${listaGeneros}</p>
        </div>
        <p class="modal__overview"><strong>Sinopsis:</strong> ${sinopsis}</p>
    `;

    abrirModal();
};

seriesGrid.addEventListener('click', async (e) => {
    const tarjeta = e.target.closest('.serie-card');
    if (!tarjeta) return;

    const serieId = tarjeta.dataset.id;
    if (!serieId) return;

    try {
        const detalleSerie = await obtenerDetalleSerie(serieId);
        mostrarDetalleEnModal(detalleSerie);
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        mostrarError("Error al obtener detalle de la serie");
    }
});

modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);