# Yet Another Meteor UP


#### Production Quality Meteor Deployments

Yet Another Meteor UP (yamup for short) is a command line tool that allows you to deploy any [Meteor](http://meteor.com) app to your own server. It supports only Debian/Ubuntu flavours. (PRs are welcome)

You can install and use yamup from Linux, Mac.

Yet Another Meteor UP (yamup) does not use docker containers like all the rest MUP forks, it's based on the original MUP, but updated for modern Meteor times.

**Note:** I Can confirm this branch works with Meteor 1.5 Node 4.8.4 and MongoDB 3.2 and an Ubuntu 14 EC2 instance.

**Note:** I Can confirm this branch works with Meteor 1.6 Node 8.9.1 and MongoDB 3.2 and an Ubuntu 14/16/18 EC2 instance.

> Screencast: [How to deploy a Meteor app with Meteor Up (by Sacha Greif)](https://www.youtube.com/watch?v=WLGdXtZMmiI)

**Table of Contents**

- [Features](#features)
- [Server Configuration](#server-configuration)
    - [SSH-key-based authentication (with passphrase)](#ssh-keys-with-passphrase-or-ssh-agent-support)
- [Installation](#installation)
- [Creating a yamup Project](#creating-a-yamup-project)
- [Example File](#example-file)
- [Setting Up a Server](#setting-up-a-server)
- [Deploying an App](#deploying-an-app)
- [Additional Setup/Deploy Information](#additional-setupdeploy-information)
    - [Server Setup Details](#server-setup-details)
    - [Deploy Wait Time](#deploy-wait-time)
    - [Multiple Deployment Targets](#multiple-deployment-targets)
- [Access Logs](#access-logs)
- [Reconfiguring & Restarting](#reconfiguring--restarting)
- [Accessing the Database](#accessing-the-database)
- [Multiple Deployments](#multiple-deployments)
- [Server Specific Environment Variables](#server-specific-environment-variables)
- [SSL Support](#ssl-support)
    - [Via nginx and let's encrypt](#via-nginx-and-lets-encrypt)
    - [Via stud](#via-stud)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

### Features

* Single command server setup
* Single command deployment
* Multi server deployment
* Environmental Variables management
* Support for [`settings.json`](http://docs.meteor.com/#meteor_settings)
* Password or Private Key(pem) based server authentication
* Access, logs from the terminal (supports log tailing)
* Support for multiple meteor deployments (experimental)

### Server Configuration

* Auto-Restart if the app crashed (using forever)
* Auto-Start after the server reboot (using upstart)
* Stepdown User Privileges
* Revert to the previous version, if the deployment failed
* Secured MongoDB Installation (Optional)
* Pre-Installed PhantomJS (Optional)

### Installation

Npm install

    sudo npm install -g yamup

Git clone

    sudo npm remove -g yamup # Only if you already installed yamup before
    git clone https://github.com/bordalix/yamup.git
    cd yamup
    sudo npm install -g

### Creating a yamup Project

    mkdir ~/my-meteor-deployment
    cd ~/my-meteor-deployment
    yamup init

This will create two files in your Meteor Up project directory:

  * yamup.json - yamup configuration file
  * settings.json - Settings for Meteor's [settings API](http://docs.meteor.com/#meteor_settings)

`yamup.json` is commented and easy to follow (it supports JavaScript comments).

### Example File

```js
{
  // Server authentication info
  "servers": [
    {
      "host": "hostname",
      "username": "root",
      "password": "password",
      // or pem file (ssh based authentication)
      //"pem": "~/.ssh/id_rsa",
      // Also, for non-standard ssh port use this
      //"sshOptions": { "port" : 49154 },
      // server specific environment variables
      "env": {}
    }
  ],

  // Install MongoDB on the server. Does not destroy the local MongoDB on future setups
  "setupMongo": true,

  // WARNING: Node.js is required! Only skip if you already have Node.js installed on server.
  "setupNode": true,

  // WARNING: nodeVersion defaults to 8.9.1 if omitted. Do not use v, just the version number.
  // For Meteor 1.5.*, use 4.8.4
  "nodeVersion": "8.9.1",

  // Install PhantomJS on the server
  "setupPhantom": true,

  // Show a progress bar during the upload of the bundle to the server.
  // Might cause an error in some rare cases if set to true, for instance in Shippable CI
  "enableUploadProgressBar": true,

  // Application name (no spaces).
  "appName": "meteor",

  // Location of app (local directory). This can reference '~' as the users home directory.
  // i.e., "app": "~/Meteor/my-app",
  // This is the same as the line below.
  "app": "/Users/bordalix/Meteor/my-app",

  // Configure environment
  // ROOT_URL must be set to https://YOURDOMAIN.com when using the spiderable package & force SSL
  // your NGINX proxy or Cloudflare. When using just Meteor on SSL without spiderable this is not necessary
  "env": {
    "PORT": 80,
    "ROOT_URL": "http://myapp.com",
    "MONGO_URL": "mongodb://bordalix:fd8dsjsfh7@hanso.mongohq.com:10023/MyApp",
    "MAIL_URL": "smtp://postmaster%40myapp.mailgun.org:adj87sjhd7s@smtp.mailgun.org:587/"
  },

  // yamup checks if the app comes online just after the deployment.
  // Before yamup checks that, it will wait for the number of seconds configured below.
  "deployCheckWaitTime": 15
}
```

### Setting Up a Server

    yamup setup

This will setup the server for the `yamup` deployments. It will take around 2-5 minutes depending on the server's performance and network availability.

### Deploying an App

    yamup deploy

This will bundle the Meteor project and deploy it to the server.

### Additional Setup/Deploy Information

#### Deploy Wait Time

yamup checks if the deployment is successful or not just after the deployment. By default, it will wait 10 seconds before the check. You can configure the wait time with the `deployCheckWaitTime` option in the `yamup.json`

#### SSH keys with passphrase (or ssh-agent support)

> This only tested with Mac/Linux

With the help of `ssh-agent`, `` can use SSH keys encrypted with a
passphrase.

Here's the process:

* First remove your `pem` field from the `yamup.json`. So, your `yamup.json` only has the username and host only.
* Then start a ssh agent with `eval $(ssh-agent)`
* Then add your ssh key with `ssh-add <path-to-key>`
* Then you'll asked to enter the passphrase to the key
* After that simply invoke `yamup` commands and they'll just work
* Once you've deployed your app kill the ssh agent with `ssh-agent -k`

#### Ssh based authentication with `sudo`

**If your username is `root`, you don't need to follow these steps**

Please ensure your key file (pem) is not protected by a passphrase. Also the setup process will require NOPASSWD access to sudo. (Since Meteor needs port 80, sudo access is required.)

Make sure you also add your ssh key to the ```/YOUR_USERNAME/.ssh/authorized_keys``` list

You can add your user to the sudo group:

    sudo adduser *username*  sudo

And you also need to add NOPASSWD to the sudoers file:

    sudo visudo

    # replace this line
    %sudo  ALL=(ALL) ALL

    # by this line
    %sudo ALL=(ALL) NOPASSWD:ALL

When this process is not working you might encounter the following error:

    'sudo: no tty present and no askpass program specified'

#### Server Setup Details

This is how yamup will configure the server for you based on the given `appName` or using "meteor" as default appName. This information will help you customize the server for your needs.

* your app lives at `/opt/<appName>/app`
* yamup uses `upstart` or `systemd` depending on your Ubuntu version:
    * yamup uses `upstart` with a config file at `/etc/init/<appName>.conf` and you can start and stop the app with `sudo start <appName>` and `sudo stop <appName>`
    * yamup uses `systemd` with a config file at `/etc/systemd/system/<appName>.service` and you can start and stop the app with `sudo service <appName> start` and `sudo service <appName> stop`
* logs are located at: `/var/log/upstart/<appName>.log`
* MongoDB installed and bound to the local interface (cannot access from the outside)
* the database is named `<appName>`

For more information see [`lib/taskLists.js`](https://github.com/bordalix/yamup/blob/master/lib/taskLists.js).

#### Multiple Deployment Targets

You can use an array to deploy to multiple servers at once.

To deploy to *different* environments (e.g. staging, production, etc.), use separate yamup configurations in separate directories, with each directory containing separate `yamup.json` and `settings.json` files, and the `yamup.json` files' `app` field pointing back to your app's local directory.

#### Custom Meteor Binary

Sometimes, you might be using `mrt`, or Meteor from a git checkout. By default, yamup uses `meteor`. You can ask yamup to use the correct binary with the `meteorBinary` option.

~~~js
{
  ...
  "meteorBinary": "~/bin/meteor/meteor"
  ...
}
~~~

### Access Logs

    yamup logs -f

Mupc can tail logs from the server and supports all the options of `tail`.

### Reconfiguring & Restarting

After you've edit environmental variables or `settings.json`, you can reconfigure the app without deploying again. Use the following command to do update the settings and restart the app.

    yamup reconfig

If you want to stop, start or restart your app for any reason, you can use the following commands to manage it.

    yamup stop
    yamup start
    yamup restart

### Accessing the Database

You can't access the MongoDB from the outside the server. To access the MongoDB shell you need to log into your server via SSH first and then run the following command:

    mongo appName

### Server Specific Environment Variables

It is possible to provide server specific environment variables. Add the `env` object along with the server details in the `yamup.json`. Here's an example:

~~~js
{
  "servers": [
    {
      "host": "hostname",
      "username": "root",
      "password": "password",
      "env": {
        "SOME_ENV": "the-value"
      }
    }

  ...
}
~~~

By default, yamup adds `CLUSTER_ENDPOINT_URL` to make [cluster](https://github.com/meteorhacks/cluster) deployment simple. But you can override it by defining it yourself.

### Multiple Deployments

yamup supports multiple deployments to a single server. yamup only does the deployment; if you need to configure subdomains, you need to manually setup a reverse proxy yourself.

Let's assume, we need to deploy production and staging versions of the app to the same server. The production app runs on port 80 and the staging app runs on port 8000.

We need to have two separate yamup projects. For that, create two directories and initialize yamup and add the necessary configurations.

In the staging `yamup.json`, add a field called `appName` with the value `staging`. You can add any name you prefer instead of `staging`. Since we are running our staging app on port 8000, add an environment variable called `PORT` with the value 8000.

Now setup both projects and deploy as you need.

### SSL Support

You can enable SSL in two different ways, via [stud](https://github.com/bumptech/stud) (deprecated) or using nginx and let's encrypt (prefered method).

#### Via nginx and let's encrypt

**1 -** Configure a nginx site with a proxy_pass:

file: /etc/nginx/sites-available/example.com

```
server {
  listen 80;
  server_name example.com www.example.com;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  charset UTF-8;
  server_name example.com www.example.com;

  # meteor app
  location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**2 -** Check your nginx configuration sintax:

`sudo nginx -t`

**3 -** Install certbot:

```
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository universe
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot python-certbot-nginx
```

**4 -** Generate the certificates

`sudo certbot --nginx -d example.com -d www.example.com`

It should append this 2 lines to the file /etc/nginx/sites-available/example.com:

```
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem; # managed by Certbot
```

**5 -** Reload nginx:

`sudo nginx -s reload`

**6 -** Configure yamup without SSL, and on port 3001.

file: yamup.json

```
{
  // Server authentication info
  "servers": [
    {
      "host": "example.com",
      "username": "aws_username",
      "pem": "aws_pem_file.pem"
    }
  ],

  // Install MongoDB in the server, does not destroy local MongoDB on future setup
  "setupMongo": true,

  // WARNING: Node.js is required! Only skip if you already have Node.js installed on server.
  "setupNode": false,

  // WARNING: If nodeVersion omitted will setup 0.10.36 by default. Do not use v, only version number.
  "nodeVersion": "8.9.1",

  // Install PhantomJS in the server
  "setupPhantom": false,

  // Show a progress bar during the upload of the bundle to the server.
  // Might cause an error in some rare cases if set to true, for instance in Shippable CI
  "enableUploadProgressBar": true,

  // Application name (No spaces)
  "appName": "example",

  // Location of app (local directory)
  "app": "./",

  // Configure environment
  "env": {
    "PORT": 3001,
    "ROOT_URL": "https://example.com",
    "MONGO_URL": "mongodb://127.0.0.1/example"
  },

  // Meteor Up checks if the app comes online just after the deployment
  // before mup checks that, it will wait for no. of seconds configured below
  "deployCheckWaitTime": 15
}
```

**7 -** Deploy it with `yamup deploy` or `yamup reconfig` and you should have your site running with SSL via Let's Encrypt.

**8 -** To renew your certificates, just run on the server (you can put it on a cronjob also):

`sudo certbot --nginx renew`

**9 -** If you put the certificate renewal as a cronjob, you don't need to worry any more with SSL and certificates, and you can use yamup to simply build and deploy your Meteor app. Due to this, I don't plan to add support to Let's Encrypt directly.

More info on [this gist](https://gist.github.com/cecilemuller/a26737699a7e70a7093d4dc115915de8).

#### Via stud

**Note:** deprecated method.

yamup has built in SSL support. It uses [stud](https://github.com/bumptech/stud) SSL terminator for that. First you need to get a SSL certificate from some provider. This is how to do that:

* [First you need to generate a CSR file and the private key](http://www.rackspace.com/knowledge_center/article/generate-a-csr-with-openssl)
* Then purchase a SSL certificate.
* Then generate a SSL certificate from your SSL providers UI.
* Then that'll ask to provide the CSR file. Upload the CSR file we've generated.
* When asked to select your SSL server type, select it as nginx.
* Then you'll get a set of files (your domain certificate and CA files).

Now you need combine SSL certificate(s) with the private key and save it in the mup config directory as `ssl.pem`. Check this [guide](http://alexnj.com/blog/configuring-a-positivessl-certificate-with-stud) to do that.

Then add following configuration to your `yamup.json` file.

~~~js
{
  ...

  "ssl": {
    "pem": "./ssl.pem",
    //"backendPort": 80
  }

  ...
}
~~~

Now, simply do `yamup setup` and now you've the SSL support.

> * By default, it'll think your Meteor app is running on port 80. If it's not, change it with the `backendPort` configuration field.
> * SSL terminator will run on the default SSL port `443`
> * If you are using multiple servers, SSL terminators will run on the each server (This is made to work with [cluster](https://github.com/meteorhacks/cluster))
> * Right now, you can't have multiple SSL terminators running inside a single server

### Updating

To update `yamup` to the latest version, just type:

    npm update yamup -g

You should try and keep `yamup` up to date in order to keep up with the latest Meteor changes. But note that if you need to update your Node version, you'll have to run `yamup setup` again before deploying.

### Troubleshooting

#### Check Access

Your issue might not always be related to yamup. So make sure you can connect to your instance first, and that your credentials are working properly.

#### Check Logs
If you suddenly can't deploy your app anymore, first use the `yamup logs -f` command to check the logs for error messages.

One of the most common problems is your Node version getting out of date. In that case, see “Updating” section above.

#### Verbose Output
If you need to see the output of `` (to see more precisely where it's failing or hanging, for example), run it like so:

    DEBUG=* yamup <command>

where `<command>` is one of the `yamup` commands such as `setup`, `deploy`, etc.

#### Errors with bcrypt

Don't use bcrypt (`meteor npm uninstall bcrypt`) if after deployment your app crashes and outputs this type of errors ([more info](https://github.com/bordalix/yamup/issues/5#issuecomment-528758181)):
```
systemd[1]: Started testapp.
testapp[15111]: /usr/bin/node: symbol lookup error: /opt/testapp/app/programs/server/npm/node_modules/bcrypt/lib/binding/bcrypt_lib.node: undefined symbol: _ZN4node19GetCurrentEventLoopEPN2v87IsolateE
systemd[1]: testapp.service: Main process exited, code=exited, status=127/n/a
systemd[1]: testapp.service: Unit entered failed state.
systemd[1]: testapp.service: Failed with result 'exit-code'.
systemd[1]: testapp.service: Service hold-off time over, scheduling restart.
systemd[1]: Stopped testapp.
```

### Additional Resources

* [Using yamup with Nitrous.io](https://github.com/arunoda/meteor-up/wiki/Using-Meteor-Up-with-Nitrous.io)
* [Change Ownership of Additional Directories](https://github.com/arunoda/meteor-up/wiki/Change-Ownership-of-Additional-Directories)
* [Using yamup with NginX vhosts](https://github.com/arunoda/meteor-up/wiki/Using-Meteor-Up-with-NginX-vhosts)
