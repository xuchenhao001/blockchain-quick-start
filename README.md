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

## Prepare Hyperledger Fabric images

You need to prepare all of the images before start a blockchain network (if not exists):

```bash
cd blockchain-quick-start/
./prepare-fabric.sh
```

> This may takes a while depends on your network status.

## Start blockchain network

Start the Fabric network by doing this:

```bash
./create-network.sh
# Chose "Y" for container env and "N" for dev env, Default is "Y"
```

> You can delete your network by doing `./delete-network.sh`.

Then Press `Enter` and wait for the Fabric network successfully running.

## Start REST server

Build docker image:

```bash
./build-docker-image.sh
```

Only need one shot to start the service:

```bash
docker-compose up -d
```

When the server is up, open `http://<your-host-ip>:3414/` with your browser, you can see `swagger` page there with all of the REST API descriptions.

:warning:The swagger page now is lack of maintenance. Please refer Restlet-Client test cases at the end of this doc.


## Start blockchain explorer

Make sure that you have already joined `Org1` to channel `mychannel`:

```bash
cd blockchain-explorer/
./start.sh
```

If not, go to `blockchain-explorer/config.json`, change those `mychannel` to your channel name that `Org1` has already joined.

When the server is up, open `http://<your-host-ip>:8080/` with your browser, you can see the `blockchian-explorer` page running normally.

## Test with Restlet-Client

There is a extension of Chrome browser named `Restlet-Client`, you could download it from Chrome Web Store.

After installed, import `test/restlet-client.json` and test the REST APIs of each scenario step-by-step.

## Delete All

```bash
cd blockchain-quick-start/
./delete-network.sh
```

