variable "instance_name" {
	description = "Value of the EC2 instance's Name tag."
	type = string
	default = "devOpsFinal"
}

variable "instance_type" {
	description = "The EC2 instance's type"
	type = string
	default = "t3.micro"
}

variable "key_name" {
	description = "Name of Key pair"
	type = string
	default = "SawBawDevOpsFinalKey"
}

variable "pub_key" {
	description = "Value of public key"
	type = string
	sensitive = true
}

variable "project_tag_val" {
	description = "Value of Project tag"
	type = string
	default = "DevopsFinal"
}
