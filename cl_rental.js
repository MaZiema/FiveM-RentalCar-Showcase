// Mietwagen-Client: Menü-Steuerung und Fahrzeug-Spawn
// require() funktioniert nicht im FiveM Client → Werte hardcoded (müssen mit config.js sync sein)

const RENT_POS = { x: 225.0, y: 204.0, z: 105.0 };
const MAX_DISTANCE = 3.0;
const SPAWN_BLOCK_RADIUS = 3.0;
const INTERACT_KEY = 38;  // E-Taste
const ESC_KEY = 200;      // ESC-Taste
const VEHICLE_HASH = GetHashKey('baller');

// Status-Flags
let menuOpen = false;     // Menü ist offen
let spawning = false;     // Fahrzeug wird gespawnt
let buySent = false;      // Kauf-Anfrage wurde gesendet
let modelLoaded = false;  // Fahrzeug-Modell ist geladen

// Mietstation-Zone mit Enter/Leave Events
const rentalZone = createZone({
    center: RENT_POS,
    radius: MAX_DISTANCE,
    onEnter: () => {
        if (!modelLoaded) {
            RequestModel(VEHICLE_HASH);
            modelLoaded = true;
        }
    },
    onLeave: () => {}
});
rentalZone.enable();

/**
 * Prüft client-seitig ob am Spawn-Punkt bereits ein Fahrzeug steht.
 * Nutzt GetGamePool('CVehicle') — zuverlässig da Client die Fahrzeuge kennt.
 * @param {number} x - Spawn X-Koordinate
 * @param {number} y - Spawn Y-Koordinate
 * @param {number} z - Spawn Z-Koordinate
 * @returns {boolean} true wenn Spawn blockiert ist
 */
function isSpawnBlocked(x, y, z) {
    const vehicles = GetGamePool('CVehicle');
    const r2 = SPAWN_BLOCK_RADIUS * SPAWN_BLOCK_RADIUS;
    for (let i = 0; i < vehicles.length; i++) {
        const c = GetEntityCoords(vehicles[i]);
        const dx = c[0] - x;
        const dy = c[1] - y;
        const dz = c[2] - z;
        if (dx * dx + dy * dy + dz * dz < r2) {
            return true;
        }
    }
    return false;
}

/**
 * Verarbeitet Tasten-Eingaben für Menü.
 * E = Menü öffnen / Fahrzeug mieten, ESC = Menü schließen
 */
setTick(() => {
    if (menuOpen) {
        if (IsControlJustPressed(0, INTERACT_KEY) && !buySent) {
            menuOpen = false;
            buySent = true;
            SendNUIMessage({ type: 'closeMenu' });
            emitNet('rental:buyVehicle');
        }
        if (IsControlJustPressed(0, ESC_KEY)) {
            menuOpen = false;
            SendNUIMessage({ type: 'closeMenu' });
        }
        return;
    }
    if (!rentalZone.inside) return;
    if (IsControlJustPressed(0, INTERACT_KEY)) {
        menuOpen = true;
        SendNUIMessage({ type: 'openMenu' });
    }
});

// Server benachrichtigt Spieler (Erfolg/Fehler)
onNet('rental:notify', (success, msg) => {
    spawning = false;
    buySent = false;
    SendNUIMessage({ type: 'notify', success, message: msg });
});

// Server sendet Fahrzeug-Spawn (prüft Spawn-Block vor CreateVehicle)
onNet('rental:spawnVehicle', (x, y, z, h) => {
    if (spawning) return;

    // Client-seitiger Spawn-Block Check
    if (isSpawnBlocked(x, y, z)) {
        emitNet('rental:spawnBlocked');
        return;
    }

    spawning = true;
    RequestModel(VEHICLE_HASH);
    CreateVehicle(VEHICLE_HASH, x, y, z, h, true, true);
    SetModelAsNoLongerNeeded(VEHICLE_HASH);
    modelLoaded = false;
});
