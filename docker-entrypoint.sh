#!/bin/bash

export CONTAINER_ENV=true

function startApp() {
	# start a configtxlator server first
	nohup configtxlator start > /dev/null 2>&1 &
	
	cd /blockchain-quick-start/
	# export HFC_LOGGING='{"debug":"console","info":"console"}'
	npm start
}

startApp

