resource "aws_security_group" "ecs_tasks" {
  name   = "${var.project}-${var.environment}-ecs-tasks"
  vpc_id = module.vpc.vpc_id

  # Outbound access (SQS, S3, Mongo, Redis)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name   = "${var.project}-${var.environment}-alb"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
