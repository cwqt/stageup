# EC2 Amazon Linux 2

```
ssh -i "key.pem" ec2-user@ec2-xxxxxxx.compute-1.amazonaws.com
```

```sh
cd /etc/yum.repos.d/
sudo yum-config-manager --add-repo http://fishshell.com/files/linux/RedHat_RHEL-6/fish.release:2.repo
sudo yum clean all
sudo yum -y install fish
cd ~/
fish

sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user

sudo chkconfig docker on # autostart docker
sudo yum install -y git
sudo reboot

# reconnect and continue
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version # yay

# install node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
node -e "console.log('Running Node.js ' + process.version)"

# setup ssh key
ssh-keygen -t rsa -C "dev@cass.si" -b 4096
cat ~/.ssh/id_rsa.pub

# https://github.com/settings/keys
# add public key to github ssh keys to be able to clone repo
git clone git@github.com:StageUp/core.git

# don't compile dist on ec2 otherwise node will run of of heap
echo "Run the following commands on host machine:"
echo "$ npm run build:staging"
echo "$ zip -r bundle ./dist/"
echo "$ scp -i ../../Downloads/stageup-staging.pem bundle.zip ec2-user@stageup.uk:~/."
read -n1 -s -r -p $'Press space to continue...\n' key

# back on ec2, unzip and boot the stack
unzip bundle.zip
# set .env.environment variables
docker-compose --env-file .env.environment up
```
