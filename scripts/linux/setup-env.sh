#!/bin/bash

sudo mkdir -p /opt/<%= appName %>/
sudo mkdir -p /opt/<%= appName %>/config
sudo mkdir -p /opt/<%= appName %>/tmp

sudo chown ${USER} /opt/<%= appName %> -R

if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  sudo chown ${USER} /etc/
  sudo chown ${USER} /etc/systemd
  sudo chown ${USER} /etc/systemd/system
  sudo npm install -g wait-for-mongodb node-gyp
else
  sudo chown ${USER} /etc/
  sudo chown ${USER} /etc/init
  sudo npm install -g forever userdown wait-for-mongodb node-gyp
fi

# Creating a non-privileged user
sudo useradd meteoruser || :
