import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { IUiStepMapField } from '../onboarding-view.component';

@Component({
  selector: 'app-onboarding-view-issue-maker',
  templateUrl: './onboarding-view-issue-maker.component.html',
  styleUrls: ['./onboarding-view-issue-maker.component.scss']
})
export class OnboardingViewIssueMakerComponent implements OnInit, OnChanges {
  @Input() field:IUiStepMapField;
  @Input() isActive:boolean;

  @ViewChild("input") input;

  currentIssueText:string = "";

  constructor() { }

  ngOnInit(): void {
    this.field.issues = [];
  }

  ngOnChanges(changes:SimpleChanges) {
    // Immediately select the input field when the onboarding view issue maker is active
    if(changes["isActive"]) {
      setTimeout(() => { // push to next tick while ngIf is set to active
        if(changes["isActive"].currentValue) this.input.select();
      }, 0);
    }
  }

  addIssue() {
    this.field.issues.push(this.currentIssueText);
    this.currentIssueText = "";
    this.field.valid = true;
    this.input.select();
  }

  removeIssue(issueIdx:number) {
    this.field.issues = this.field.issues.splice(issueIdx, 1);
    if(this.field.issues.length == 0) this.field.valid = false;
  }
}
