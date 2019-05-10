FROM node:10.15.1

COPY . /blockchain-quick-start/

RUN set -ex \
    && cd /blockchain-quick-start \
    && mv docker-entrypoint.sh /usr/local/bin/ \
    && mv configtx* /usr/local/bin/ \
    # for chinese users
    # && npm config set registry https://r.cnpmjs.org \
    && npm install --build-from-source

EXPOSE 3414
ENTRYPOINT ["docker-entrypoint.sh"]

