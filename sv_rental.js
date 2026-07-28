// Mietwagen-Server: Kauf-Verarbeitung mit Distanz- und Cooldown-Check
// Spawn-Block wird client-seitig geprüft (GetGamePool auf Server nicht zuverlässig)

const cfg = require('./config.js');
const pending = new Set();

const PENDING_TIMEOUT_MS = 30000;

/**
 * Behandelt Kauf-Anfrage vom Client.
 * Prüft Cooldown und Distanz, löst Geld-Abzug aus.
 * Spawn-Block wird vom Client geprüft nach Geld-Abzug.
 */
onNet('rental:buyVehicle', () => {
    const playerId = source;

    // Bereits in Bearbeitung?
    if (pending.has(playerId)) {
        emitNet('rental:notify', playerId, false, 'Bitte warten...');
        return;
    }

    // Spieler-Entity prüfen
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

    // Kauf in Bearbeitung setzen mit Timeout
    pending.add(playerId);
    setTimeout(() => {
        if (pending.has(playerId)) {
            pending.delete(playerId);
            emitNet('rental:notify', playerId, false, 'Zeitüberschreitung. Bitte erneut versuchen.');
        }
    }, PENDING_TIMEOUT_MS);

    // Geld-Abzug an Money-System
    emit('money:remove', playerId, cfg.price);
});

/**
 * Callback vom Money-System nach Geld-Abzug.
 * Bei Erfolg: Fahrzeug spawnen. Bei Fehler: Benachrichtigung.
 */
on('money:removeResult', (playerId, success) => {
    if (!pending.has(playerId)) return;
    pending.delete(playerId);

    if (!success) {
        emitNet('rental:notify', playerId, false, 'Nicht genug Geld! Benötigt: ' + cfg.price + '$.');
        return;
    }

    // Fahrzeug spawnen und Spieler benachrichtigen
    const s = cfg.spawnPos;
    emitNet('rental:spawnVehicle', playerId, s.x, s.y, s.z, s.heading, cfg.vehicle);
    emitNet('rental:notify', playerId, true, 'Fahrzeug für ' + cfg.price + '$ gemietet!');
});

/**
 * Client meldet: Spawn-Punkt blockiert.
 * Geld wird erstattet.
 */
onNet('rental:spawnBlocked', () => {
    const playerId = source;
    emit('money:refund', playerId, cfg.price);
    emitNet('rental:notify', playerId, false, 'Spawn blockiert! Entferne zuerst das vorhandene Fahrzeug.');
});
