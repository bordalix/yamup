#!/bin/bash

if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  sudo service <%= appName %> restart
else
  sudo stop <%= appName %> || :
  sudo start <%= appName %> || :
fi