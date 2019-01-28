FROM node:8.11.3

COPY . /blockchain-quick-start/

RUN set -ex \
    && cd /blockchain-quick-start \
    && mv docker-entrypoint.sh /usr/local/bin/ \
    && mv configtx* /usr/local/bin/ \
    # for chinese users
    # && npm config set registry https://r.cnpmjs.org \
    && npm install --build-from-source \
    # bug fix for java ca integration
    && cp ./patch/fabric-client/lib/impl/ecdsa/key.js ./node_modules/fabric-client/lib/impl/ecdsa/key.js

EXPOSE 3414
ENTRYPOINT ["docker-entrypoint.sh"]

