#!/bin/bash

if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  sudo chown root /etc/
  sudo chown root /etc/systemd
  sudo chown root /etc/systemd/system
  sudo systemctl daemon-reload
else
  sudo chown root /etc/
  sudo chown root /etc/init
fi