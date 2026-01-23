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