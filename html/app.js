// NUI: Verarbeitet Messages vom Client und aktualisiert das UI

const moneyEl = document.getElementById('money');
const notifyEl = document.getElementById('notify');
const menuEl = document.getElementById('menu');
const menuMoneyEl = document.getElementById('menuMoney');
let notifyTimer = null;

window.addEventListener('message', (event) => {
    const d = event.data;
    switch (d.type) {
        case 'updateMoney':
            moneyEl.textContent = d.money.toLocaleString() + '$';
            menuMoneyEl.textContent = 'Dein Geld: ' + d.money.toLocaleString() + '$';
            break;
        case 'openMenu':
            menuEl.classList.add('show');
            break;
        case 'closeMenu':
            menuEl.classList.remove('show');
            break;
        case 'notify':
            if (notifyTimer) clearTimeout(notifyTimer);
            notifyEl.textContent = d.message;
            notifyEl.className = 'show ' + (d.success ? 'success' : 'error');
            notifyTimer = setTimeout(() => { notifyEl.className = ''; }, 5000);
            break;
        default:
            break;
    }
});
