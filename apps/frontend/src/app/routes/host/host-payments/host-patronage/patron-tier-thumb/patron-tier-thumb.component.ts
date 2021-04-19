import { Component, Input, OnInit } from '@angular/core';
import { IPatronTier, IHostPatronTier } from '@core/interfaces';

function isHostPatronTier(patron: IPatronTier | IHostPatronTier): patron is IHostPatronTier {
  return (patron as IHostPatronTier).total_patrons !== undefined;
}

@Component({
  selector: 'app-patron-tier-thumb',
  templateUrl: './patron-tier-thumb.component.html',
  styleUrls: ['./patron-tier-thumb.component.scss']
})
export class PatronTierThumbComponent implements OnInit {
  @Input() tier:IPatronTier | IHostPatronTier;
  isHostPatronTier:boolean;

  constructor() { }

  ngOnInit(): void {
    this.isHostPatronTier = isHostPatronTier(this.tier);
  }

}
