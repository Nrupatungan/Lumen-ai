resource "aws_cloudwatch_event_rule" "usage_sync" {
  name                = "${var.project}-usage-sync"
  description         = "Periodically sync usage data"
  schedule_expression = "rate(15 minutes)"
  state               = "ENABLED"
  depends_on = [ aws_lambda_permission.allow_eventbridge]
}

resource "aws_cloudwatch_event_target" "usage_sync" {
  rule = aws_cloudwatch_event_rule.usage_sync.name
  arn  = aws_lambda_function.usage_sync.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.usage_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.usage_sync.arn
}
