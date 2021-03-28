import { Component, OnInit } from '@angular/core';
import { IEnvelopedData, IPerformanceStub } from '@core/interfaces';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { cachize, createICacheable, ICacheable } from '../../app.interfaces';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-my-stuff',
  templateUrl: './my-stuff.component.html',
  styleUrls: ['./my-stuff.component.scss']
})
export class MyStuffComponent implements OnInit {
  myStuff: ICacheable<IEnvelopedData<IPerformanceStub[]>> = createICacheable([]);
  searchTerms = new Subject<string>();

  constructor(private myselfService: MyselfService) {}

  ngOnInit() {
    this.searchTerms.pipe(
      debounceTime(300), // wait 300ms after each keystroke before considering the term
      distinctUntilChanged() // ignore new term if same as previous term,
    ).subscribe(term => cachize(this.myselfService.readMyPurchasedPerformances(term), this.myStuff));

    this.searchTerms.next('');
  }

  onChange(event:string) {
    if(event && typeof event == "string") this.searchTerms.next(event);
  }
}
