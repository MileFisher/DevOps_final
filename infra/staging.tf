resource "aws_key_pair" "StagingKey" {
	key_name = var.staging_key
	public_key = var.staging_pub_key

	tags = {
		Project = var.project_tag_val
	}
}

resource "aws_instance" "StagingServer" {
	ami = data.aws_ami.ubuntu.id
	instance_type = var.instance_type

	key_name = resource.aws_key_pair.StagingKey.key_name
	
	subnet_id = resource.aws_subnet.DevopsFinalPublicSubnet.id
	vpc_security_group_ids = [resource.aws_security_group.DevopsFinalSG.id]

	associate_public_ip_address = true
	
	tags = {
		Name = var.staging_name
		Project = var.project_tag_val
		Type = "Staging"
	}
}

resource "aws_eip" "StagingServerEip" {
	domain = "vpc"
	instance = resource.aws_instance.StagingServer.id
	depends_on = [resource.aws_internet_gateway.gw]
}
