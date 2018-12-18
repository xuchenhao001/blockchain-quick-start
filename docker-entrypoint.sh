#!/bin/bash

export CONTAINER_ENV=true

function startApp() {
	cd /blockchain-quick-start/
        # export HFC_LOGGING='{"debug":"console","info":"console"}'
	npm start
}

startApp

