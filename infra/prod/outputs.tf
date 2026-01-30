output "sqs_queue_urls" {
  value = {
    for k, q in aws_sqs_queue.main : k => q.url
  }
}

output "documents_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "api_url" {
  value = aws_lb.api.dns_name
}

output "acm_dns_validation_records" {
  value = aws_acm_certificate.api.domain_validation_options
}
