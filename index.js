mapboxgl.accessToken = 'pk.eyJ1IjoiZG5vZW4iLCJhIjoiY2xlajhyemQzMDBqMTNwbG1jc2M2bTV4cSJ9.1nzFSXJN_zgrXDSA_s4D6Q';


let hoveredTrailId = null;

// Check beta flag
const urlParams = new URLSearchParams(window.location.search);
const beta = urlParams.has('beta');


// Configure map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dnoen/cleta0vgs004601qkisfw3l1z',
    center: [-71.85, 42.32],
    zoom: 9,
    minZoom: 7
    // hash: true
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Load map layers
const geojson = fetch('segments.geojson')
    .then((response) => response.json())
    .then((geojson) => {
        map.on('style.load', () => {

            map.addSource('trail_segments', {
                type: 'geojson',
                data: geojson
            });

            map.addLayer(
                {
                    id: 'trails',
                    type: 'line',
                    source: 'trail_segments',
                    filter: ['any', beta, ['!=', ['get', 'hidden'], true]],
                    paint: {
                        'line-color': [
                            'match', ['get', 'status'],
                            'paved', '#426a5a',
                            'stone_dust', '#68A357',
                            'construction', '#f28f3b',
                            'unofficial', '#4d9de0',
                            'closed', '#d7263d',
                            '#564d80'
                        ],
                        'line-dasharray': [
                            'match', ['get', 'status'],
                            'closed', ["literal", [0.75, 0.5]],
                            'construction', ["literal", [0.75, 0.5]],
                            'unofficial', ["literal", [3, 0.5]],
                            ["literal", [1, 0]]
                        ],
                        'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 5, 4],
                        'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.8]
                    }
                }
            );
        });
    });



// Mouse enter
map.on('mouseenter', 'trails', (e) => {
    // change cursor to pointer
    map.getCanvas().style.cursor = 'pointer';
    // Update hovered trail
    if (e.features.length > 0) {
        // Remove previous hover
        if (hoveredTrailId !== null) {
            map.setFeatureState(
                { source: 'trail_segments', id: hoveredTrailId },
                { hover: false }
            );
        }
        // Set new hover
        hoveredTrailId = e.features[0].id;
        map.setFeatureState(
            { source: 'trail_segments', id: hoveredTrailId },
            { hover: true }
        );
    }
});


// Mouse leave
map.on('mouseleave', 'trails', () => {
    // restore default cursor
    map.getCanvas().style.cursor = '';
    // Remove previous hover
    if (hoveredTrailId !== null) {
        map.setFeatureState(
            { source: 'trail_segments', id: hoveredTrailId },
            { hover: false }
        );
    }
    hoveredTrailId = null;
});


// Add menus
const div = document.createElement('div');
div.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
div.innerHTML = `
    <button id="layer-button" type="button" aria-label="Toggle layers" aria-disabled="false">
    <img src="layers.svg" alt="">
    <span class="mapboxgl-ctrl-icon" aria-hidden="true" title="Toggle layers"></span>
    </button>
    <button id="legend-toggle" type="button" aria-label="Toggle legend" aria-disabled="false">
    <img src="legend.svg" alt="">
    <span class="mapboxgl-ctrl-icon" aria-hidden="true" title="Toggle legend"></span>
    </button>
    `;
document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].appendChild(div);


// Control layer toggling
let style_index = 0;
const styles = [
    "mapbox://styles/dnoen/cleta0vgs004601qkisfw3l1z",
    "mapbox://styles/mapbox/satellite-streets-v12",
    "mapbox://styles/mapbox/light-v11",
    "mapbox://styles/mapbox/dark-v11",
    "mapbox://styles/mapbox/streets-v12",
    "mapbox://styles/mapbox/outdoors-v12"
]
document.getElementById("layer-button").addEventListener("click", () => {
    style_index = ++style_index % styles.length;
    map.setStyle(styles[style_index]);
});


// Control legend toggling
const legendToggle = document.getElementById("legend-toggle");
const legend = document.getElementById("legend");
function toggleLegend() {
    legendToggle.classList.toggle('active');
    legend.classList.toggle('hidden');
}
legendToggle.addEventListener("click", toggleLegend);
if (window.innerWidth >= 800)
    toggleLegend();