#!/bin/bash

set -eu

apt-get update -y && apt-get upgrade -y

# Install vim
apt-get install -y vim

# Install docker
apt install -y  apt-transport-https ca-certificates curl gnupg2 software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update -y
apt-cache policy docker-ce
apt install -y docker-ce

# Create user
USERNAME=worker
mkdir -p /home/"$USERNAME"/.ssh
cp /root/.ssh/authorized_keys /home/"$USERNAME"/.ssh/authorized_keys
useradd -d /home/"$USERNAME" "$USERNAME"
chown -R "$USERNAME":"$USERNAME" /home/"$USERNAME"
chmod 0700 /home/"$USERNAME"/.ssh
sudo usermod --shell /bin/bash "$USERNAME"
usermod -aG docker "$USERNAME"

# Install nginx
apt install -y nginx

# Run test container
DOCKER_TEST_IMAGE=tutum/hello-world
DOCKER_TEST_PORT=11111
docker run -d -p "$DOCKER_TEST_PORT":80 "$DOCKER_TEST_IMAGE"
