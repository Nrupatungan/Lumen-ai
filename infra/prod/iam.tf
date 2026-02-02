########################################
# IAM ROLES
########################################

# ------------------------------
# Lambda execution role
# ------------------------------
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ------------------------------
# ECS task execution role
# (pull images, write logs)
# ------------------------------
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project}-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_attach" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ------------------------------
# ECS task role (application permissions)
# ------------------------------
resource "aws_iam_role" "ecs_task" {
  name = "${var.project}-${var.environment}-ecs-task-role"

  assume_role_policy = aws_iam_role.ecs_execution.assume_role_policy
}

########################################
# IAM POLICIES
########################################

# ------------------------------
# Lambda CloudWatch logs
# ------------------------------
resource "aws_iam_policy" "lambda_logs" {
  name = "${var.project}-${var.environment}-lambda-logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_logs.arn
}

# ------------------------------
# SQS access (shared by ECS + Lambda)
# ------------------------------
resource "aws_iam_policy" "sqs_access" {
  name = "${var.project}-${var.environment}-sqs-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ]
      Resource = concat(
        values(aws_sqs_queue.main)[*].arn,
        values(aws_sqs_queue.dlq)[*].arn
      )
    }]
  })
}

########################################
# ECS Secrets Manager access
########################################
resource "aws_iam_policy" "ecs_secrets_access" {
  name = "${var.project}-${var.environment}-ecs-secrets-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = [
        data.aws_secretsmanager_secret.mongo_uri.arn,
        data.aws_secretsmanager_secret.redis_url.arn,
        data.aws_secretsmanager_secret.openai_api_key.arn,
        data.aws_secretsmanager_secret.pinecone_api_key.arn,
        data.aws_secretsmanager_secret.resend_api_key.arn,
        data.aws_secretsmanager_secret.razorpay_key_secret.arn,
        data.aws_secretsmanager_secret.razorpay_key_id.arn
      ]
    }]
  })
}


resource "aws_iam_role_policy_attachment" "ecs_secrets_attach" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_secrets_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_execution_secrets_attach" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_secrets_access.arn
}


########################################
# Lambda Secrets Manager access
########################################
resource "aws_iam_policy" "lambda_secrets_access" {
  name = "${var.project}-${var.environment}-lambda-secrets-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [
        data.aws_secretsmanager_secret.mongo_uri.arn,
        data.aws_secretsmanager_secret.upstash_redis_url.arn,
        data.aws_secretsmanager_secret.upstash_redis_token.arn
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_secrets_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_secrets_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_sqs_attach" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.sqs_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.sqs_access.arn
}

# ------------------------------
# S3 documents bucket access
# (shared by ECS + Lambda)
# ------------------------------
resource "aws_iam_policy" "s3_documents_access" {
  name = "${var.project}-${var.environment}-s3-documents-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Resource = "${aws_s3_bucket.documents.arn}/*"
    },
    {
      Effect = "Allow"
      Action = [
        "s3:ListBucket"
      ]
      Resource = "${aws_s3_bucket.documents.arn}"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_s3_attach" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.s3_documents_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.s3_documents_access.arn
}

resource "aws_iam_policy" "ecs_logs" {
  name = "${var.project}-${var.environment}-ecs-logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_logs_attach" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_logs.arn
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "worker" {
  repository = aws_ecr_repository.worker.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_iam_role" "codedeploy" {
  name = "${var.project}-${var.environment}-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codedeploy_ecs" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}
