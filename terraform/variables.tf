# https://www.terraform.io/docs/language/state/workspaces.html#when-to-use-multiple-workspaces
# deployment split into three distinct workspaces, have this variable here to enforce workspace names
variable "core" {
  type = string
  validation {
    # value must be the same as the workspaces' name
    condition     = contains(["prod", "stage", "feat"], var.core)
    error_message = "Allowed values for core are \"prod\", \"staging\", or \"feat\"."
  }
}

variable "gcp_project_id" {
  type        = string
  description = "GCP project identifier"
}

variable "sql_password" {
  type        = string
  description = "Postgres user password"
}

variable "stripe_api_token" {
  type        = string
  description = "Stripe API token"
}
