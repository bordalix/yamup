if [[ `lsb_release -a 2> /dev/null` =~ Release:.*16\. ]]; then
  sudo service <%= appName %> stop
else
  sudo stop <%= appName %> || :
fi