# core : workspace, except in the case of feat - which must be su-123 or something
resource "null_resource" "core_workspace_check" {
  count = (var.core == "prod" && terraform.workspace == "prod" ? 0 :
    (var.core == "stage" && terraform.workspace == "stage" ? 0 :
  (var.core == "feat" && terraform.workspace != "feat" ? 0 : "Bad core/workspace selection")))
}

# per core / global environment values
locals {
  ctx = {
    # load_balancer_host: where all traffic is directed to
    # prod  = stageup.uk
    # stage = staging.stageup.uk
    # feat  = su-xxx.stageup.uk

    # name: for labelling envs & feature branches
    # prod    = subnet-prod
    # stage   = subnet-staging
    # feat    = subnet-ft-su-xxx

    prod = {
      core               = "prod"
      name               = var.core
      NODE_ENV           = "production"
      postgres_name      = "postgres"
      load_balancer_host = "stageup.uk"
    }
    stage = {
      core               = "stage"
      name               = var.core
      NODE_ENV           = "staging"
      postgres_name      = "postgres"
      load_balancer_host = "staging.stageup.uk"
    }
    feat = {
      core     = "feat"
      name     = "ft-${lower(terraform.workspace)}"
      NODE_ENV = "staging"
      # in feat a cloudsql instance has a database/branch inside of it
      postgres_name      = lower(terraform.workspace)
      load_balancer_host = "${lower(terraform.workspace)}.stageup.uk"
    }
  }

  # global variables
  region = "europe-west1"

  # convenience aliasing
  name               = lookup(local.ctx[var.core], "name")
  postgres_name      = lookup(local.ctx[var.core], "postgres_name")
  load_balancer_host = lookup(local.ctx[var.core], "load_balancer_host")
  NODE_ENV           = lookup(local.ctx[var.core], "NODE_ENV")
}

# NON-EPHEMERAL RESOURCES CREATED PER WORKSPACE, SEE /terraform/core -----
data "google_compute_network" "vpc" {
  name = "vpc-${var.core}"
}

data "google_sql_database_instance" "postgres" {
  name = "postgres-${var.core}"
}
# ------------------------------------------------------------------------

# Create a subnet within provided variable environment VPC
resource "google_compute_subnetwork" "subnet" {
  provider      = google-beta
  name          = "subnet-${local.name}"
  ip_cidr_range = "10.2.0.0/28"
  region        = local.region
  network       = data.google_compute_network.vpc.id
}

# create a user with a password, since the root user is deleted on instance creation
resource "google_sql_user" "pg_admin" {
  name     = "admin-${local.name}"
  instance = data.google_sql_database_instance.postgres.name
  password = var.sql_password
  depends_on = [
    data.google_sql_database_instance.postgres
  ]
}

# in feat, rather than making an entirely new instance we make a schema in the db for the
# deploy branch to make use of, cheaper & faster to instantiate in a CI build
resource "google_sql_database" "feat_database" {
  count      = var.core == "feat" ? 1 : 0
  name       = local.postgres_name
  instance   = data.google_sql_database_instance.postgres.name
  
  # delete the admin before the db
  depends_on = [google_sql_user.pg_admin]
}

# need redis please
module "redis" {
  source  = "./modules/redis"
  name    = local.name
  region  = local.region
  network = data.google_compute_network.vpc.name
  subnet  = google_compute_subnetwork.subnet.name
}

# allow the cloud run backend to connect to the db
resource "google_vpc_access_connector" "vpc_connector" {
  provider     = google-beta
  name         = "${local.name}-connector"
  machine_type = "e2-standard-4"
  subnet {
    name = google_compute_subnetwork.subnet.name
  }
}

module "secrets" {
  source = "./modules/secrets"
}

module "backend" {
  source = "./modules/backend"
  depends_on = [
    module.redis,
    data.google_sql_database_instance.postgres,
    google_vpc_access_connector.vpc_connector,
  ]

  name          = local.name
  region        = local.region
  image         = "eu.gcr.io/${var.gcp_project_id}/core-backend:${local.name}-latest"
  vpc_connector = google_vpc_access_connector.vpc_connector.name

  env = {
    NODE_ENV           = local.NODE_ENV
    EMAIL_ADDRESS      = "development@stageup.uk"
    LOAD_BALANCER_URL  = "https://${local.load_balancer_host}"
    BACKEND_STORE_HOST = module.redis.ip_address
    BACKEND_REDIS_HOST = module.redis.ip_address
    POSTGRES_USER      = "admin-${local.name}"
    POSTGRES_PASSWORD  = var.sql_password
    POSTGRES_DB        = local.postgres_name
    POSTGRES_HOST      = data.google_sql_database_instance.postgres.private_ip_address
    BACKEND_ENDPOINT   = "/" # managed by load balancer / nginx
    FRONTEND_ENDPOINT  = "/" # managed by load balancer / nginx
    FRONTEND_PORT      = 8080
    BACKEND_PORT       = 8080
    # secrets -------------------------------------------------------------------------
    # TODO: support different workspaces different secret keys
    MUX_SECRET_KEY           = module.secrets.MUX_SECRET_KEY
    MUX_ACCESS_TOKEN         = module.secrets.MUX_ACCESS_TOKEN
    MUX_WEBHOOK_SIGNATURE    = module.secrets.MUX_WEBHOOK_SIGNATURE
    SENDGRID_API_KEY         = module.secrets.SENDGRID_API_KEY
    STRIPE_PRIVATE_KEY       = module.secrets.STRIPE_PRIVATE_KEY
    STRIPE_WEBHOOK_SIGNATURE = module.secrets.STRIPE_WEBHOOK_SIGNATURE
    STRIPE_CLIENT_ID         = module.secrets.STRIPE_CLIENT_ID
    STRIPE_PUBLIC_KEY        = module.secrets.STRIPE_PUBLIC_KEY
    BACKEND_PRIVATE_KEY      = module.secrets.BACKEND_PRIVATE_KEY
    AWS_S3_ACCESS_KEY_ID     = module.secrets.AWS_S3_ACCESS_KEY_ID
    AWS_S3_ACCESS_SECRET_KEY = module.secrets.AWS_S3_ACCESS_SECRET_KEY
    AWS_S3_BUCKET_NAME       = module.secrets.AWS_S3_BUCKET_NAME
    AWS_S3_REGION            = module.secrets.AWS_S3_REGION
    AWS_S3_URL               = module.secrets.AWS_S3_URL
  }
}

# deploy frontend nginx, use this module because I don't need so much control compared with the backend
# https://registry.terraform.io/modules/garbetjie/cloud-run/google/latest#inputs
module "frontend" {
  project             = var.gcp_project_id
  source              = "garbetjie/cloud-run/google"
  version             = "1.4.0"
  name                = "frontend-${lower(local.name)}"
  image               = "eu.gcr.io/${var.gcp_project_id}/core-frontend:${local.name}-latest"
  location            = "europe-west1"
  allow_public_access = true
  port                = 80
  max_instances       = 1
  min_instances       = 1
  map_domains         = [local.load_balancer_host]
  depends_on          = [module.backend]
  # proxy_pass nginx value, forwards /api requests to the backend container
  env = {
    API_HOST = replace(module.backend.url, "/http(s?):///", "")
  }
}

resource "google_dns_record_set" "resource-recordset" {
  for_each = module.frontend.dns

  provider     = "google-beta"
  managed_zone = "stageup"
  name         = "${each.key}."
  type         = each.value[0].type
  rrdatas      = each.value[0].rrdatas
  ttl          = 3600
}

resource "stripe_webhook_endpoint" "stripe_webhook" {
  url        = "https://${local.load_balancer_host}/api/stripe/hooks"
  depends_on = [module.backend, module.frontend]

  # take these from StripeHook enum in @core/interfaces
  enabled_events = [
    "payment_intent.created",
    "payment_intent.succeeded",
    "charge.refunded",
    "invoice.payment_succeeded",
    "customer.subscription.deleted"
  ]
}