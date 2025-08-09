// Variables globales
let listaPokemones = [];
const POKEMON_LIMIT = 200;

// Elementos del DOM
const pokemonList = document.getElementById('ul-list');
const pokemonContent = document.getElementById('pokemon-content');
const loadingSpinner = document.getElementById('loading-spinner');
const inputBusqueda = document.getElementById('search-input');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    fetchAllPokemon();
    // Evento de búsqueda
    inputBusqueda.addEventListener('input', buscarPokemon);
});


// Funcion para obtener todos los Pokemon
async function fetchAllPokemon() {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_LIMIT}`);
        const data = await response.json();
        listaPokemones = data.results;
        obtenerListaPokemon(listaPokemones);

        // Cargar el primer Pokemon de la lista por defecto
        if (listaPokemones.length > 0) {
            pokemonInformation(listaPokemones[0].url);
        }
    } catch (error) {
        console.error('Error al obtener la lista de Pokémon:', error);

        const mensaje = document.createElement('div');
        mensaje.className = 'list-group-item text-center text-muted';
        mensaje.textContent = 'No es posible cargar los datos.';
        pokemonList.appendChild(mensaje);

    }
}


// funcion para mostrar la lista de pokemones
function obtenerListaPokemon(arrayPokemon) {
    pokemonList.innerHTML = ''; /*? Asegura que este vacio */


    /* se agrega la lista */
    arrayPokemon.forEach((pokemon, index) => {
        const pokemonId = pokemon.url.split('/').filter(Boolean).pop();

        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex align-items-center';
        listItem.innerHTML = `
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" 
                 alt="${pokemon.name}" width="50" class="me-3">
            <span class="text-capitalize">${pokemon.name}</span>
            <span class="badge bg-secondary ms-auto">#${pokemonId.toString()}</span>
        `;


        /* se controla la seleccion de elementos y se muestra la info del seleccionado */
        listItem.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#ul-list li').forEach(item => {
                item.classList.remove('active');
            });

            // Agregar clase active al item seleccionado
            listItem.classList.add('active');
            console.log(pokemon.url);            
            pokemonInformation(pokemon.url);
        });

        pokemonList.appendChild(listItem);
    });
}

// Función para buscar Pokémon
function buscarPokemon() {
    const nombrePokemon = inputBusqueda.value.toLowerCase().trim();

    if (nombrePokemon === '') {
        obtenerListaPokemon(listaPokemones);
        return;
    }

    const pokemonesFiltrados = listaPokemones.filter(pokemon => {
        return pokemon.name.toLowerCase().includes(nombrePokemon) ||
            (listaPokemones.indexOf(pokemon) + 1).toString().includes(nombrePokemon);
    });

    obtenerListaPokemon(pokemonesFiltrados);
}


// Función para obtener detalles de un Pokémon específico
async function pokemonInformation(url) {
    try {
        pokemonContent.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');

        const response = await fetch(url);
        const pokemonData = await response.json();

        // Obtener datos de la especie para mostrar la evolución
        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();

        // Obtener cadena de evolución
        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();

        pokemonDetails(pokemonData, speciesData, evolutionData);

    } catch (error) {
        console.error('Error al obtener detalles del Pokémon:', error);
    } finally {
        loadingSpinner.classList.add('d-none');
        pokemonContent.classList.remove('d-none');
    }
}


// Función para mostrar los detalles del Pokémon
function pokemonDetails(pokemon, species, evolution) {

    document.getElementById('pokemon-name').textContent = pokemon.name;

    // Imagen
    const pokemonImage = document.getElementById('pokemon-image');
    pokemonImage.src = pokemon.sprites.other['official-artwork'].front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    pokemonImage.alt = pokemon.name;

    // Tipos
    const typesContainer = document.getElementById('pokemon-types');
    typesContainer.innerHTML = '';
    pokemon.types.forEach(type => {
        const typeSpace = document.createElement('span');
        typeSpace.className = `type-badge type-${type.type.name}`;
        typeSpace.textContent = type.type.name;
        typesContainer.appendChild(typeSpace);
    });

    // detalles
    document.getElementById('pokemon-height').textContent = (pokemon.height / 10).toFixed(1);
    document.getElementById('pokemon-weight').textContent = (pokemon.weight / 10).toFixed(1);

    const speciesP = species.genera.find(g => g.language.name === 'en') || species.genera[0];
    document.getElementById('pokemon-species').textContent = speciesP ? speciesP.genus : 'Unknown';

    const eggGroups = species.egg_groups.map(group => group.name).join(', ');
    document.getElementById('pokemon-egg-groups').textContent = eggGroups || 'Unknown';

    const abilities = pokemon.abilities.map(ability => ability.ability.name).join(', ');
    document.getElementById('pokemon-abilities').textContent = abilities || 'None';

    // Cadena de evolución
    evolutionInfo(evolution.chain);
}


// Función recursiva para obtener todas las evoluciones en orden
function collectEvolutions(chain, stages = []) {
    stages.push(chain.species.name);

    chain.evolves_to.forEach(evo => {
        collectEvolutions(evo, stages);
    });

    return stages;
}

// Función para mostrar la cadena de evolución
function evolutionInfo(chain) {
    const evolutionContainer = document.getElementById('evolution-chain');
    evolutionContainer.innerHTML = '';

    // Obtener todos los nombres en orden recursivamente
    const stages = collectEvolutions(chain);

    // Array de promesas fetch para obtener datos de cada Pokémon
    const fetches = stages.map(name =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(res => res.json())
    );

    // Esperar a que todas terminen y mostrar en orden
    Promise.all(fetches).then(results => {
        results.forEach(data => {
            const name = data.name;
            const div = document.createElement('div');
            div.style.textAlign = 'center';
            div.style.margin = '20px';
            div.innerHTML = `
                <img src="${data.sprites.other['official-artwork'].front_default}" 
                     alt="${name}" 
                     style="width: 120px;">
                <p style="text-transform: capitalize;">${name}</p>
            `;
            evolutionContainer.appendChild(div);
        });
    });
}