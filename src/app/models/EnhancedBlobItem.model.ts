import { BlobItem } from '../azure-storage/types/azure-storage';
import { Guid } from 'guid-typescript';

export interface EnhancedBlobItem extends BlobItem {
  //filename - from BlobItem
  //containername - from BlobItem
  id: string; // from Guid
  type: 'photo' | 'video' | 'file';
  file: File; // Blob extended with lastmodified and name
  lastmodified: number;
  filesize: number;
  filetype: string;
}
