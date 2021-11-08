## [0.0.9](https://github.com/StageUp/core/compare/v0.0.8...v0.0.9) (2021-11-08)


### Bug Fixes

* **SU-682:** Fixes merge conflict inside frontend host.service.ts ([#283](https://github.com/StageUp/core/issues/283)) ([8440df3](https://github.com/StageUp/core/commit/8440df3b2b574d18fdd1e5bbff03bda68d50564e))


### Features

* **SU-1042:** changes the unlimited ticket to be a constant instead of an enum ([9b85a57](https://github.com/StageUp/core/commit/9b85a573fda0f8b24fc4167514572fd970c904df))
* **SU-1042:** removes unnecessary imports ([4a1da38](https://github.com/StageUp/core/commit/4a1da386208ee22a5cfe456106c256debff97387))
* **SU-1045:** capitalizes the unlimited text ([87cecf0](https://github.com/StageUp/core/commit/87cecf0aca2162e0633e36722ea9b6dd8285294e))
* **SU-1045:** Fixes bug with remaining ticket quantity ([da7fe2d](https://github.com/StageUp/core/commit/da7fe2d638908d139e438fa12522a406e9221e62))
* **SU-1045:** implements the functionality, tests are not added yet ([dde34c7](https://github.com/StageUp/core/commit/dde34c7a166e207203eeff5b5dd43c7c0c0b1be0))
* **SU-1045:** makes a newly created ticket be not hidden ([23cbbb0](https://github.com/StageUp/core/commit/23cbbb02b411cdfba81ab0c9b1f8032e437e1576))
* **SU-1045:** makes the update ticket form keep track of whether the ticket is unlimited or not ([0231e03](https://github.com/StageUp/core/commit/0231e0332f3ddee33254b1a55b80b185d805e31a))
* **SU-1054:** [User] I want to register and log in with my Facebook/Gmail/Twitter account ([#285](https://github.com/StageUp/core/issues/285)) ([578f691](https://github.com/StageUp/core/commit/578f691be34bcf91373436997196fb363ffaa0bd))



## [0.0.8](https://github.com/StageUp/core/compare/v0.0.7...v0.0.8) (2021-08-04)



## [0.0.7](https://github.com/StageUp/core/compare/v0.0.6-demo...v0.0.7) (2021-04-25)
* Hosts can now create Patron Tiers
* Logic for showing tickets during selling periods added
* Host members can now review invoices of products purchased from them in the Dashboard Payments page
* Users can now review invoices of product they have purchased in the Settings page
* Users can subscribe to patronage tiers
* Site Admins can now delete messages left during an onboarding verification
* Site URL added to Social Information onboarding page

### Fixes
* Length validation on user profile name/bio added
* Better notification for when an add member to host request fails
* Host banner is no longer a transparent image when no image is provided
* Performance premiere date are no longer set to being in the past
* Inputs in various forms now have max length indicators
* Footer is now placed properly on the page
* Social Information onboarding screen can now be completely skipped

### Internal
* ngx-logger added for capturing errors on the frontend

## [0.0.6-demo](https://github.com/StageUp/core/compare/v0.0.5...v0.0.6-demo) (2021-04-14)

## [0.0.5](https://github.com/StageUp/core/compare/v0.0.4...v0.0.5) (2021-03-28)

## [0.0.4](https://github.com/StageUp/core/compare/v0.0.3...v0.0.4) (2021-03-14)

## [0.0.3](https://github.com/StageUp/core/compare/v0.0.2...v0.0.3) (2021-02-28)
* `SU-39 ` [Host Owner] I want to access a streaming key for a performance
* `SU-120` [Host Owner] I want to update a performance's details
* `SU-169` [Host Owner (UV)] I want to customise the visibility of my performances
* `SU-172` [Host Owner] I want to customise the visibility of my performance
* `SU-173` [Host Owner (UV)] I want to share a private performance
* `SU-176` [User/Host Owner] I want to view a private performance that's been shared with me
* `SU-177` [Non-User/User] I want to try to view a private performance that I don't have permission to view
* `SU-184` [User] I want to search for a host
* `SU-205` [Internal] Convert Postman requests to REST Client .http files
* `SU-207` [Client] Verify e-mail address frontend
* `SU-208` [Host/Client] Clarification modal
* `SU-217` [User] I want to leave a host that I'm a member of
* `SU-219` [Host Owner] I want to schedule the release of a performance
* `SU-229` [Host Editor] - I want to view individual performance page
* `SU-222` Design issue with login/register page
* `SU-223` Host Social inputs doesn't accept null values	
* `SU-225` Frontend global error handler with Toasts

## [0.0.2](https://github.com/StageUp/core/compare/v0.0.1...v0.0.2) (2021-02-15)
* Able to log out using header bar button
* Added ability to create a new performance as a Host Owner
* Can now search for performances by title
* Internally:
  - Ported over Misc & Admin controller requests from Postman to VSCode Rest Client
  - Host Members CRUD is now fully integration tested
  - Automated deployment / release branch creation

## 0.0.1 (2021-02-04)
* Initial release
