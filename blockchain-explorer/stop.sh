#!/bin/bash

CONTAINER=$(docker ps -a|grep blockchain-explorer|awk '{print $1}')
if [[ ${#CONTAINER} -gt 0 ]]; then
    docker rm -fv $(docker ps -a|grep blockchain-explorer|awk '{print $1}')
fi
