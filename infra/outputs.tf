output "DevopsServerIp" {
	description = "IP of the EC2 instance"
	value = resource.aws_eip.DevopsFinalServerEip.public_ip
}

