#!/bin/bash

. /opt/<%= appName %>/config/env.sh

export NODE_ENV=production
export PWD=/opt/<%= appName %>/app

cd $PWD
/usr/bin/node main.js
