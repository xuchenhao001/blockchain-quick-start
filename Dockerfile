FROM node:8.11.3

COPY . /cics-blockchain/

RUN set -ex \
    && cd cics-blockchain \
    && mv docker-entrypoint.sh /usr/local/bin/ \
    && npm install 

EXPOSE 3414
ENTRYPOINT ["docker-entrypoint.sh"]

