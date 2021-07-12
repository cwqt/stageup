variable "name" {
  type        = string
  description = "Name of the Cloud Run application, e.g. su-123 or production etc."
}

variable "network" {
  type        = string
  description = "vpc.self_link or vpc.name"
}

variable "subnet" {
  type        = string
  description = "subnet.self_link or subnet.name"
}

variable "region" {
  type = string
}
