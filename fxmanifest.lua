fx_version "cerulean"
game "gta5"
author "DeinName"
description "Mietwagen-System (Node.js)"

client_scripts {
    "cl_zones.js",
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