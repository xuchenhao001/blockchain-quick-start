FROM node:8.11.3

COPY . /blockchain-quick-start/

RUN set -ex \
    && cd /blockchain-quick-start \
    && mv docker-entrypoint.sh /usr/local/bin/ \
    && mv configtxgen /usr/local/bin/ \
    && npm install 

EXPOSE 3414
ENTRYPOINT ["docker-entrypoint.sh"]

