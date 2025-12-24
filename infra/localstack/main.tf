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

  s3_force_path_style         = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3         = "http://localhost:4566"
    sqs        = "http://localhost:4566"
    lambda     = "http://localhost:4566"
    events     = "http://localhost:4566"
    iam        = "http://localhost:4566"
  }
}

# -------------------------------
# S3 (document storage)
# -------------------------------
resource "aws_s3_bucket" "documents" {
  bucket = "lumen-s3"
}

# -------------------------------
# SQS Queues + DLQs
# -------------------------------
locals {
  queues = {
    document_ingest        = "document-ingest"
    text_extract           = "document-text-extract"
    ocr_extract            = "document-ocr-extract"
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

# -------------------------------
# EventBridge (usage-sync cron)
# -------------------------------
resource "aws_cloudwatch_event_rule" "usage_sync" {
  name                = "usage-sync"
  schedule_expression = "rate(15 minutes)"
}

# -------------------------------
# IAM role for Lambdas
# -------------------------------
resource "aws_iam_role" "lambda_role" {
  name = "lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

# -------------------------------
# Lambda: ingestion-router
# -------------------------------
resource "aws_lambda_function" "ingestion_router" {
  function_name = "ingestion-router"
  role          = aws_iam_role.lambda_role.arn

  runtime = "nodejs20.x"
  handler = "handler.handler"

  filename         = "${path.module}/../../apps/lambdas/dist/ingestion-router.zip"
  source_code_hash = filebase64sha256("${path.module}/../../apps/lambdas/dist/ingestion-router.zip")

  environment {
    variables = {
      DOCUMENT_INGEST_QUEUE_URL = aws_sqs_queue.main["document_ingest"].url
      TEXT_EXTRACT_QUEUE_URL    = aws_sqs_queue.main["text_extract"].url
      OCR_EXTRACT_QUEUE_URL     = aws_sqs_queue.main["ocr_extract"].url
    }
  }
}


resource "aws_lambda_event_source_mapping" "ingestion_router_sqs" {
  event_source_arn = aws_sqs_queue.main["document_ingest"].arn
  function_name    = aws_lambda_function.ingestion_router.arn
  batch_size       = 5
}


# -------------------------------
# Lambda: usage-sync
# -------------------------------
resource "aws_lambda_function" "usage_sync" {
  function_name = "usage-sync"
  role          = aws_iam_role.lambda_role.arn

  runtime = "nodejs20.x"
  handler = "handler.handler"

  filename         = "${path.module}/../../apps/lambdas/dist/usage-sync.zip"
  source_code_hash = filebase64sha256("${path.module}/../../apps/lambdas/dist/usage-sync.zip")

  dead_letter_config {
    target_arn = aws_sqs_queue.usage_sync_dlq.arn
  }
}

resource "aws_cloudwatch_event_target" "usage_sync_target" {
  rule = aws_cloudwatch_event_rule.usage_sync.name
  arn  = aws_lambda_function.usage_sync.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.usage_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.usage_sync.arn
}

resource "aws_sqs_queue" "usage_sync_dlq" {
  name = "usage-sync-lambda-dlq"
}

# (Target wiring left for prod; local is enough to exist)