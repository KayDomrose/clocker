variable "hcloud_token" {}
variable "server_name" {}
variable "server_type" {}
variable "ssh_key_name" {}
variable "ssh_key_path" {}
variable "cloud_init_path" {}

data "template_cloudinit_config" "config" {
  gzip          = false
  base64_encode = false

  //  part {
//    content_type = "text/x-shellscript"
//    content      = <<PART
//#!/bin/bash
//cat <<EOF >/root/vars.sh
//STATIC_IP="1"
//EOF
//PART
//  }

  part {
    content_type = "text/x-shellscript"
    content      = file(var.cloud_init_path)
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_server" "server"  {
  name = var.server_name
  image = "debian-10"
  server_type = "cx11"
  location = "nbg1"
  ssh_keys = [
    hcloud_ssh_key.ssh.id
  ]
  user_data = data.template_cloudinit_config.config.rendered
}

resource "hcloud_ssh_key" "ssh" {
  name = var.ssh_key_name
  public_key = file(var.ssh_key_path)
}

output "ip_address" {
  value = hcloud_server.server.ipv4_address
}
