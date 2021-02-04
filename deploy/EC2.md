# EC2 Amazon Linux 2

```
sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user

sudo chkconfig docker on # autostart docker
sudo yum install -y git
sudo reboot

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version # yay

# install node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
node -e "console.log('Running Node.js ' + process.version)"

# setup ssh key
sudo ssh-keygen -t rsa -C "dev@cass.si" -b 4096
sudo cat /root/.ssh/id_rsa.pub

# add public key to github ssh keys to be able to clone repo
git clone git@github.com:StageUp/core.git

# don't compile dist on ec2 otherwise node will run of of heap
scp -i key.pem ec2-user@ip:
```

