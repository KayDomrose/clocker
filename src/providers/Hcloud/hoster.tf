variable "hcloud_token" {}
variable "ssh_key_name" {}
variable "ssh_key_path" {}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_ssh_key" "ssh" {
  name = var.ssh_key_name
  public_key = file(var.ssh_key_path)
}

output "ssh_id" {
  value = hcloud_ssh_key.ssh.id
}
