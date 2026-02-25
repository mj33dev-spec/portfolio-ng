// 폴더 색상 타입
export type Type_FolderColor = 'R' | 'Y' | 'G' | 'B' | 'P'; // Red, Yellow, Green, Blue, Purple

// 확장명 모델
export abstract class Abstract_Extension {
  // 확장명 (.exe, .jpeg, .jpg, .png, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .json, .xml, .html, .css, .js, .ts, .php, .py, .java, .c, .cpp, .h, .hpp, .cs, .vb, .sql, .db, .db3, .db4, .db5, .db6, .db7, .db8, .db9, .db10)
  extension_name: string;
  // 이미지 경로 (색상이 없을 때 사용)
  img_path: string;
  // 폴더 색상 (폴더일 때만 사용, 색상이 있으면 이미지 대신 색상 사용)
  folder_color?: Type_FolderColor;
  // 텍스트 파일 내용 (텍스트 파일일 때만 사용)
  text?: string;
  // 윈도우 타입 (창 열 때 사용)
  abstract view_type: string;

  constructor(
    extension_name: string,
    img_path: string,
    folder_color?: Type_FolderColor
  ) {
    this.extension_name = extension_name;
    this.img_path = img_path;
    this.folder_color = folder_color;
  }

  // 색상 코드 반환 (폴더 색상이 있을 때)
  getColorCode(): string | null {
    if (!this.folder_color) return null;

    const colorMap: Record<Type_FolderColor, string> = {
      R: '#EF4444', // Red
      Y: '#FBBF24', // Yellow
      G: '#10B981', // Green
      B: '#3B82F6', // Blue
      P: '#8B5CF6', // Purple
    };

    return colorMap[this.folder_color];
  }
}

export class Model_Extension_Folder extends Abstract_Extension {
  view_type = 'explorer';
  constructor(color?: Type_FolderColor) {
    super('', 'assets/icons/folder.svg', color);
  }
}
export class Model_Extension_EXE extends Abstract_Extension {
  view_type = 'unsupported';
  constructor() {
    super('.exe', 'assets/icons/files/png/실행파일.png');
  }
}
export class Model_Extension_PDF extends Abstract_Extension {
  view_type = 'pdf';
  constructor() {
    super('.pdf', 'assets/icons/files/png/빈문서.png');
  }
}
export class Model_Extension_Trash extends Abstract_Extension {
  view_type = 'explorer';
  constructor() {
    super('휴지통', 'assets/icons/files/svg/휴지통.svg');
  }
}

export class Model_Extension_TXT extends Abstract_Extension {
  view_type = 'text';
  constructor(text: string = '') {
    super('.txt', '/assets/icons/files/png/텍스트.png');
    this.text = text;
  }
}

export class Model_Extension_MP3 extends Abstract_Extension {
  view_type = 'audio';
  constructor() {
    super('.mp3', 'assets/icons/primary/png/audio.png');
  }
}

export class Model_Extension_HTML extends Abstract_Extension {
  view_type = 'html';
  constructor(extension_name: string = '.html', text: string = '') {
    super(extension_name, 'assets/icons/files/png/빈문서.png');
    this.text = text;
  }
}

export class Model_Extension_Empty extends Abstract_Extension {
  view_type = 'unsupported';
  constructor() {
    super('', 'assets/icons/files/png/빈문서.png');
  }
}



export class Model_Extension_IMAGE extends Abstract_Extension {
  view_type = 'image';
  constructor(color?: Type_FolderColor) {
    super('.png', 'assets/images/image.png', color);
  }
}

// --- 신규 확장자 모델 (사용자 설계 패턴 계승) ---
export class Model_Extension_PSD extends Abstract_Extension {
  view_type = 'psd';
  constructor() {
    super('.psd', 'assets/icons/files/png/미디어파일.png');
  }
}

export class Model_Extension_AI extends Abstract_Extension {
  view_type = 'ai';
  constructor() {
    super('.ai', 'assets/icons/files/png/미디어파일.png');
  }
}

export class Model_Extension_XLSX extends Abstract_Extension {
  view_type = 'excel';
  constructor() {
    super('.xlsx', 'assets/icons/files/png/엑셀.png');
  }
}

export class Model_Extension_Word extends Abstract_Extension {
  view_type = 'word';
  constructor() {
    super('.docx', 'assets/icons/files/png/워드.png');
  }
}

export class Model_Extension_HWP extends Abstract_Extension {
  view_type = 'hwp';
  constructor() {
    super('.hwp', 'assets/icons/files/png/한글.png');
  }
}

export class Model_Extension_CSS extends Abstract_Extension {
  view_type = 'code';
  constructor(text: string = '') {
    super('.css', 'assets/icons/files/png/텍스트.png');
    this.text = text;
  }
}

export class Model_Extension_JS extends Abstract_Extension {
  view_type = 'code';
  constructor(text: string = '') {
    super('.js', 'assets/icons/files/png/텍스트.png');
    this.text = text;
  }
}

export function getExtensionModelByFileName(fileName: string): Abstract_Extension {
  const lowerName = fileName.toLowerCase();
  const lastDotIndex = lowerName.lastIndexOf('.');

  // 확장자가 없는 경우
  if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === lowerName.length - 1) {
    return new Model_Extension_Empty();
  }

  if (lowerName.endsWith('.exe')) return new Model_Extension_EXE();
  if (lowerName.endsWith('.pdf')) return new Model_Extension_PDF();
  if (lowerName.endsWith('.txt')) return new Model_Extension_TXT();
  if (lowerName.endsWith('.mp3')) return new Model_Extension_MP3();
  if (lowerName.endsWith('.html')) return new Model_Extension_HTML('.html');
  if (lowerName.endsWith('.htm')) return new Model_Extension_HTML('.htm');

  if (lowerName.endsWith('.psd')) return new Model_Extension_PSD();
  if (lowerName.endsWith('.ai')) return new Model_Extension_AI();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return new Model_Extension_XLSX();
  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) return new Model_Extension_Word();
  if (lowerName.endsWith('.hwp')) return new Model_Extension_HWP();
  if (lowerName.endsWith('.css')) return new Model_Extension_CSS();
  if (lowerName.endsWith('.js')) return new Model_Extension_JS();

  if (
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.gif') ||
    lowerName.endsWith('.bmp') ||
    lowerName.endsWith('.webp')
  ) return new Model_Extension_IMAGE();
  
  // 기본값 (알 수 없는 파일 - 빈 문서로 처리하거나 별도 처리)
  return new Model_Extension_Empty(); 
}
