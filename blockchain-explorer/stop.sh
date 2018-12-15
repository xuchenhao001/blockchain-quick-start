#!/bin/bash

docker rm -fv $(docker ps -a|grep blockchain-explorer|awk '{print $1}')
