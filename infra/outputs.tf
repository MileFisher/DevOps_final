output "DevOpsServerIp" {
	description = "IP of the EC2 instance"
	value = resource.aws_eip.devopsFinalServerEip.public_ip
}
