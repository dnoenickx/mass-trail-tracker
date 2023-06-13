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

let segments;
let trails;
let resources;
let hoveredTrailId = null;
const urlParams = new URLSearchParams(window.location.search);

function addDataLayers() {
    map.addSource('segments', {
        type: 'geojson',
        data: segments
    });

    map.addLayer(
        {
            id: 'segments',
            type: 'line',
            source: 'segments',
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
        const segs = segments.features.filter(f => f.properties.trails.includes(urlParams.get("trail")));
        const bounds = new mapboxgl.LngLatBounds();
        for (const s of segs) {
            const coords = s.geometry.coordinates[0];
            bounds.extend(coords[0].slice(0, 2));
            bounds.extend(coords[coords.length - 1].slice(0, 2));
        }
        map.fitBounds(bounds, { padding: 200 });
    }
}

map.on('style.load', () => {
    if (segments) addDataLayers();
});


map.on('load', () => {
    d3.json('segments.geojson', function (err, data) {
        if (err) return console.log(err);
        segments = data;
        addDataLayers();
    });
    d3.json('trails.json', function (err, data) {
        if (err) return console.log(err);
        trails = data;
    });
    d3.json('resources.json', function (err, data) {
        if (err) return console.log(err);
        resources = data;
    });
});


function closeInfo() { document.getElementById("info").style.display = "none" }
function closeModal() { document.getElementById("modal").style.display = "none" }


function getTrailByID(id) { return trails.find(t => t.id == id) }


// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
map.on('click', 'segments', (e) => {
    // Copy coordinates array.
    // const coordinates = e.features[0].geometry.coordinates.slice();
    const clickedTrailIDs = eval(e.features[0].properties.trails);
    const clickedTrails = clickedTrailIDs.map(id => getTrailByID(id));;

    info.style.display = "block";

    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = `<span onclick="closeInfo()" class="close">x</span>`;

    let h1 = document.createElement('h1');
    h1.innerHTML = clickedTrails[0].name;
    infoDiv.appendChild(h1);

    if (clickedTrails.length > 1) {
        infoDiv.innerHTML += (`<p style="color: #555;">Also part of:</p>`);
        let ul = document.createElement('ul');
        for (const t of clickedTrails.slice(1)) {
            let li = document.createElement('li');
            li.innerHTML = t.name;
            ul.appendChild(li);
        }
        infoDiv.appendChild(ul);
    }


    let p = document.createElement('p');
    p.style = "padding: 10px 0;";
    p.innerHTML = clickedTrails[0].description;
    infoDiv.appendChild(p);

    const clickResults = resources.filter(r => clickedTrailIDs.includes(r.trail_id));
    console.log(clickResults);

    for (const res of clickResults) {
        let div = document.createElement('a');
        div.setAttribute("href", res.url);
        div.setAttribute("target", "_blank");
        div.setAttribute("rel", "noopener noreferrer");
        div.className = "resource";
        div.innerHTML += `<div style="width: 40px; float: left;"><i style="font-size:24px" class="fa">&#xf08e;</i></div>` + res.text;
        infoDiv.appendChild(div);
    }

    // `
    // <div class="resource">
    //     <div style="width: 40px; float: left;">
    //         <i style="font-size:24px" class="fa">&#xf08e;</i>
    //     </div>
    //         Wikipedia: Somerville Community Path
    // </div>
    // `


});

// Mouse enter
map.on('mouseenter', 'segments', (e) => {
    map.getCanvas().style.cursor = 'pointer';
});

// Mouse leave
map.on('mouseleave', 'segments', () => {
    map.getCanvas().style.cursor = '';
});


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
    if (legend.classList.contains('hidden') && window.innerWidth < 800) { closeInfo() }
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