// Geld-Client: Empfängt Geld-Updates und sendet Init-Request

let currentMoney = 0;

// Server sendet aktualisierten Geldstand
onNet('money:update', (amount) => {
    currentMoney = amount;
    SendNUIMessage({ type: 'updateMoney', money: amount });
});

// Bei Resource-Start: Geldstand vom Server anfordern
on('onResourceStart', () => {
    emitNet('money:get');
});

// Fallback: Falls erster Request fehlschlägt
setTimeout(() => {
    if (currentMoney === 0) emitNet('money:get');
}, 3000);
