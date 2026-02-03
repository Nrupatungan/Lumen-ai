########################################
# Lambda artifacts (tracked by Terraform)
########################################

data "archive_file" "ingestion_router" {
  type        = "zip"
  source_dir  = "${path.module}/../../apps/lambdas/dist/ingestion-router"
  output_path = "${path.module}/artifacts/ingestion-router.zip"
}

data "archive_file" "usage_sync" {
  type        = "zip"
  source_dir  = "${path.module}/../../apps/lambdas/dist/usage-sync"
  output_path = "${path.module}/artifacts/usage-sync.zip"
}

########################################
# Lambda — Ingestion Router
########################################

resource "aws_lambda_function" "ingestion_router" {
  function_name = "${var.project}-ingestion-router"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "handler.handler"
  timeout       = 30
  memory_size  = 512

  filename         = data.archive_file.ingestion_router.output_path
  source_code_hash = data.archive_file.ingestion_router.output_base64sha256

  environment {
    variables = {
      NODE_ENV        = "production"
      MONGO_DB_NAME = var.project
      # OCR_EXTRACT_QUEUE_URL
      TEXT_EXTRACT_QUEUE_URL  = aws_sqs_queue.main["text-extract"].url
      MONGO_URI = "${var.project}/${var.environment}/mongo_uri"
      UPSTASH_REDIS_REST_URL = "${var.project}/${var.environment}/upstash_redis_url"
      UPSTASH_REDIS_REST_TOKEN = "${var.project}/${var.environment}/upstash_redis_token"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs_attach,
    aws_iam_role_policy_attachment.lambda_secrets_attach,
    aws_iam_role_policy_attachment.lambda_sqs_attach,
    aws_iam_role_policy_attachment.lambda_s3_attach,
  ]
}

########################################
# SQS → Ingestion Router
########################################

resource "aws_lambda_event_source_mapping" "ingest_router_sqs" {
  event_source_arn = aws_sqs_queue.main["document-ingest"].arn
  function_name    = aws_lambda_function.ingestion_router.arn
  batch_size       = 5
}

########################################
# Lambda — Usage Sync
########################################

resource "aws_lambda_function" "usage_sync" {
  function_name = "${var.project}-usage-sync"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "handler.handler"
  timeout       = 30
  memory_size  = 512

  filename         = data.archive_file.usage_sync.output_path
  source_code_hash = data.archive_file.usage_sync.output_base64sha256

  environment {
    variables = {
      NODE_ENV      = "production"
      MONGO_DB_NAME = var.project
      MONGO_URI     = "${var.project}/${var.environment}/mongo_uri"
      UPSTASH_REDIS_REST_URL = "${var.project}/${var.environment}/upstash_redis_url"
      UPSTASH_REDIS_REST_TOKEN = "${var.project}/${var.environment}/upstash_redis_token"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs_attach,
    aws_iam_role_policy_attachment.lambda_secrets_attach,
    aws_iam_role_policy_attachment.lambda_sqs_attach,
    aws_iam_role_policy_attachment.lambda_s3_attach,
  ]

}

