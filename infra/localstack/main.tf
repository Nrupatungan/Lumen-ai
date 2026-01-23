terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  access_key                  = "test"
  secret_key                  = "test"
  region                      = "us-east-1"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3         = "http://localhost:4566"
    sqs        = "http://localhost:4566"
  }

  retry_mode = "standard"
  max_retries = 5
}

# -------------------------------
# S3 (document storage)
# -------------------------------
resource "aws_s3_bucket" "documents" {
  bucket = "lumen-s3"
  force_destroy = true
}

# -------------------------------
# SQS Queues + DLQs
# -------------------------------
locals {
  queues = {
    /*
      For future implementation
      ocr_extract          = "document-ocr-extract"
    */
    document_ingest        = "document-ingest"
    text_extract           = "document-text-extract"
    chunk_embed            = "document-chunk-embed"
    document_delete        = "document-delete"
  }
}

# DLQs
resource "aws_sqs_queue" "dlq" {
  for_each = local.queues

  name = "${each.value}-dlq"
}

# Main queues with redrive
resource "aws_sqs_queue" "main" {
  for_each = local.queues

  name = each.value

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 5
  })
}

