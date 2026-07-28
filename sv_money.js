// Geld-Server: Speichert Geldstände pro Spieler im Memory

const moneyCfg = require('./config.js');
const moneyStore = new Map();

// Geld-Helper
function getMoney(id) { return moneyStore.get(id) || 0; }
function setMoney(id, v) { moneyStore.set(id, Math.max(0, Math.floor(v))); }
function addMoney(id, v) { setMoney(id, getMoney(id) + v); }
function removeMoney(id, v) {
    if (getMoney(id) < v) return false;
    setMoney(id, getMoney(id) - v);
    return true;
}
function refundMoney(id, v) { setMoney(id, getMoney(id) + v); }

// Sendet Geldstand an Client
function sendUpdate(id) {
    emitNet('money:update', id, getMoney(id));
}

/**
 * Client fordert Geldstand an.
 * Erstellt neuen Spieler mit Startgeld wenn unbekannt.
 */
onNet('money:get', () => {
    const id = source;
    if (!moneyStore.has(id)) {
        setMoney(id, moneyCfg.startMoney);
    }
    sendUpdate(id);
});

/** Internes Event: Geld abziehen */
on('money:remove', (id, v) => {
    const ok = removeMoney(id, v);
    if (ok) sendUpdate(id);
    emit('money:removeResult', id, ok, v);
});

/** Internes Event: Geld erstatten (z.B. bei gesperrtem Spawn) */
on('money:refund', (id, v) => {
    refundMoney(id, v);
    sendUpdate(id);
});

/** Spieler hat sich getrennt → Geld aus Speicher entfernen */
on('playerDropped', (reason) => {
    const id = source;
    moneyStore.delete(id);
});

/** Admin-Befehl: /addmoney [Spieler-ID] [Betrag] */
RegisterCommand('addmoney', (src, args) => {
    const targetId = parseInt(args[0], 10);
    const amount = parseInt(args[1], 10);
    if (isNaN(targetId) || isNaN(amount)) {
        emitNet('chat:addMessage', src, { args: ['/addmoney [ID] [Betrag]'] });
        return;
    }
    addMoney(targetId, amount);
    sendUpdate(targetId);
    emitNet('chat:addMessage', targetId, { args: ['Dir wurden ' + amount + '$ gutgeschrieben!'] });
}, false);
