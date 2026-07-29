// Mietwagen-Client: Menü-Steuerung und Fahrzeug-Spawn

const RENT_POS = { x: 225.0, y: 204.0, z: 105.0 };
const SPAWN_POS = { x: 238.0, y: 196.0, z: 105.0 };
const MAX_DISTANCE = 3.0;
const SPAWN_BLOCK_RADIUS = 3.0;
const INTERACT_KEY = 38;     // E
const ESC_KEY = 200;         // ESC
const VEHICLE_HASH = GetHashKey('baller');

let menuOpen = false;
let spawning = false;
let buySent = false;

/**
 * Prüft ob am Spawn-Punkt bereits ein Fahrzeug steht.
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

// Prüft ob Spieler nah an der Mietstation ist
function isNearStation() {
    const c = GetEntityCoords(PlayerPedId());
    const dx = c[0] - RENT_POS.x;
    const dy = c[1] - RENT_POS.y;
    const dz = c[2] - RENT_POS.z;
    return (dx * dx + dy * dy + dz * dz) <= (MAX_DISTANCE * MAX_DISTANCE);
}

// Menü schließen
function closeMenu() {
    menuOpen = false;
    SendNUIMessage({ type: 'closeMenu' });
}

// 1 permanenter Tick: E und ESC abfangen
setTick(() => {
    if (menuOpen) {
        if (IsControlJustPressed(0, ESC_KEY)) {
            closeMenu();
        } else if (IsControlJustPressed(0, INTERACT_KEY) && !buySent) {
            if (isSpawnBlocked(SPAWN_POS.x, SPAWN_POS.y, SPAWN_POS.z)) {
                closeMenu();
                SendNUIMessage({ type: 'notify', success: false, message: 'Spawn blockiert! Entferne zuerst das vorhandene Fahrzeug.' });
                return;
            }
            menuOpen = false;
            buySent = true;
            SendNUIMessage({ type: 'closeMenu' });
            emitNet('rental:buyVehicle');
        }
    } else if (isNearStation()) {
        if (IsControlJustPressed(0, INTERACT_KEY)) {
            menuOpen = true;
            SendNUIMessage({ type: 'openMenu' });
        }
    }
});

// Server sendet Ergebnis (Erfolg/Fehler)
onNet('rental:notify', (success, msg) => {
    spawning = false;
    buySent = false;
    if (!success) {
        menuOpen = false;
        SendNUIMessage({ type: 'closeMenu' });
    }
    SendNUIMessage({ type: 'notify', success, message: msg });
});

// Server sendet Fahrzeug-Spawn
onNet('rental:spawnVehicle', (x, y, z, h) => {
    if (spawning) return;

    spawning = true;
    RequestModel(VEHICLE_HASH);
    const loadTick = setTick(() => {
        if (HasModelLoaded(VEHICLE_HASH)) {
            clearTick(loadTick);
            CreateVehicle(VEHICLE_HASH, x, y, z, h, true, true);
            SetModelAsNoLongerNeeded(VEHICLE_HASH);
        }
    });
});
