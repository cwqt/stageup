import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ui-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss']
})
export class ChipComponent implements OnInit {
  @Input() kind:
    | 'primary'
    | 'red'
    | 'magenta'
    | 'purple'
    | 'blue'
    | 'cyan'
    | 'teal'
    | 'green'
    | 'gray'
    | 'cool-grey'
    | 'orange'
    | 'deep-blush'
    | 'warm-grey' = 'cool-grey';

  constructor() {}

  ngOnInit(): void {}
}
