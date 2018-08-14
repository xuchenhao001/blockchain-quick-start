#!/bin/bash

function modifyNetwork() {
	if [ -f "/docker-entrypoint-initdb.d/config.json" ]; then
		echo "File \"/docker-entrypoint-initdb.d/config.json\" exists."
		echo "Replace \"app/platform/fabric/config.json\" with the new one."
		cp /docker-entrypoint-initdb.d/config.json app/platform/fabric/config.json
	fi
}

function modifyDB() {
	if [ -f "/docker-entrypoint-initdb.d/config.json" ]; then
		echo "File \"/docker-entrypoint-initdb.d/pgconfig.json\" exists."
		echo "Replace \"app/persistence/postgreSQL/db/pgconfig.json\" with the new one."
		cp /docker-entrypoint-initdb.d/pgconfig.json app/persistence/postgreSQL/db/pgconfig.json
	fi
}

function startApp() {
	rm -rf /tmp/fabric-client-kvs_peerOrg*
	node main.js
}

cd blockchain-explorer/
modifyNetwork
modifyDB
startApp

