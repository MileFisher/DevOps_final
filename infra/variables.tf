variable "instance_name" {
	description = "Value of the EC2 instance's Name tag."
	type = string
	default = "DevopsFinal"
}

variable "instance_type" {
	description = "The EC2 instance's type"
	type = string
	default = "t3.micro"
}

variable "key_name" {
	description = "Name of Key pair"
	type = string
	default = "SawBawDevopsFinalKey"
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

variable "staging_key" {
	description = "Name of Staging Server's key"
	type = string
	default = "StagingKey"
}

variable "staging_pub_key" {
	description = "Value of staging public key"
	type = string
	sensitive = true
}

variable "staging_name" {
	description = "Name of staging server"
	type = string
	default = "StagingServer"
}
