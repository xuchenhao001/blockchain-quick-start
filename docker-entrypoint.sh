#!/bin/bash

export CONTAINER_ENV=true

function startApp() {
	cd /blockchain-quick-start/
	npm start
}

startApp

