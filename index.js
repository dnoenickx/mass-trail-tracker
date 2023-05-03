// Configure map
mapboxgl.accessToken = 'pk.eyJ1IjoiZG5vZW4iLCJhIjoiY2xlajhyemQzMDBqMTNwbG1jc2M2bTV4cSJ9.1nzFSXJN_zgrXDSA_s4D6Q';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dnoen/cleta0vgs004601qkisfw3l1z',
    center: [-71.85, 42.32],
    zoom: 9,
    minZoom: 7
});
map.addControl(new mapboxgl.NavigationControl());

const statusValues = ["paved", "stone_dust", "unofficial", "construction", "closed"];

let geojson;
let hoveredTrailId = null;
const urlParams = new URLSearchParams(window.location.search);

function addDataLayers() {
    map.addSource('trail_segments', {
        type: 'geojson',
        data: geojson
    });

    map.addLayer(
        {
            id: 'trails',
            type: 'line',
            source: 'trail_segments',
            filter: [
                "all",
                ["in", ["get", "status"], ["literal", statusValues]],
                ["!=", ["get", "hidden"], true],
                [
                    "any",
                    !urlParams.has("trail"),
                    ["in", urlParams.get("trail"), ['get', 'trails']],
                ],
            ],
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

    if (urlParams.has("trail")) {
        const segs = geojson.features.filter(f => f.properties.trails.includes(urlParams.get("trail")));
        const bounds = new mapboxgl.LngLatBounds();
        for (const s of segs){
            const coords = s.geometry.coordinates[0];
            bounds.extend(coords[0].slice(0, 2));
            bounds.extend(coords[coords.length - 1].slice(0, 2));
        }
        map.fitBounds(bounds, {padding: 200});
    }
}

map.on('style.load', () => {
    if (geojson) addDataLayers();
});


map.on('load', () => {
    d3.json('segments.geojson', function (err, data) {
        if (err) return console.log(err);
        geojson = data;
        addDataLayers();
    });
});


// // Mouse enter
// map.on('mouseenter', 'trails', (e) => {
//     // change cursor to pointer
//     map.getCanvas().style.cursor = 'pointer';
//     // Update hovered trail
//     if (e.features.length > 0) {
//         // Remove previous hover
//         if (hoveredTrailId !== null) {
//             map.setFeatureState(
//                 { source: 'trail_segments', id: hoveredTrailId },
//                 { hover: false }
//             );
//         }
//         // Set new hover
//         hoveredTrailId = e.features[0].id;
//         map.setFeatureState(
//             { source: 'trail_segments', id: hoveredTrailId },
//             { hover: true }
//         );
//     }
// });


// // Mouse leave
// map.on('mouseleave', 'trails', () => {
//     // restore default cursor
//     map.getCanvas().style.cursor = '';
//     // Remove previous hover
//     if (hoveredTrailId !== null) {
//         map.setFeatureState(
//             { source: 'trail_segments', id: hoveredTrailId },
//             { hover: false }
//         );
//     }
//     hoveredTrailId = null;
// });


// Add menus
let div = document.createElement('div');
div.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
div.innerHTML = `
    <div class="tooltip">
        <button id="layer-button" type="button">
            <img src="layers.svg" alt="">
        </button>
        <div id="layer-menu" class="tooltiptext tooltip-left">
            <button type="button" value="mapbox://styles/dnoen/cleta0vgs004601qkisfw3l1z">Default</button>
            <button type="button" value="mapbox://styles/mapbox/satellite-v9">Satellite</button>
            <button type="button" value="mapbox://styles/mapbox/satellite-streets-v12">Satellite-streets</button>
            <button type="button" value="mapbox://styles/mapbox/light-v11">Light</button>
            <button type="button" value="mapbox://styles/mapbox/dark-v11">Dark</button>
            <button type="button" value="mapbox://styles/mapbox/streets-v12">Streets</button>
            <button type="button" value="mapbox://styles/mapbox/outdoors-v12">Outdoors</button>
        </div>
    </div>
    <button id="legend-toggle" type="button" aria-label="Toggle legend" aria-disabled="false">
        <img src="legend.svg" alt="">
        <span class="mapboxgl-ctrl-icon" aria-hidden="true" title="Toggle legend"></span>
    </button>
    `;
document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].appendChild(div);

div = document.createElement('div');
div.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
div.innerHTML = `
    <button id="help-button" type="button" aria-label="About" aria-disabled="false">
    <img src="help.svg" alt="">
    <span class="mapboxgl-ctrl-icon" aria-hidden="true" title="About"></span>
    </button>
    `;
document.getElementsByClassName('mapboxgl-ctrl-top-right')[0].appendChild(div);


// Layer selection
document.getElementById('layer-menu').addEventListener('click', (event) => {
    const isButton = event.target.nodeName === 'BUTTON';
    if (!isButton) return;
    map.setStyle(event.target.value);
})

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


// Control help modal
const modal = document.getElementById("modal");
document.getElementById("help-button").addEventListener("click", () => {
    modal.style.display = "block";
});


// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

