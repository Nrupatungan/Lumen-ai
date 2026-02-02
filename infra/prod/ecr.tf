resource "aws_ecr_repository" "api" {
  name                 = "${var.project}-${var.environment}-api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "worker" {
  name                 = "${var.project}-${var.environment}-worker"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

data "aws_ecr_image" "api" {
  repository_name = aws_ecr_repository.api.name
  image_tag       = var.image_tag
}

data "aws_ecr_image" "worker" {
  repository_name = aws_ecr_repository.worker.name
  image_tag       = var.image_tag
}
