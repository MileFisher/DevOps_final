output "DevopsServerIp" {
	description = "IP of the EC2 instance"
	value = resource.aws_eip.DevopsFinalServerEip.public_ip
}

output "NameServers" {
	description = "Name Servers of the Hosted Zone"
	value = resource.aws_route53_zone.primary.name_servers
}

