variable "core" {
  type = string
  validation {
    # value must be the same as the workspaces' name
    condition     = contains(["prod", "stage", "feat"], var.core)
    error_message = "Allowed values for core are \"prod\", \"staging\", or \"feat\"."
  }
}
