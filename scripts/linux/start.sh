if test -f /etc/os-release; then
  sudo service <%= appName %> start
else
  sudo start <%= appName %> || :
fi
