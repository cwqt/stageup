variable "name" {
  type        = string
  description = "Name of the Cloud Run application, e.g. su-123 or production etc."
}

variable "network" {
  type        = string
  description = "vpc.self_link or vpc.name"
}

variable "subnetname" {
  type        = string
  description = "subnet.name"
}

variable "subnetlink" {
  type        = string
  description = "subnet.self_link"
}

variable "region" {
  type = string
}
