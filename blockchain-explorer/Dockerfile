FROM node:8.11.3

RUN set -ex \
    && wget https://github.com/hyperledger/blockchain-explorer/archive/v0.3.4.tar.gz \
    && tar -zxf v0.3.4.tar.gz \
    && rm v0.3.4.tar.gz \
    && mv blockchain-explorer-0.3.4 blockchain-explorer \
    && cd blockchain-explorer \
    # fabric 1.2 bug workaround
    && sed -i 's/DOWN/RUNNING/g' app/platform/fabric/Admin.js \  
    && npm config set registry https://r.cnpmjs.org \
    && npm install --prefer-offline \
    && cd client/ \
    && npm install \
    && npm run build \
    && mkdir /docker-entrypoint-initdb.d

COPY docker-entrypoint.sh /usr/local/bin/

EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]

