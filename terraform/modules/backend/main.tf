resource "google_cloud_run_service" "default" {
  provider                   = google-beta
  name                       = "backend-${lower(var.name)}"
  location                   = var.region
  autogenerate_revision_name = true

  metadata {
    annotations = {
      "run.googleapis.com/launch-stage" = "BETA"
    }
  }

  template {
    spec {
      containers {
        image = var.image

        # Populate straight environment variables.
        dynamic "env" {
          for_each = var.env

          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }

    metadata {
      annotations = {
        # https://github.com/hashicorp/terraform-provider-google/issues/6294
        # only route connections to private ips through vpc
        "run.googleapis.com/vpc-access-egress" : "private-ranges-only"
        "run.googleapis.com/vpc-access-connector" = "${var.vpc_connector}"
        "autoscaling.knative.dev/maxScale"        = "1"
        "run.googleapis.com/client-name"          = "terraform"
      }
    }
  }
}

# allow un-authenticated requests
data "google_iam_policy" "backend_iam" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "policy" {
  location    = google_cloud_run_service.default.location
  project     = google_cloud_run_service.default.project
  service     = google_cloud_run_service.default.name
  policy_data = data.google_iam_policy.backend_iam.policy_data
}
