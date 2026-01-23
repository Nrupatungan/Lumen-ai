# ------------------------------
# ECS API logs
# ------------------------------
resource "aws_cloudwatch_log_group" "ecs_api" {
  name              = "/ecs/${var.project}-${var.environment}-api"
  retention_in_days = 14
}

# ------------------------------
# ECS Worker logs
# ------------------------------
resource "aws_cloudwatch_log_group" "ecs_worker" {
  name              = "/ecs/${var.project}-${var.environment}-worker"
  retention_in_days = 14
}

# ------------------------------
# Lambda: Ingestion Router
# ------------------------------
resource "aws_cloudwatch_log_group" "lambda_ingestion_router" {
  name              = "/aws/lambda/${var.project}-ingestion-router"
  retention_in_days = 14
}

# ------------------------------
# Lambda: Usage Sync
# ------------------------------
resource "aws_cloudwatch_log_group" "lambda_usage_sync" {
  name              = "/aws/lambda/${var.project}-usage-sync"
  retention_in_days = 14
}
