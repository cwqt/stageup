# https://www.terraform.io/docs/language/state/workspaces.html#when-to-use-multiple-workspaces
# deployment split into three distinct workspaces, have this variable here to enforce workspace names
variable "core" {
  type = string
  validation {
    # value must be the same as the core name
    condition     = contains(["prod", "stage", "feat"], var.core)
    error_message = "Allowed values for core are \"prod\", \"stage\", or \"feat\"."
  }
}

variable "gcp_project_id" {
  type        = string
  description = "GCP project identifier"
}
