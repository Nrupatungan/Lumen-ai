locals {
  queues = [
    "document-ingest",
    "text-extract",
    "chunk-embed",
    "document-delete"
  ]
}

resource "aws_sqs_queue" "dlq" {
  for_each = toset(local.queues)

  name = "${each.key}-dlq"
}

resource "aws_sqs_queue" "main" {
  for_each = toset(local.queues)

  name = each.key

  receive_wait_time_seconds = 20
  visibility_timeout_seconds = 600
  message_retention_seconds = 345600  # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 5
  })
}
