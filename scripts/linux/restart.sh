#!/bin/bash

if [[ `lsb_release -a 2> /dev/null` =~ Release:.*1[6|8]\. ]]; then
  sudo service <%= appName %> restart
else
  sudo stop <%= appName %> || :
  sudo start <%= appName %> || :
fi