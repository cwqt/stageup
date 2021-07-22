# None of these have a specific version pinned & so all secrets will be the latest version
# ===================================================================================
# MUX
# ===================================================================================
data "google_secret_manager_secret_version" "MUX_SECRET_KEY" {
  provider = google-beta
  secret   = "MUX_SECRET_KEY"
}
output "MUX_SECRET_KEY" {
  value     = data.google_secret_manager_secret_version.MUX_SECRET_KEY.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "MUX_ACCESS_TOKEN" {
  provider = google-beta
  secret   = "MUX_ACCESS_TOKEN"
}
output "MUX_ACCESS_TOKEN" {
  value     = data.google_secret_manager_secret_version.MUX_ACCESS_TOKEN.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "MUX_WEBHOOK_SIGNATURE" {
  provider = google-beta
  secret   = "MUX_WEBHOOK_SIGNATURE"
}
output "MUX_WEBHOOK_SIGNATURE" {
  value     = data.google_secret_manager_secret_version.MUX_WEBHOOK_SIGNATURE.secret_data
  sensitive = true
}

# ===================================================================================
# SendGrid
# ===================================================================================
data "google_secret_manager_secret_version" "SENDGRID_API_KEY" {
  provider = google-beta
  secret   = "SENDGRID_API_KEY"
}
output "SENDGRID_API_KEY" {
  value     = data.google_secret_manager_secret_version.SENDGRID_API_KEY.secret_data
  sensitive = true
}

# ===================================================================================
# Stripe
# ===================================================================================
data "google_secret_manager_secret_version" "STRIPE_PRIVATE_KEY" {
  provider = google-beta
  secret   = "STRIPE_PRIVATE_KEY"
}
output "STRIPE_PRIVATE_KEY" {
  value     = data.google_secret_manager_secret_version.STRIPE_PRIVATE_KEY.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "STRIPE_WEBHOOK_SIGNATURE" {
  provider = google-beta
  secret   = "STRIPE_WEBHOOK_SIGNATURE"
}
output "STRIPE_WEBHOOK_SIGNATURE" {
  value     = data.google_secret_manager_secret_version.STRIPE_WEBHOOK_SIGNATURE.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "STRIPE_CLIENT_ID" {
  provider = google-beta
  secret   = "STRIPE_CLIENT_ID"
}
output "STRIPE_CLIENT_ID" {
  value     = data.google_secret_manager_secret_version.STRIPE_CLIENT_ID.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "STRIPE_PUBLIC_KEY" {
  provider = google-beta
  secret   = "STRIPE_PUBLIC_KEY"
}
output "STRIPE_PUBLIC_KEY" {
  value     = data.google_secret_manager_secret_version.STRIPE_PUBLIC_KEY.secret_data
  sensitive = true
}


# ===================================================================================
# Backend
# ===================================================================================
data "google_secret_manager_secret_version" "BACKEND_PRIVATE_KEY" {
  provider = google-beta
  secret   = "BACKEND_PRIVATE_KEY"
}
output "BACKEND_PRIVATE_KEY" {
  value     = data.google_secret_manager_secret_version.BACKEND_PRIVATE_KEY.secret_data
  sensitive = true
}

# ===================================================================================
# S3
# ===================================================================================
data "google_secret_manager_secret_version" "AWS_S3_ACCESS_KEY_ID" {
  provider = google-beta
  secret   = "AWS_S3_ACCESS_KEY_ID"
}
output "AWS_S3_ACCESS_KEY_ID" {
  value     = data.google_secret_manager_secret_version.AWS_S3_ACCESS_KEY_ID.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "AWS_S3_ACCESS_SECRET_KEY" {
  provider = google-beta
  secret   = "AWS_S3_ACCESS_SECRET_KEY"
}
output "AWS_S3_ACCESS_SECRET_KEY" {
  value     = data.google_secret_manager_secret_version.AWS_S3_ACCESS_SECRET_KEY.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "AWS_S3_BUCKET_NAME" {
  provider = google-beta
  secret   = "AWS_S3_BUCKET_NAME"
}
output "AWS_S3_BUCKET_NAME" {
  value     = data.google_secret_manager_secret_version.AWS_S3_BUCKET_NAME.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "AWS_S3_REGION" {
  provider = google-beta
  secret   = "AWS_S3_REGION"
}
output "AWS_S3_REGION" {
  value     = data.google_secret_manager_secret_version.AWS_S3_REGION.secret_data
  sensitive = true
}

data "google_secret_manager_secret_version" "AWS_S3_URL" {
  provider = google-beta
  secret   = "AWS_S3_URL"
}
output "AWS_S3_URL" {
  value     = data.google_secret_manager_secret_version.AWS_S3_URL.secret_data
  sensitive = true
}
