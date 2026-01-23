resource "aws_s3_bucket" "documents" {
  bucket = "${var.project}-${var.environment}-s3-storage"
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "cleanup-temp-uploads"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}
