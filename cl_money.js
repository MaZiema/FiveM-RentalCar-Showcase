// Geld-Client: Empfängt Updates und sendet Init-Request

let currentMoney = 0;

onNet('money:update', (amount) => {
    currentMoney = amount;
    SendNUIMessage({ type: 'updateMoney', money: amount });
});

on('onResourceStart', () => {
    emitNet('money:get');
});

// Fallback falls erster Request fehlschlägt
setTimeout(() => {
    if (currentMoney === 0) emitNet('money:get');
}, 3000);
