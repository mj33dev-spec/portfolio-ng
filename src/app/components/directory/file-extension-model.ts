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

// --- 기타/커스텀 확장자 전용 추상 클래스 (SVG 동적 생성) ---
export abstract class Abstract_Extension_Others extends Abstract_Extension {
  main_color: string;

  constructor(
    extension_name: string,
    main_color: string = '#46A852',
    folder_color?: Type_FolderColor
  ) {
    const svgUrl = Abstract_Extension_Others.generateSvgDataUrl(extension_name, main_color);
    super(extension_name, svgUrl, folder_color);
    this.main_color = main_color;
  }

  /**
   * 확장명과 메인 색상값을 기반으로 SVG Data URI 생성
   */
  static generateSvgDataUrl(extension_name: string, mainColor: string): string {
    const rawExt = extension_name.trim();
    const cleanExt = rawExt.startsWith('.') ? rawExt.slice(1).toUpperCase() : rawExt.toUpperCase();

    // 텍스트 글자 수에 따른 font-size 및 위치 자동 계산 (대형화 & 가독성 향상)
    const fontSize = cleanExt.length >= 4 ? 60 : 80;

    const svgString = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_others)">
  <rect width="512" height="512" rx="120" fill="white"/>
  <rect width="512" height="512" rx="23" fill="${mainColor}"/>
  <path d="M364.5 183.499L698.616 496.642L496.616 712.225L150.001 390L364.5 183.499Z" fill="black" fill-opacity="0.2"/>
  <g clip-path="url(#clip1_others)">
    <path d="M146 106C146 103.791 147.791 102 150 102H283.5L366 184.8V392C366 394.209 364.209 396 362 396H150C147.791 396 146 394.209 146 392L146 106Z" fill="white"/>
  </g>
  <g clip-path="url(#clip2_others)">
    <path opacity="0.3" d="M284 102L366.8 184.8H288C285.791 184.8 284 183.009 284 180.8V102Z" fill="${mainColor}"/>
  </g>
  <text x="256" y="310" text-anchor="middle" dominant-baseline="central" fill="${mainColor}" font-size="${fontSize}" font-weight="900" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${cleanExt}</text>
</g>
<defs>
  <clipPath id="clip0_others">
    <rect width="512" height="512" rx="120" fill="white"/>
  </clipPath>
  <clipPath id="clip1_others">
    <rect x="146" y="102" width="220" height="294" rx="17" fill="white"/>
  </clipPath>
  <clipPath id="clip2_others">
    <path d="M284 102H366.8V184.8H301C291.611 184.8 284 177.189 284 167.8V102Z" fill="white"/>
  </clipPath>
</defs>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }
}

export class Model_Extension_Folder extends Abstract_Extension {
  view_type = 'explorer';
  constructor(color?: Type_FolderColor) {
    super('', 'assets/icons/files/folder.png');
  }
}

export class Model_Extension_EXE extends Abstract_Extension {
  view_type = 'unsupported';
  constructor() {
    super('.exe', 'assets/icons/files/exe.png');
  }
}

export class Model_Extension_PDF extends Abstract_Extension_Others {
  view_type = 'pdf';
  constructor() {
    super('.pdf', '#E53935');
  }
}

export class Model_Extension_Trash extends Abstract_Extension {
  view_type = 'explorer';
  constructor() {
    super('휴지통', 'assets/icons/files/trash.png');
  }
}

export class Model_Extension_TXT extends Abstract_Extension_Others {
  view_type = 'text';
  constructor(text: string = '') {
    super('.txt', '#666666');
    this.text = text;
  }
}

export class Model_Extension_MP3 extends Abstract_Extension {
  view_type = 'audio';
  constructor() {
    super('.mp3', 'assets/icons/files/audio.png');
  }
}

export class Model_Extension_HTML extends Abstract_Extension {
  view_type = 'html';
  constructor(extension_name: string = '.html', text: string = '') {
    super(extension_name, 'assets/icons/files/explorer.png');
    this.text = text;
  }
}

export class Model_Extension_Empty extends Abstract_Extension_Others {
  view_type = 'unsupported';
  constructor() {
    super('', '#999999');
  }
}

export class Model_Extension_IMAGE extends Abstract_Extension {
  view_type = 'image';
  constructor(color?: Type_FolderColor) {
    super('.png', 'assets/icons/files/picture.png', color);
  }
}

export class Model_Extension_PSD extends Abstract_Extension_Others {
  view_type = 'psd';
  constructor() {
    super('.psd', '#31A8FF');
  }
}

export class Model_Extension_AI extends Abstract_Extension_Others {
  view_type = 'ai';
  constructor() {
    super('.ai', '#FF9A00');
  }
}

export class Model_Extension_Others extends Abstract_Extension_Others {
  view_type = 'unsupported';
  constructor(extension_name: string = '', main_color: string = '#46A852') {
    super(extension_name, main_color);
  }
}

export class Model_Extension_XLSX extends Abstract_Extension_Others {
  view_type = 'excel';
  constructor() {
    super('.xlsx', '#107C41');
  }
}

export class Model_Extension_Word extends Abstract_Extension_Others {
  view_type = 'word';
  constructor() {
    super('.docx', '#185ABD');
  }
}

export class Model_Extension_HWP extends Abstract_Extension_Others {
  view_type = 'hwp';
  constructor() {
    super('.hwp', '#3568B2');
  }
}

export class Model_Extension_CSS extends Abstract_Extension_Others {
  view_type = 'code';
  constructor(text: string = '') {
    super('.css', '#264DE4');
    this.text = text;
  }
}

export class Model_Extension_JS extends Abstract_Extension_Others {
  view_type = 'code';
  constructor(text: string = '') {
    super('.js', '#F7DF1E');
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

  // 기본값 (알 수 없는 파일 확장자 - 동적 SVG 커스텀 모델 생성)
  const ext = fileName.substring(lastDotIndex);
  return new Model_Extension_Others(ext, '#46A852');
}

