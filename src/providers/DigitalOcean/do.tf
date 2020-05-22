variable "do_token" {}
variable "server_name" {}
variable "server_type" {}
variable "ssh_key_name" {}
variable "ssh_key_path" {}
variable "cloud_init_path" {}

data "template_cloudinit_config" "config" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/x-shellscript"
    content      = file(var.cloud_init_path)
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "server"  {
  name = var.server_name
  region = "fra1"
  image = "debian-10-x64"
  size = var.server_type
  ssh_keys = [
    digitalocean_ssh_key.ssh.id
  ]
  user_data = data.template_cloudinit_config.config.rendered
}

resource "digitalocean_ssh_key" "ssh" {
  name = var.ssh_key_name
  public_key = file(var.ssh_key_path)
}

output "ip_address" {
  value = digitalocean_droplet.server.ipv4_address
}
