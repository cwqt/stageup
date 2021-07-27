# GitHub Actions

![](workflow.png)

### `1-deploy-branch.yml`

Creates Docker images for this branch & deploys to `feat` Core Workspace using Terraform (see <https://github.com/StageUp/core/tree/dev/terraform#core-workspaces> for explanation)

- `ctx`: Gets branch name (lower-cased) & SHA of commit that caused the workflow run
- `do_deploy`: Decides if the branch should be deployed - `/deploy` contained in commit body, creates Deployment Log comment
- `install_deps`: Installs npm dependencies from package.json (checks cache first)
- `create_backend_image`: Runs `generate:xlf` for backend & then builds backend Docker image, uploading to Container Registry once complete, tagging `:latest` & `:SHA`
- `create_frontend_image`: Runs `generate:xlf` for frontend & then builds frontend Docker image, uploading to Container Registry once complete, tagging `:latest` & `:SHA`
- `tf_deploy`: Creates Terraform workspace for branch (if none), and then deploys images/databases using scripts in `/terraform`, sets up webhook fan-out endpoint using <https://github.com/StageUp/webhooks>
- `comment`: Comments status of deployment in PR thread

### `1-teardown-branch.yml`

Tears down branch deploy & deletes Terraform Workspace.

- `ctx`: Checks if branch was deployed, skips if not, else gets the branch name (lowercased) for next job to use
- `delete_infra`: Tears down branch deployment from GCP, removes webhook endpoint fan-out from `webhooks`, updates Deployment Log PR comment with closure notice

### `2-deploy-staging.yml`

When a branch starting with `SU-` is merged into `dev`, takes Docker images created in `1-deploy-branch.yml` (if it was deployed) & tags with `stage:latest` tags, deploys these images to `stage` Core Workspace & performs migrations

- `ctx`: Checks is `SU-XXX` branch that was merged into `dev`, gets short SHA of commit
- `check_has_images`: Verifies using Cloud SDK that images exist for this PR, won't deploy unless both exist
- `add_tags`: Adds `stage-latest` & `stage-SHA` tags to latest PR images for deployment into staging
- `deploy`: Runs Terraform script to deploy latest staging images
- `slack`: Posts message on Slack informing of deployment status

### `3-deploy-prod.yml`

When a branch starting with `release/` is merged into `dev`, takes `stage:latest` Docker images & tags as `release:latest`, deploys these images to `prod` Core Workspace & performs migrations

## Secrets <https://github.com/StageUp/core/settings/secrets/actions>

- `GCP_PROJECT_ID`: Project ID from dashboard, e.g. `core-314910`
- `LOAD_BALANCER_URL`: Domain, e.g. `stageup.uk`, no protocol or trailing slash
- `STRIPE_TEST_PUBLIC_KEY`: Test public key (for frontend environment)
- `STRIPE_TEST_SECRET_KEY`: Test secret key (for testing Terraform deploys)
- `STRIPE_PUBLIC_KEY`: Production public key
- `STRIPE_SECRET_KEY`: Production private key
- `SU_WEBHOOKS_API_KEY`: Auth key for <https://github.com/StageUp/webhooks>
- `CLOUD_BUILD_GCP_SA_KEY`: Service Account with Cloud Registry permissions
- `TF_GCP_SA_KEY`: Service Account with permissions for all Terraform-required infra.
- `XLF_GCP_SA_KEY`: Service Account for Translate API (`generate:xlf`)
- `SLACK_STAGEUP_BOT_OAUTH_TOKEN`: OAuth Token for Slack bot to post comments about deployment <https://api.slack.com/apps/A01LU075W94/install-on-team?success=1>
