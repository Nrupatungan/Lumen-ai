########################################
# ECS CLUSTER
########################################

resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}-cluster"
}

########################################
# ECS TASK DEFINITION — API
########################################

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-${var.environment}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 512
  memory = 1024

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image = "${aws_ecr_repository.api.repository_url}:${var.api_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "CORS_WHITELIST", value = jsonencode(var.whitelist) },
        { name = "FRONTEND_URL", value = var.frontend_url },
        { name = "PORT", value = "3000" },
        { name = "RESEND_FROM_EMAIL", value = var.resend_from_email },

        # SQS
        { name = "DOCUMENT_INGEST_QUEUE_URL", value = aws_sqs_queue.main["document-ingest"].url },
        { name = "DOCUMENT_DELETE_QUEUE_URL", value = aws_sqs_queue.main["document-delete"].url },

        # API tuning
        { name = "SALT_ROUNDS", value = "12" },
        { name = "DASHBOARD_ACCESS_CAP", value = "30" },
        { name = "EMAIL_VERIFY_TTL", value = "86400000" },
        { name = "PASSWORD_RESET_TTL", value = "3600000" },
        { name = "S3_SIGNED_URL_EXPIRY", value = "3600" },
        { name = "USAGE_TTL_SECONDS", value = "172800" },

        # S3
        { name = "S3_BUCKET_NAME", value = aws_s3_bucket.documents.bucket },

        # External services (example)
        { name = "MONGO_DB_NAME", value = var.project },
      ]

      secrets = [
        { 
          name      = "MONGO_URI"
          valueFrom = data.aws_secretsmanager_secret.mongo_uri.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = data.aws_secretsmanager_secret.redis_url.arn
        },
        { 
          name      = "OPENAI_API_KEY" 
          valueFrom = data.aws_secretsmanager_secret.openai_api_key.arn 
        },
        { 
          name      = "PINECONE_API_KEY" 
          valueFrom = data.aws_secretsmanager_secret.pinecone_api_key.arn 
        },
        { 
          name      = "RESEND_API_KEY"
          valueFrom = data.aws_secretsmanager_secret.resend_api_key.arn 
        },
        { 
          name      = "RAZORPAY_KEY_SECRET"
          valueFrom = data.aws_secretsmanager_secret.razorpay_key_secret.arn 
        },
        { 
          name      = "RAZORPAY_KEY_ID"
          valueFrom = data.aws_secretsmanager_secret.razorpay_key_id.arn 
        },
        { 
          name      = "AUTH_SECRET"
          valueFrom = data.aws_secretsmanager_secret.auth_secret.arn 
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

########################################
# ECS TASK DEFINITION — WORKER
########################################

resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.project}-${var.environment}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 1024
  memory = 3072

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image = "${aws_ecr_repository.worker.repository_url}:${var.api_image_tag}"
      essential = true

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },

        # SQS
        { name = "TEXT_EXTRACT_QUEUE_URL", value = aws_sqs_queue.main["text-extract"].url },
        { name = "CHUNK_EMBED_QUEUE_URL", value = aws_sqs_queue.main["chunk-embed"].url },
        { name = "DELETE_QUEUE_URL", value = aws_sqs_queue.main["document-delete"].url },
        { name = "CHUNK_EMBED_QUEUE_ARN", value = aws_sqs_queue.main["chunk-embed"].arn },
        { name = "DELETE_QUEUE_ARN", value = aws_sqs_queue.main["document-delete"].arn },
        { name = "TEXT_EXTRACT_QUEUE_ARN", value = aws_sqs_queue.main["text-extract"].arn },

        # Worker tuning
        { name = "POLL_INTERVAL_MS", value = "5000" },
        { name = "VISIBILITY_TIMEOUT", value = "600" },
        { name = "S3_SIGNED_URL_EXPIRY", value = "43200" },
        { name = "MAX_WAIT_MS", value = "25000" },

        # S3
        { name = "S3_BUCKET_NAME", value = aws_s3_bucket.documents.bucket },

        # External services
        { name = "MONGO_DB_NAME", value = var.project },
      ]

      secrets = [
        { 
          name = "MONGO_URI"
          valueFrom = data.aws_secretsmanager_secret.mongo_uri.arn 
        },
        { 
          name = "REDIS_URL"
          valueFrom = data.aws_secretsmanager_secret.redis_url.arn 
        },
        { 
          name = "OPENAI_API_KEY"
          valueFrom = data.aws_secretsmanager_secret.openai_api_key.arn 
        },
        { 
          name = "PINECONE_API_KEY"
          valueFrom = data.aws_secretsmanager_secret.pinecone_api_key.arn 
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_worker.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

########################################
# ECS SERVICE — WORKER
########################################

resource "aws_ecs_service" "worker" {
  name            = "${var.project}-${var.environment}-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  launch_type     = "FARGATE"

  desired_count = 1

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  enable_execute_command = true

  lifecycle {
    ignore_changes = [task_definition]
  }
}

########################################
# ECS SERVICE — API
########################################

resource "aws_ecs_service" "api" {
  name            = "${var.project}-${var.environment}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  launch_type     = "FARGATE"

  desired_count = 2

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  enable_execute_command = true

  lifecycle {
    ignore_changes = [task_definition]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

