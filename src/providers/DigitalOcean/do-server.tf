variable "do_token" {}
variable "server_name" {}
variable "server_type" {}
variable "cloud_init_path" {}
variable "ssh_id" {}

provider "digitalocean" {
  token = var.do_token
}

data "template_cloudinit_config" "config" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/x-shellscript"
    content      = file(var.cloud_init_path)
  }
}

resource "digitalocean_droplet" "server"  {
  name = var.server_name
  region = "fra1"
  image = "debian-10-x64"
  size = var.server_type
  ssh_keys = [
    var.ssh_id
  ]
  user_data = data.template_cloudinit_config.config.rendered
}

output "ip_address" {
  value = digitalocean_droplet.server.ipv4_address
}

