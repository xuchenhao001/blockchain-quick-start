# Blockchain rest server demo

Here we have this demo includes 3 parts: blockchain rest server, blockchain explorer, and a sample blockchain network.

## Prerequiste

* Ubuntu 16.04 amd64
* Docker
* Docker-compose
* Node.js

About how to install these dependences: (do these as `root` user)

```bash
# Install Docker
apt update
apt install -y docker.io
docker version
# Install Docker-compose
wget https://github.com/docker/compose/releases/download/1.22.0/docker-compose-Linux-x86_64
mv docker-compose-Linux-x86_64 /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose version
```

Clone this repo:

```bash
git clone https://github.com/xuchenhao001/blockchain-quick-start.git
```

## Start blockchain network

Go to the dir `sample-network`, and start the Fabric network by doing this:

```bash
cd blockchain-quick-start/sample-network/
./byfn.sh up
```

Then Press `Enter` and wait for the Fabric network successfully running.

## Start REST server

Build docker image:

```bash
cd blockchain-quick-start/
./build-docker-image.sh
```

Start server:

```bash
docker-compose up -d
```

When the server is up, open `http://<your-host-ip>:3414/` with your browser, you can see `swagger` page there with all of the REST API descriptions.

## Start blockchain explorer

Build docker image:

```bash
cd blockchain-quick-start/blockchain-explorer
./build-docker-image.sh
```

Start server:

```bash
docker-compose up -d
```

When the server is up, open `http://<your-host-ip>:8080/` with your browser, you can see the `blockchian-explorer` page running normally.