########################################
# Secrets Manager references
########################################

data "aws_secretsmanager_secret" "mongo_uri" {
  name = "${var.project}/${var.environment}/mongo_uri"
}

data "aws_secretsmanager_secret" "redis_url" {
  name = "${var.project}/${var.environment}/redis_url"
}

data "aws_secretsmanager_secret" "openai_api_key" {
  name = "${var.project}/${var.environment}/openai_api_key"
}

data "aws_secretsmanager_secret" "pinecone_api_key" {
  name = "${var.project}/${var.environment}/pinecone_api_key"
}

data "aws_secretsmanager_secret" "upstash_redis_url" {
  name = "${var.project}/${var.environment}/upstash_redis_url"
}

data "aws_secretsmanager_secret" "upstash_redis_token" {
  name = "${var.project}/${var.environment}/upstash_redis_token"
}

data "aws_secretsmanager_secret" "razorpay_key_id" {
  name = "${var.project}/${var.environment}/razorpay_key_id"
}

data "aws_secretsmanager_secret" "razorpay_key_secret" {
  name = "${var.project}/${var.environment}/razorpay_key_secret"
}

data "aws_secretsmanager_secret" "resend_api_key" {
  name = "${var.project}/${var.environment}/resend_api_key"
}