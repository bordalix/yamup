#!/bin/bash

if test -f /etc/os-release; then
  sudo chown root /etc/
  sudo chown root /etc/systemd
  sudo chown root /etc/systemd/system
  sudo systemctl daemon-reload
  sudo systemctl enable <%= appName %>
else
  sudo chown root /etc/
  sudo chown root /etc/init
fi
