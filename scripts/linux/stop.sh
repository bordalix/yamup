if [[ `lsb_release -a 2> /dev/null` =~ Release:.*1[6|8]\. ]]; then
  sudo service <%= appName %> stop
else
  sudo stop <%= appName %> || :
fi