resource "aws_codedeploy_app" "ecs" {
  name             = "${var.project}-${var.environment}-ecs"
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "api" {
  app_name               = aws_codedeploy_app.ecs.name
  deployment_group_name  = "${var.project}-${var.environment}-api"
  service_role_arn       = aws_iam_role.codedeploy.arn

  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  ecs_service {
    cluster_name = aws_ecs_cluster.main.name
    service_name = aws_ecs_service.api.name
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.https.arn]
      }

      target_group {
        name = aws_lb_target_group.api.name
      }

      target_group {
        name = aws_lb_target_group.api_green.name
      }
    }
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
}
