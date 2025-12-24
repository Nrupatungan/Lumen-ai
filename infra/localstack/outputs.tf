output "sqs_queue_urls" {
  value = {
    for k, q in aws_sqs_queue.main :
    k => q.url
  }
}

output "s3_bucket" {
  value = aws_s3_bucket.documents.bucket
}
