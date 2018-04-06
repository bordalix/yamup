#!/bin/bash

if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  echo 'systemd'
else
  echo 'upstart'
fi