if test -f /etc/os-release; then
  sudo service <%= appName %> stop
else
  sudo stop <%= appName %> || :
fi
