resource "aws_route53_zone" "primary" {
	name = "aqiu.click"
}

resource "aws_route53_record" "www" {
	zone_id = resource.aws_route53_zone.primary.zone_id
	name = "www.aqiu.click"
	type = "A"
	ttl = 300
	records = [resource.aws_eip.DevopsFinalServerEip.public_ip]
}

resource "aws_route53_record" "root" {
	zone_id = resource.aws_route53_zone.primary.zone_id
	name = "aqiu.click"
	type = "A"
	ttl = 300
	records = [resource.aws_eip.DevopsFinalServerEip.public_ip]
}

resource "aws_route53_record" "staging" {
	zone_id = resource.aws_route53_zone.primary.zone_id
	name = "staging.aqiu.click"
	type = "A"
	ttl = 300
	records = [resource.aws_eip.StagingServerEip.public_ip]
}
