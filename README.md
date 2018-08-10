# CICS ZCEE Blockchain workshop demo

Here we have the blockchain part of this demo.

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
# Install Node.js
wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
tar -xf node-v8.11.3-linux-x64.tar.xz
mv node-v8.11.3-linux-x64 /usr/local/node
echo 'export PATH=/usr/local/node/bin:$PATH' >> /etc/profile
source /etc/profile
node --version
npm --version
```

## Clone this repo

Clone this repo and install Node.js dependences:

```bash
git clone https://github.com/xuchenhao001/cics-blockchain.git
cd cics-blockchain
npm install --unsafe-perm
```

## Start blockchain network

Go to the dir `sample-network`, and start the Fabric network by doing this:

```bash
./byfn.sh up
```

Then Press `Enter` and wait for the Fabric network successfully running.

## Start REST server

Make sure you have sucessfully installed Node.js dependences, and run this in project directory:

```bash
npm start
```

## REST API

### Query

POST  `http://<your-host-ip>:3000/query`

```json
{
    "args": ["testAccount"]
}
```

Successful reply:

```json
{
    "status": "200",
    "result": 120
}
```

Failed reply:

```json
{
    "status": "500",
    "result": "Error: Incorrect number of arguments. Expecting account of the person to query"
}
```

### Invoke

POST `http://<your-host-ip>:3000/invoke`

```json
{
    "args": ["testAccount", "414", "details"]
}
```

Successful reply:

```json
{
    "status": "200",
    "result": "f9294e6a5783b72060ab54074db024aacd14fe6eab702f1021eedc2fb59851c2"
}
```

Failed reply:

```json
{
    "status": "500",
    "result": "Failed to invoke chaincode. cause:invoke chaincode proposal was bad"
}
```



