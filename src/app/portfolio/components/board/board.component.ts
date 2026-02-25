
import { Component, ChangeDetectionStrategy, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../post.model';

@Component({
  selector: 'app-board',
  standalone: true,
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  posts = signal<Post[]>([]);
  currentPage = signal(1);
  itemsPerPage = 5;

  totalPages = computed(() => Math.ceil(this.posts().length / this.itemsPerPage));
  
  paginatedPosts = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.posts().slice(start, end);
  });

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  ngOnInit() {
    this.posts.set([
      { id: 1, title: 'Angular의 새로운 Signal 기반 상태 관리', content: '최신 Angular 버전에서 도입된 Signal은 반응형 프로그래밍을 더 쉽고 효율적으로 만들어줍니다. Zone.js에 대한 의존성을 줄이고, 더 세밀한 변경 감지를 통해 성능을 크게 향상시킬 수 있습니다.', color: 'dodgerblue' },
      { id: 2, title: 'Tailwind CSS를 사랑할 수밖에 없는 이유', content: '유틸리티-퍼스트 접근 방식은 CSS 작성 방식을 혁신적으로 바꿨습니다. 미리 정의된 클래스를 조합하여 빠르고 일관된 디자인 시스템을 구축할 수 있으며, 커스터마이징이 매우 유연합니다.', color: 'orange' },
      { id: 3, title: '마이크로 프론트엔드 아키텍처 탐구', content: '대규모 애플리케이션을 여러 개의 독립적인 프론트엔드 프로젝트로 분리하여 개발하고 배포하는 방식입니다. 이를 통해 팀의 자율성을 높이고 기술 스택의 제약을 줄일 수 있습니다.', color: 'pink' },
      { id: 4, title: '타입스크립트, 왜 선택이 아닌 필수인가?', content: '자바스크립트에 정적 타입을 추가하여 대규모 애플리케이션의 안정성과 유지보수성을 크게 향상시킵니다. 컴파일 시점에 오류를 발견하여 런타임 버그를 사전에 방지할 수 있습니다.', color: 'lightgreen' },
      { id: 5, title: 'D3.js로 만드는 인터랙티브 데이터 시각화', content: '데이터를 단순히 보여주는 것을 넘어 사용자가 직접 탐색하고 상호작용할 수 있는 동적인 시각화 경험을 제공합니다. SVG, Canvas, HTML을 활용하여 풍부한 표현이 가능합니다.', color: 'dodgerblue' },
      { id: 6, title: '웹 성능 최적화: Core Web Vitals', content: '사용자 경험의 질을 측정하는 핵심 지표인 LCP, FID, CLS를 이해하고 최적화하는 것은 현대 웹 개발의 필수 요소입니다. 이미지 최적화, 코드 분할 등을 통해 개선할 수 있습니다.', color: 'orange' },
      { id: 7, title: 'RxJS 마스터하기: Observable과 Operator', content: '비동기 이벤트와 데이터 스트림을 효과적으로 처리하기 위한 강력한 라이브러리입니다. 다양한 Operator를 조합하여 복잡한 비동기 로직을 선언적이고 우아하게 작성할 수 있습니다.', color: 'pink' },
      { id: 8, title: 'SSR과 SSG: 현대 웹 렌더링 전략', content: '서버 사이드 렌더링(SSR)과 정적 사이트 생성(SSG)은 초기 로딩 속도 개선과 검색 엔진 최적화(SEO)에 큰 이점을 제공합니다. 프로젝트의 특성에 맞는 렌더링 전략 선택이 중요합니다.', color: 'lightgreen' },
      { id: 9, title: 'PWA(Progressive Web App)의 미래', content: '웹 기술을 사용하여 네이티브 앱과 같은 사용자 경험을 제공합니다. 오프라인 지원, 푸시 알림 등의 기능으로 웹의 접근성과 앱의 편의성을 모두 잡을 수 있습니다.', color: 'dodgerblue' },
      { id: 10, title: '효과적인 코드 리뷰를 위한 팁', content: '코드 리뷰는 단순히 버그를 찾는 과정이 아닙니다. 건설적인 피드백을 통해 지식을 공유하고, 팀 전체의 코드 품질과 개발 문화를 향상시키는 중요한 활동입니다.', color: 'orange' },
    ]);
  }
  
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.currentPage.set(pageNumber);
    }
  }
}
