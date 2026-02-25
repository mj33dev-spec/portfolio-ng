import {
  Abstract_Extension,
  Model_Extension_Folder,
  Type_FolderColor,
} from './file-extension-model';

// 파일 모델
export abstract class Abstract_File {
  abstract readonly type: 'folder' | 'file';
  uuid: string;
  extension_info: Abstract_Extension;

  file_name: string;
  file_path: string;
  file_size: number;
  file_created_at: Date;
  file_updated_at: Date;
  children: Abstract_File[];
  expanded: 'open' | 'close';
  isLoaded: boolean;
  folder_id?: number; // 폴더 ID (folder의 경우 folder_id, file의 경우 부모 folder_id)
  children_count?: number; // 자식 개수 (폴더의 경우 하위 폴더 + 파일 개수)
  x?: number; // 바탕화면의 x 좌표
  y?: number; // 바탕화면의 y 좌표

  constructor(
    uuid: string,
    extension_info: Abstract_Extension,
    file_name: string,
    file_path: string,
    file_size: number,
    file_created_at?: Date,
    file_updated_at?: Date,
    children?: Abstract_File[],
    folder_id?: number
  ) {
    this.uuid = uuid;
    this.extension_info = extension_info;
    this.file_name = file_name;
    this.file_path = file_path;
    this.file_size = file_size;
    this.file_created_at = file_created_at || new Date();
    this.file_updated_at = file_updated_at || new Date();
    this.children = children || [];
    this.expanded = 'close';
    this.isLoaded = false;
    this.folder_id = folder_id;
  }
}

export class Model_Folder extends Abstract_File {
  readonly type = 'folder' as const;

  constructor(
    uuid: string,
    file_name: string,
    file_path: string,
    file_size: number = 0,
    folder_color?: Type_FolderColor,
    file_created_at?: Date,
    file_updated_at?: Date,
    children?: Abstract_File[],
    folder_id?: number
  ) {
    super(
      uuid,
      new Model_Extension_Folder(folder_color),
      file_name,
      file_path,
      file_size,
      file_created_at,
      file_updated_at,
      children,
      folder_id
    );
  }
}

export class Model_File extends Abstract_File {
  readonly type = 'file' as const;

  constructor(
    uuid: string,
    extension_info: Abstract_Extension,
    file_name: string,
    file_path: string,
    file_size: number,
    file_created_at?: Date,
    file_updated_at?: Date,
    children?: Abstract_File[],
    folder_id?: number
  ) {
    super(
      uuid,
      extension_info,
      file_name,
      file_path,
      file_size,
      file_created_at,
      file_updated_at,
      children,
      folder_id
    );
  }
}

export interface QuickLookInfo {
  visible: boolean;
  file: Abstract_File | null;
  content?: any;
  loading: boolean;
  x: number;
  y: number;
  type: string;
  sheets?: any[];
  activeSheetIndex?: number;
  source?: 'keyboard' | 'hover';
  children?: Abstract_File[]; // 폴더 미리보기를 위한 자식 목록
}
