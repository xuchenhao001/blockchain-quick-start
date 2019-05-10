FROM node:10.13.0-alpine

COPY . /blockchain-quick-start/

RUN set -ex \
    && cd /blockchain-quick-start \
    && mv docker-entrypoint.sh /usr/local/bin/ \
    && mv configtx* /usr/local/bin/ \
    # for chinese users
    # && npm config set registry https://r.cnpmjs.org \
    # prepare build env for node-gyp
    && apk add --no-cache make gcc g++ python \
    && npm install --build-from-source \
    && apk del make gcc g++ python

EXPOSE 3414
ENTRYPOINT ["docker-entrypoint.sh"]

