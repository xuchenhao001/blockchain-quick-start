FROM node:8.11.3

RUN set -ex \
    && wget https://github.com/hyperledger/blockchain-explorer/archive/v0.3.4.tar.gz \
    && tar -zxf v0.3.4.tar.gz \
    && rm v0.3.4.tar.gz \
    && mv blockchain-explorer-0.3.4 blockchain-explorer \
    && cd blockchain-explorer \
    && npm install \
    && cd client/ \
    && npm install \
    && npm run build \
    && mkdir /docker-entrypoint-initdb.d

COPY docker-entrypoint.sh ./

EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]

