// Mietwagen-Server: Kauf-Verarbeitung mit Distanz- und Cooldown-Check

const cfg = require('./config.js');
const pending = new Set();

const PENDING_TIMEOUT_MS = 30000;

// Behandelt Kauf-Anfrage vom Client
onNet('rental:buyVehicle', () => {
    const playerId = source;

    if (pending.has(playerId)) {
        emitNet('rental:notify', playerId, false, 'Bitte warten...');
        return;
    }

    const ped = GetPlayerPed(playerId);
    if (!ped || !DoesEntityExist(ped)) return;

    // Distanz zur Station prüfen
    const playerPos = GetEntityCoords(ped);
    const dx = playerPos.x - cfg.rentPos.x;
    const dy = playerPos.y - cfg.rentPos.y;
    const dz = playerPos.z - cfg.rentPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > cfg.maxDistance) {
        emitNet('rental:notify', playerId, false, 'Zu weit von der Station entfernt!');
        return;
    }

    // Cooldown setzen mit Timeout
    pending.add(playerId);
    setTimeout(() => {
        if (pending.has(playerId)) {
            pending.delete(playerId);
            emitNet('rental:notify', playerId, false, 'Zeitüberschreitung. Bitte erneut versuchen.');
        }
    }, PENDING_TIMEOUT_MS);

    emit('money:remove', playerId, cfg.price);
});

// Callback nach Geld-Abzug: Fahrzeug spawnen oder Fehler
on('money:removeResult', (playerId, success) => {
    if (!pending.has(playerId)) return;
    pending.delete(playerId);

    if (!success) {
        emitNet('rental:notify', playerId, false, 'Nicht genug Geld! Benötigt: ' + cfg.price + '$.');
        return;
    }

    const s = cfg.spawnPos;
    emitNet('rental:spawnVehicle', playerId, s.x, s.y, s.z, s.heading, cfg.vehicle);
    emitNet('rental:notify', playerId, true, 'Fahrzeug für ' + cfg.price + '$ gemietet!');
});
