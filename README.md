# Authentication-Website-Template
A website that sets up a user database and allows for a 2FA code to be added for security


The database is very insecure, no cyber security practices are being used. Please be advised that if you use this template, you must secure the database thoroughly before making your site public facing.

This site should be hosted on a linux server.

Required:

PostgreSQL

Node.js

Optional but recommended:

tmux

# How to use

Start by installing the packages above with:

sudo apt update

sudo apt upgrade -y

sudo apt install -y postgresql postgresql-contrib

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

sudo apt install -y nodejs

# Optional but recommended

sudo apt install -y tmux

# --- Install Node.js dependencies from package.json ---

### Run this inside the project backend directory

npm install


### Next, set up your database by using the bash script I created called setup_database.bash. Do this while in the backend directory:

chmod +x ./setup_database.bash

./setup_database.bash

### Once that's done, you can start up a tmux client with:

tmux new -s server

And connect to it with

tmux attach -t server

### From there, start your server (make sure you are in the backend directory):

node server.js

### To detach from the tmux client hit:

ctrl+b

d
