import { Component, ElementRef, ViewChild } from '@angular/core';
import { BlobUploadsViewStateService } from '../services/blob-uploads-view-state.service';

@Component({
  selector: 'app-input-file',
  template: `
    <input
      style="display: none"
      type="file"
      #fileInput
      multiple="multiple"
      (change)="onSelected($event.target)"
    />
    <button (click)="showFileDialog()">Click here to Upload File</button>
  `,
})
export class InputFileComponent {
  @ViewChild('fileInput', { static: false })
  fileInput: ElementRef<HTMLInputElement>;

  constructor(
    private blobState: BlobUploadsViewStateService 
  ) {}

  onSelected(target: any): void {
    const files = target.files;

    // upload the files to azure
    this.blobState.uploadItems(files);
    this.fileInput.nativeElement.value = '';
  }

  showFileDialog(): void {
    this.fileInput.nativeElement.click();
  }
}
