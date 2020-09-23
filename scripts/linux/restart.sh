#!/bin/bash

if test -f /etc/os-release; then
  sudo service <%= appName %> restart
else
  sudo stop <%= appName %> || :
  sudo start <%= appName %> || :
fi
