import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { OrganisationService } from "src/app/services/organisation.service";
import { IOrgStub } from "@cxss/interfaces";

@Component({
  selector: "app-create-org",
  templateUrl: "./create-org.component.html",
  styleUrls: ["./create-org.component.scss"],
})
export class CreateOrgComponent implements OnInit {
  returnUrl: string;
  createOrgForm: FormGroup;
  loading: boolean = false;
  success: boolean = false;
  errors = {
    name: "",
    form: "",
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orgService: OrganisationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createOrgForm = this.fb.group({
      name: ["", [Validators.required]],
    });

    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";
  }

  get name() {
    return this.createOrgForm.get("name");
  }

  submitHandler() {
    this.loading = true;
    this.orgService
      .createOrganisation(this.createOrgForm.value)
      .then((org: IOrgStub) => {
        this.orgService.setActiveOrg(org);
        this.router.navigate([`/`]);
      })
      .catch((err) => {
        this.success = false;
        let errors = err.error.message;
        Object.keys(this.errors).forEach((e) => {
          let i = errors.findIndex((x) => x.param == e);
          if (errors[i]) {
            this.errors[e] = errors[i].msg;
            if (errors[i].param != "form")
              this.createOrgForm.controls[e].setErrors({ incorrect: true });
          }
        });
      })
      .finally(() => (this.loading = false));
  }
}
