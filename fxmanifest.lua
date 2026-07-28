fx_version "cerulean"
game "gta5"
author "xEvileyes"
description "Mietwagen-System"

client_scripts {
    "cl_rental.js",
    "cl_money.js"
}

server_scripts {
    "sv_rental.js",
    "sv_money.js"
}

ui_page "html/index.html"

files {
    "html/index.html",
    "html/style.css",
    "html/app.js"
}