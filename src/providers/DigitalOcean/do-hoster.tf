variable "do_token" {}
variable "ssh_key_name" {}
variable "ssh_key_path" {}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_ssh_key" "ssh" {
  name = var.ssh_key_name
  public_key = file(var.ssh_key_path)
}

output "ssh_id" {
  value = digitalocean_ssh_key.ssh.id
}
