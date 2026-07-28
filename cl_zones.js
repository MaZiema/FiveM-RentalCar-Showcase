// Zonen-System: Enter/Leave Events mit effizientem Intervall-Check
// Statt 60x/Sek Distanz-Check → nur 3x/Sek + schneller Vor-Check

const CHECK_RADIUS = 50.0;  // Vor-Check: Nur prüfen wenn Spieler < 50m entfernt
const CHECK_INTERVAL = 300; // Check-Intervall in Millisekunden

const zones = [];
let lastCheck = 0;

/**
 * Erstellt eine neue Zone mit Enter/Leave Events.
 * @param {object} config - { center: {x,y,z}, radius: number, onEnter: fn, onLeave: fn }
 * @returns {object} Zone-Objekt mit enable()/disable()
 */
function createZone({ center, radius, onEnter, onLeave }) {
    const zone = {
        center,
        radius,
        onEnter: onEnter || (() => {}),
        onLeave: onLeave || (() => {}),
        inside: false,
        enabled: false,
        enable()  { this.enabled = true; },
        disable() { this.enabled = false; this.inside = false; }
    };
    zones.push(zone);
    return zone;
}

// Hauptloop: Prüft alle aktiven Zonen im Intervall
setTick(() => {
    const now = Date.now();
    if (now - lastCheck < CHECK_INTERVAL) return;
    lastCheck = now;

    const c = GetEntityCoords(PlayerPedId());

    for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        if (!zone.enabled) continue;

        // Schneller Vor-Check (2D, ohne Z-Achse)
        const fdx = c[0] - zone.center.x;
        const fdy = c[1] - zone.center.y;
        if ((fdx * fdx + fdy * fdy) > (CHECK_RADIUS * CHECK_RADIUS)) {
            if (zone.inside) {
                zone.inside = false;
                zone.onLeave();
            }
            continue;
        }

        // Exakter Check (3D)
        const fdz = c[2] - zone.center.z;
        const dist = Math.sqrt(fdx * fdx + fdy * fdy + fdz * fdz);
        const wasInside = zone.inside;
        zone.inside = dist < zone.radius;

        if (zone.inside && !wasInside) zone.onEnter();
        if (!zone.inside && wasInside) zone.onLeave();
    }
});
