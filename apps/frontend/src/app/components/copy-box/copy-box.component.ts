import { Component, Input, OnInit } from '@angular/core';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-copy-box',
  templateUrl: './copy-box.component.html',
  styleUrls: ['./copy-box.component.scss']
})
export class CopyBoxComponent implements OnInit {
  @Input() textToBeCopied = ''; // so as to not display 'undefined' when no input
  copied = false;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {}

  showSuccessMessage(): void {
    this.toastService.emit($localize`Copied to clipboard`, ThemeKind.Accent);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 3000);
  }
}
