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
      image     = "${aws_ecr_repository.api.repository_url}:placeholder"
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
        { name = "AUTH_SECRET", value = var.auth_secret }
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
# ECS TASK DEFINITION — WORKERS
########################################

resource "aws_ecs_task_definition" "worker_text_extract" {
  family                   = "${var.project}-${var.environment}-text-extract"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 512
  memory = 1024

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn


  container_definitions = jsonencode([
    {
      name    = "worker"
      image   = "${aws_ecr_repository.worker.repository_url}:placeholder"
      command = ["node", "dist/text-extract/runner.js"]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },

        # SQS
        { name = "TEXT_EXTRACT_QUEUE_URL", value = aws_sqs_queue.main["text-extract"].url },
        { name = "TEXT_EXTRACT_QUEUE_ARN", value = aws_sqs_queue.main["text-extract"].arn },

        { name = "CHUNK_EMBED_QUEUE_URL", value = aws_sqs_queue.main["chunk-embed"].url },

        # S3
        { name = "S3_BUCKET_NAME", value = aws_s3_bucket.documents.bucket },

        # External services
        { name = "MONGO_DB_NAME", value = var.project },

        # Worker tuning
        { name = "POLL_INTERVAL_MS", value = "5000" },
        { name = "VISIBILITY_TIMEOUT", value = "600" },
        { name = "S3_SIGNED_URL_EXPIRY", value = "43200" },
        { name = "MAX_WAIT_MS", value = "25000" },
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
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_worker.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "text-extract"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "worker_chunk_embed" {
  family = "${var.project}-${var.environment}-chunk-embed"

  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 1024
  memory = 3072

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn


  container_definitions = jsonencode([
    {
      name    = "worker"
      image   = "${aws_ecr_repository.worker.repository_url}:placeholder"
      command = ["node", "dist/chunk-embed/runner.js"]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },

        { name = "CHUNK_EMBED_QUEUE_URL", value = aws_sqs_queue.main["chunk-embed"].url },
        { name = "CHUNK_EMBED_QUEUE_ARN", value = aws_sqs_queue.main["chunk-embed"].arn },
        
        # S3
        { name = "S3_BUCKET_NAME", value = aws_s3_bucket.documents.bucket },

        # External services
        { name = "MONGO_DB_NAME", value = var.project },

        # Worker tuning
        { name = "POLL_INTERVAL_MS", value = "5000" },
        { name = "VISIBILITY_TIMEOUT", value = "600" },
        { name = "MAX_WAIT_MS", value = "25000" },
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
          awslogs-stream-prefix = "chunk-embed"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "worker_document_delete" {
  family = "${var.project}-${var.environment}-document-delete"

  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn


  container_definitions = jsonencode([
    {
      name    = "worker"
      image   = "${aws_ecr_repository.worker.repository_url}:placeholder"
      command = ["node", "dist/document-delete/runner.js"]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },

        { name = "DELETE_QUEUE_URL", value = aws_sqs_queue.main["document-delete"].url },
        { name = "DELETE_QUEUE_ARN", value = aws_sqs_queue.main["document-delete"].arn },
        
        # S3
        { name = "S3_BUCKET_NAME", value = aws_s3_bucket.documents.bucket },

        # External services
        { name = "MONGO_DB_NAME", value = var.project },

        # Worker tuning
        { name = "POLL_INTERVAL_MS", value = "5000" },
        { name = "VISIBILITY_TIMEOUT", value = "600" },
        { name = "MAX_WAIT_MS", value = "25000" },
      ]

      secrets = [
        { 
          name = "MONGO_URI"
          valueFrom = data.aws_secretsmanager_secret.mongo_uri.arn 
        },
        { 
          name = "OPENAI_API_KEY"
          valueFrom = data.aws_secretsmanager_secret.openai_api_key.arn 
        },
        { 
          name = "PINECONE_API_KEY"
          valueFrom = data.aws_secretsmanager_secret.pinecone_api_key.arn 
        },
        { 
          name = "REDIS_URL"
          valueFrom = data.aws_secretsmanager_secret.redis_url.arn 
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_worker.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "document-delete"
        }
      }
    }
  ])
}


########################################
# ECS SERVICE — WORKERS
########################################
resource "aws_ecs_service" "text_extract" {
  name            = "${var.project}-${var.environment}-text-extract"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker_text_extract.arn
  launch_type     = "FARGATE"

  desired_count = 1

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

resource "aws_ecs_service" "chunk_embed" {
  name            = "${var.project}-${var.environment}-chunk-embed"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker_chunk_embed.arn
  launch_type     = "FARGATE"

  desired_count = 1

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

resource "aws_ecs_service" "document_delete" {
  name            = "${var.project}-${var.environment}-document-delete"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker_document_delete.arn
  launch_type     = "FARGATE"

  desired_count = 1

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

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

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }


  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}


########################################
# ECS SERVICE — WORKERS AUTOSCALING
########################################
resource "aws_appautoscaling_target" "text_extract" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.text_extract.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "text_extract_scale_out" {
  name               = "text-extract-scale-out"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.text_extract.resource_id
  scalable_dimension = aws_appautoscaling_target.text_extract.scalable_dimension
  service_namespace  = aws_appautoscaling_target.text_extract.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 30
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "text_extract_scale_out_alarm" {
  alarm_name          = "text-extract-queue-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 5

  dimensions = {
    QueueName = aws_sqs_queue.main["text-extract"].name
  }

  alarm_actions = [
    aws_appautoscaling_policy.text_extract_scale_out.arn
  ]
}

resource "aws_appautoscaling_policy" "text_extract_scale_in" {
  name               = "text-extract-scale-in"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.text_extract.resource_id
  scalable_dimension = aws_appautoscaling_target.text_extract.scalable_dimension
  service_namespace  = aws_appautoscaling_target.text_extract.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 120
    metric_aggregation_type = "Average"

    # Queue == 0 → scale in
    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }

    # Queue > 0 → no-op
    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 0
    }
  }
}


resource "aws_cloudwatch_metric_alarm" "text_extract_scale_in_alarm" {
  alarm_name          = "text-extract-queue-empty"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 0

  dimensions = {
    QueueName = aws_sqs_queue.main["text-extract"].name
  }

  alarm_actions = [
    aws_appautoscaling_policy.text_extract_scale_in.arn
  ]
}

resource "aws_appautoscaling_target" "chunk_embed" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.chunk_embed.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "chunk_embed_scale_out" {
  name               = "chunk-embed-scale-out"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.chunk_embed.resource_id
  scalable_dimension = aws_appautoscaling_target.chunk_embed.scalable_dimension
  service_namespace  = aws_appautoscaling_target.chunk_embed.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 45
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "chunk_embed_scale_out_alarm" {
  alarm_name          = "chunk-embed-queue-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 2

  dimensions = {
    QueueName = aws_sqs_queue.main["chunk-embed"].name
  }

  alarm_actions = [
    aws_appautoscaling_policy.chunk_embed_scale_out.arn
  ]
}

resource "aws_appautoscaling_policy" "chunk_embed_scale_in" {
  name               = "chunk-embed-scale-in"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.chunk_embed.resource_id
  scalable_dimension = aws_appautoscaling_target.chunk_embed.scalable_dimension
  service_namespace  = aws_appautoscaling_target.chunk_embed.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 180
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 0
    }
  }
}


resource "aws_cloudwatch_metric_alarm" "chunk_embed_scale_in_alarm" {
  alarm_name          = "chunk-embed-queue-empty"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 0

  dimensions = {
    QueueName = aws_sqs_queue.main["chunk-embed"].name
  }

  alarm_actions = [
    aws_appautoscaling_policy.chunk_embed_scale_in.arn
  ]
}

resource "aws_appautoscaling_target" "document_delete" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.document_delete.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "document_delete_scale_out" {
  name               = "document-delete-scale-out"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.document_delete.resource_id
  scalable_dimension = aws_appautoscaling_target.document_delete.scalable_dimension
  service_namespace  = aws_appautoscaling_target.document_delete.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "document_delete_scale_out_alarm" {
  alarm_name          = "document-delete-queue-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 10

  dimensions = {
    QueueName = aws_sqs_queue.main["document-delete"].name
  }

  alarm_actions = [
    aws_appautoscaling_policy.document_delete_scale_out.arn
  ]
}

resource "aws_appautoscaling_policy" "document_delete_scale_in" {
  name               = "document-delete-scale-in"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.document_delete.resource_id
  scalable_dimension = aws_appautoscaling_target.document_delete.scalable_dimension
  service_namespace  = aws_appautoscaling_target.document_delete.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 120
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 1
      scaling_adjustment          = -1
    }

    step_adjustment {
      metric_interval_lower_bound = 1
      scaling_adjustment          = 0
    }
  }
}


resource "aws_cloudwatch_metric_alarm" "document_delete_scale_in_alarm" {
  alarm_name          = "document-delete-queue-low"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 1

  dimensions = {
    QueueName = aws_sqs_queue.main["document-delete"].name
  }

  alarm_actions = [
    aws_appautoscaling_policy.document_delete_scale_in.arn
  ]
}

########################################
# ECS SERVICE — API AUTOSCALING
########################################
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 6
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "api_memory" {
  name               = "api-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    scale_in_cooldown  = 180
    scale_out_cooldown = 90
  }
}

