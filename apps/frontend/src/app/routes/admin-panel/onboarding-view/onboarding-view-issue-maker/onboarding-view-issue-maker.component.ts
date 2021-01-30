import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IUiStepMapField } from '../onboarding-view.component';

@Component({
  selector: 'app-onboarding-view-issue-maker',
  templateUrl: './onboarding-view-issue-maker.component.html',
  styleUrls: ['./onboarding-view-issue-maker.component.scss']
})
export class OnboardingViewIssueMakerComponent implements OnInit {
  @Input() field:IUiStepMapField;
  @Input() isActive:boolean;

  @ViewChild("input") input;

  currentIssueText:string = "";

  constructor() { }

  ngOnInit(): void {
    this.field.issues = [];
  }

  addIssue() {
    this.field.issues.push(this.currentIssueText);
    this.currentIssueText = "";
    console.log(this.input)
    this.input.select();
  }

  removeIssue(issueIdx:number) {
    this.field.issues = this.field.issues.splice(issueIdx, 1);
  }
}
