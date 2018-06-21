#!/bin/bash

# Remove the lock
set +e
sudo rm /var/lib/dpkg/lock > /dev/null
sudo rm /var/cache/apt/archives/lock > /dev/null
sudo dpkg --configure -a
set -e

#sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
#echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
if [[ `lsb_release -a 2> /dev/null` =~ Release:.*1[6|8]\. ]]; then
  sudo rm -f /etc/init/mongod.conf
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
else
  echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
fi

sudo apt-get update -y
sudo apt-get install mongodb-org mongodb-org-server mongodb-org-shell mongodb-org-tools -y

# Restart mongodb
if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  sudo service mongod restart
else
  if [[ `lsb_release -a 2> /dev/null` =~ Release:.*18\. ]]; then
    sudo systemctl stop mongod.service
    sudo systemctl start mongod.service
    sudo systemctl enable mongod.service
  else
    sudo stop mongod || :
    sudo start mongod
  fi
fi
