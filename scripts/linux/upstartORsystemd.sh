#!/bin/bash

if [[ `lsb_release -a 2> /dev/null` =~ Release:.*1[6|8]\. ]]; then
  echo 'systemd'
else
  echo 'upstart'
fi