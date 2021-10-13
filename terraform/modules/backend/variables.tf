variable "region" {
  type = string
}

variable "name" {
  type        = string
  description = "Name of the Cloud Run application, e.g. su-123 or production etc."
}

# "eu.gcr.io/${var.gcp_project}/core-backend:${var.branch_name}-latest"
variable "image" {
  type        = string
  description = "eu.gcr.io/PROJECT_ID/core-backend:IMAGE_TAG"
}

variable "vpc_connector" {
  type        = string
  description = "VPC access connector name"
}

variable "env" {
  description = "Environment variables to inject into the service instance."
  type = object({
    NODE_ENV          = string
    LOAD_BALANCER_URL = string
    POSTGRES_HOST     = string
    POSTGRES_USER     = string
    POSTGRES_DB       = string
    BACKEND_ENDPOINT  = string
    POSTGRES_PASSWORD = string
    BACKEND_PORT      = number
    FRONTEND_ENDPOINT = string
    FRONTEND_PORT     = number

    # remove these when secret iam policy fixed
    MUX_SECRET_KEY           = string
    MUX_ACCESS_TOKEN         = string
    MUX_WEBHOOK_SIGNATURE    = string
    MUX_DATA_ENV_KEY         = string
    SENDGRID_API_KEY         = string
    STRIPE_PRIVATE_KEY       = string
    STRIPE_WEBHOOK_SIGNATURE = string
    STRIPE_CLIENT_ID         = string
    STRIPE_PUBLIC_KEY        = string
    BACKEND_PRIVATE_KEY      = string
    BACKEND_STORE_HOST       = string
    BACKEND_REDIS_HOST       = string

    GOOGLE_STORAGE_SERVICE_ACCOUNT_KEY   = string
    GOOGLE_STORAGE_SERVICE_ACCOUNT_EMAIL = string
    GOOGLE_STORAGE_BUCKET_NAME           = string
    GOOGLE_STORAGE_PUBLIC_URL            = string
  })
}
