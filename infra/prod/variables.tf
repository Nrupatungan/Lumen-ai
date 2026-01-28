variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "whitelist" {
  description = "Cors White List"
  type = list(string)
}

variable "frontend_url" {
  description = "Frontend Url"
  type = string
}

variable "resend_from_email" {
  description = "Resend From Email"
  type = string
}

variable "api_image_tag" {
  description = "Stores api image tag version"
  type = string
}

variable "auth_secret" {
  description = "Auth secret"
  type = string
}