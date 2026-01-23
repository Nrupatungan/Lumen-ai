resource "aws_lb" "api" {
  name               = "${var.project}-${var.environment}-alb"
  load_balancer_type = "application"
  internal           = false

  subnets         = module.vpc.public_subnets
  security_groups = [aws_security_group.alb.id]

  idle_timeout = 3600 # REQUIRED for WebSockets
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project}-${var.environment}-api"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id
  deregistration_delay = 30

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}