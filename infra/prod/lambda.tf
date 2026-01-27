resource "aws_lambda_function" "ingestion_router" {
  function_name = "${var.project}-ingestion-router"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 30

  filename = "../../apps/lambdas/dist/ingestion-router.zip"

  environment {
    variables = {
      MONGO_DB_NAME = var.project
      # OCR_EXTRACT_QUEUE_URL
      TEXT_EXTRACT_QUEUE_URL  = aws_sqs_queue.main["text-extract"].url
      MONGO_URI = "${var.project}/${var.environment}/mongo_uri"
      UPSTASH_REDIS_REST_URL = "${var.project}/${var.environment}/upstash_redis_url"
      UPSTASH_REDIS_REST_TOKEN = "${var.project}/${var.environment}/upstash_redis_token"
    }
  }
}

resource "aws_lambda_event_source_mapping" "ingest_router_sqs" {
  event_source_arn = aws_sqs_queue.main["document-ingest"].arn
  function_name    = aws_lambda_function.ingestion_router.arn
  batch_size       = 5
}

resource "aws_lambda_function" "usage_sync" {
  function_name = "${var.project}-usage-sync"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 30

  filename = "../../apps/lambdas/dist/usage-sync.zip"

  environment {
    variables = {
      MONGO_DB_NAME = var.project
      MONGO_URI     = "${var.project}/${var.environment}/mongo_uri"
      UPSTASH_REDIS_REST_URL = "${var.project}/${var.environment}/upstash_redis_url"
      UPSTASH_REDIS_REST_TOKEN = "${var.project}/${var.environment}/upstash_redis_token"
    }
  }
}
