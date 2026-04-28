provider "aws" {
	region = "ap-southeast-2"
}

data "aws_ami" "ubuntu" {
	most_recent = true

	filter {
		name = "name"
		values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
	}

	owners = ["099720109477"]
}

resource "aws_key_pair" "DevopsFinalKey" {
	key_name = var.key_name
	public_key = var.pub_key

	tags = {
		Project = var.project_tag_val
	}
}

resource "aws_instance" "DevopsFinalServer" {
	ami = data.aws_ami.ubuntu.id
	instance_type = var.instance_type

	key_name = resource.aws_key_pair.DevopsFinalKey.key_name
	
	subnet_id = resource.aws_subnet.DevopsFinalPublicSubnet.id
	vpc_security_group_ids = [resource.aws_security_group.DevopsFinalSG.id]

	associate_public_ip_address = true
	depends_on = [resource.aws_vpc.DevopsFinalVpc, resource.aws_internet_gateway.gw]

	tags = {
		Name = var.instance_name
		Project = var.project_tag_val
		Type = "Production"
	}
}


resource "aws_eip" "DevopsFinalServerEip" {
	domain = "vpc"
	instance = resource.aws_instance.DevopsFinalServer.id
	depends_on = [resource.aws_internet_gateway.gw]
}
