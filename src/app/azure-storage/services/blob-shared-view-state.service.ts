import { Injectable } from '@angular/core';
import { ContainerCreateResponse, Metadata } from '@azure/storage-blob';
import {
  BehaviorSubject,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
} from 'rxjs';
import {
  filter,
  finalize,
  map,
  scan,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {
  BlobContainerRequest,
  BlobItem,
  BlobStorageRequest,
  Dictionary,
} from '../types/azure-storage';
import { BlobStorageService } from './blob-storage.service';
import { SasGeneratorService } from './sas-generator.service';

@Injectable({
  providedIn: 'root',
})
export class BlobSharedViewStateService {
  private selectedContainerInner$ = new BehaviorSubject<string>(undefined);

  containers$ = this.getStorageOptions().pipe(
    switchMap((options) => this.blobStorage.getContainers(options))
  );

  // added mrobst
  createContainer(
    containerName: string,
    metadata?: Metadata
  ): Observable<ContainerCreateResponse> {
    return this.getStorageOptions().pipe(
      switchMap((options) =>
        this.blobStorage.createContainer(
          { ...options, containerName },
          metadata
        )
      )
    );
  }

  // added mrobst
  existsContainer(containerName: string): Observable<boolean> {
    return this.getStorageOptions().pipe(
      switchMap((options) =>
        this.blobStorage.exists({ ...options, containerName })
      )
    );
  }

  itemsInContainer$ = this.selectedContainer$.pipe(
    filter((containerName) => !!containerName),
    switchMap((containerName) =>
      this.getStorageOptions().pipe(
        switchMap((options) =>
          this.blobStorage.listBlobsInContainer({
            ...options,
            containerName,
          })
        )
      )
    )
  );

  get selectedContainer$() {
    return this.selectedContainerInner$.asObservable();
  }

  constructor(
    private sasGenerator: SasGeneratorService,
    private blobStorage: BlobStorageService
  ) {}

  getContainerItems(containerName: string): void {
    this.selectedContainerInner$.next(containerName);
  }

  finaliseBlobChange =
    <T>(containerName: string): MonoTypeOperatorFunction<T> =>
    (source) =>
      source.pipe(
        finalize(
          () =>
            this.selectedContainerInner$.value === containerName &&
            this.selectedContainerInner$.next(containerName)
        )
      );

  scanEntries =
    // operator function is RXJS custom function that takes an observable in and emits an observable
    // <Type>() is a (generic) type that the function uses e.g. https://www.typescriptlang.org/docs/handbook/2/generics.html


      <T extends BlobItem>(): OperatorFunction<T, T[]> =>
      // source is the input observable passed to the (Operator) Function
      (source) =>
        source.pipe(
          tap((source) =>
            console.warn('tap scanEntries with source value ', source)
          ),
          map((item) => ({
            [`${item.containerName}-${item.filename}`]: item,
          })),
          // map changes the format of item to be containerName-filename
          tap((item) => {
            console.log('tap after map item gives ', item);
          }),
          scan<Dictionary<T>>(
            (items: any, item) => ({
              // ...items, //commenting this prevents any accumulation and keeps only the current value
              ...item,
            })
            // {}
          ),
          tap((items) => {
            console.log('tap after scan dictionary gives ', items);
          }),
          map((items) => Object.values(items)),
          tap((items) => {
            console.log('tap after map items to object values gives ', items);
          })
        );

  getStorageOptionsWithContainer(
    duration?: number
  ): Observable<BlobContainerRequest> {
    return this.getStorageOptions(duration).pipe(
      withLatestFrom(this.selectedContainer$),
      map(([options, containerName]) => ({ ...options, containerName }))
    );
  }

  private getStorageOptions(duration?: number): Observable<BlobStorageRequest> {
    return this.sasGenerator.getSasToken(duration);
  }
}
