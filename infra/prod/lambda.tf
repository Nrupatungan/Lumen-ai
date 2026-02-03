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

  # Placeholder only — real code is deployed by CI
  filename = "${path.module}/artifacts/placeholder.zip"

  environment {
    variables = {
      NODE_ENV      = "production"
      MONGO_DB_NAME = var.project

      # Secret identifiers (NOT secret values)
      MONGO_URI                = "${var.project}/${var.environment}/mongo_uri"
      UPSTASH_REDIS_REST_URL   = "${var.project}/${var.environment}/upstash_redis_url"
      UPSTASH_REDIS_REST_TOKEN = "${var.project}/${var.environment}/upstash_redis_token"

      TEXT_EXTRACT_QUEUE_URL = aws_sqs_queue.main["text-extract"].url
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

  # Placeholder only
  filename = "${path.module}/artifacts/placeholder.zip"

  environment {
    variables = {
      NODE_ENV      = "production"
      MONGO_DB_NAME = var.project

      MONGO_URI                = "${var.project}/${var.environment}/mongo_uri"
      UPSTASH_REDIS_REST_URL   = "${var.project}/${var.environment}/upstash_redis_url"
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
