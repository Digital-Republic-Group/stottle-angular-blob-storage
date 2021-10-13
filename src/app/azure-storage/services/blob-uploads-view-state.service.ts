import { Injectable } from '@angular/core';
import { from, OperatorFunction, Subject } from 'rxjs';
import { map, mergeMap, startWith, switchMap } from 'rxjs/operators';
import { EnhancedBlobItem } from 'src/app/models/EnhancedBlobItem.model';
import { BlobContainerRequest, BlobItemUpload } from '../types/azure-storage';
import { BlobSharedViewStateService } from './blob-shared-view-state.service';
import { BlobStorageService } from './blob-storage.service';

@Injectable({
  providedIn: 'root',
})
export class BlobUploadsViewStateService {
  // private uploadQueueInner$ = new Subject<FileList>();
  private uploadQueueInner$ = new Subject<EnhancedBlobItem[]>();

  // this gets the upload queue (as an array via the getter)
  // and for each file triggers the upload function
  uploadedItems$ = this.uploadQueue$.pipe(
    mergeMap((file) => this.uploadFile(file)),
    // this reads the container we are uploading to and returns a list of files(?)
    this.blobState.scanEntries()
  );

  get uploadQueue$() {
    return (
      this.uploadQueueInner$
        .asObservable()
        // I think this just turns an array into a stream ("from"[array])
        .pipe(mergeMap((files) => from(files)))
    );
  }

  constructor(
    private blobStorage: BlobStorageService,
    private blobState: BlobSharedViewStateService
  ) {}

  // uploadItems(files: FileList): void {
  //   this.uploadQueueInner$.next(files);
  // }
  // uploadItems(files: File[]): void {
  uploadItems(enhancedBlobItems: EnhancedBlobItem[]): void {
    this.uploadQueueInner$.next(enhancedBlobItems);
  }

  // private uploadFile = (file: File) =>
  private uploadFile = (enhancedBlobItem: EnhancedBlobItem) =>
    this.blobState.getStorageOptionsWithContainer().pipe(
      switchMap((options) =>
        this.blobStorage
          .uploadToBlobStorage(enhancedBlobItem.file, {
            ...options,
            //filename: file.name + new Date().getTime(),
            // CAN CHANGE THE FILE NAME HERE!
            // filename: file.name,
            // file.type should be mime type and maps to content type in the blob
            filename: enhancedBlobItem.id,
          })
          .pipe(
            this.mapUploadResponse(enhancedBlobItem, options),
            this.blobState.finaliseBlobChange(options.containerName)
          )
      )
    );

  private mapUploadResponse =
    (
      // file: File,
      enhancedBlobItem: EnhancedBlobItem,
      options: BlobContainerRequest
    ): OperatorFunction<number, BlobItemUpload> =>
    (source) =>
      source.pipe(
        map((progress) => ({
          filename: enhancedBlobItem.id,
          containerName: options.containerName,
          progress: parseInt(
            ((progress / enhancedBlobItem.file.size) * 100).toString(),
            10
          ),
        })),
        startWith({
          filename: enhancedBlobItem.id,
          containerName: options.containerName,
          progress: 0,
        })
      );
}
