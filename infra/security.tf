resource "aws_vpc" "DevopsFinalVpc" {
	cidr_block = "10.0.0.0/24"

	tags = {
		Name = "DevopsFinalSubnet"
	}
}

resource "aws_internet_gateway" "gw" {
	vpc_id = resource.aws_vpc.DevopsFinalVpc.id
	
	tags = {
		Name = "DevopsFinalInternetGateway"
	}
}

resource "aws_route_table" "DevopsFinalRouteTable" {
	vpc_id = resource.aws_vpc.DevopsFinalVpc.id
	
	route {
		cidr_block = "0.0.0.0/0"
		gateway_id = resource.aws_internet_gateway.gw.id
	}

	tags = {
		Name = "DevopsFinalRouteTable"
	}
}

resource "aws_subnet" "DevopsFinalPublicSubnet" {
	cidr_block = "10.0.0.64/26"
	vpc_id = resource.aws_vpc.DevopsFinalVpc.id

	tags = {
		Name = "DevopsFinalPublicSubnet"
	}
}

resource "aws_route_table_association" "DevopsRTA" {
	subnet_id = resource.aws_subnet.DevopsFinalPublicSubnet.id
	route_table_id = resource.aws_route_table.DevopsFinalRouteTable.id
}


resource "aws_security_group" "DevopsFinalSG" {
	name = "DevopsFinalSecurityGroup"
	description = "Allows SSH, HTTP and HTTPS"
	vpc_id = aws_vpc.DevopsFinalVpc.id
	depends_on = [resource.aws_vpc.DevopsFinalVpc]

	tags = {
		Project = var.project_tag_val
	}
}

resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
	security_group_id = resource.aws_security_group.DevopsFinalSG.id
	cidr_ipv4 = "0.0.0.0/0"
	from_port = 22
	ip_protocol = "tcp"
	to_port = 22

	tags = {
		Project = var.project_tag_val
	}
}

resource "aws_vpc_security_group_ingress_rule" "allow_pings" {
	security_group_id = resource.aws_security_group.DevopsFinalSG.id
	from_port = -1
	to_port = -1
	ip_protocol = "icmp"
	cidr_ipv4 = "0.0.0.0/0"

	tags = {
		Project = var.project_tag_val
	}
}
resource "aws_vpc_security_group_ingress_rule" "allow_https" {
	security_group_id = resource.aws_security_group.DevopsFinalSG.id
	cidr_ipv4 = "0.0.0.0/0"
	from_port = 443
	ip_protocol = "tcp"
	to_port = 443

	tags = {
		Project = var.project_tag_val
	}
}

resource "aws_vpc_security_group_ingress_rule" "allow_http" {
	security_group_id = resource.aws_security_group.DevopsFinalSG.id
	cidr_ipv4 = "0.0.0.0/0"
	from_port = 80
	ip_protocol = "tcp"
	to_port = 80

	tags = {
		Project = var.project_tag_val
	}
}

resource "aws_vpc_security_group_egress_rule" "allow_all_outbound_traffic" {
	security_group_id = resource.aws_security_group.DevopsFinalSG.id
	cidr_ipv4 = "0.0.0.0/0"
	ip_protocol = -1

	tags = {
		Project = var.project_tag_val
	}
}
