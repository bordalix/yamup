#!/bin/bash

if test -f /etc/os-release; then
  echo 'systemd'
else
  echo 'upstart'
fi
