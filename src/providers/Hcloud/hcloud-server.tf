variable "hcloud_token" {}
variable "server_name" {}
variable "server_type" {}
variable "ssh_id" {}
variable "cloud_init_path" {}

provider "hcloud" {
  token = var.hcloud_token
}

data "template_cloudinit_config" "config" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/x-shellscript"
    content      = file(var.cloud_init_path)
  }
}

resource "hcloud_server" "server"  {
  name = var.server_name
  image = "debian-10"
  server_type = "cx11"
  location = "nbg1"
  ssh_keys = [
    var.ssh_id
  ]
  user_data = data.template_cloudinit_config.config.rendered
}

output "ip_address" {
  value = hcloud_server.server.ipv4_address
}
