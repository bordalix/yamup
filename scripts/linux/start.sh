if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  sudo service <%= appName %> start
else
  sudo start <%= appName %> || :
fi