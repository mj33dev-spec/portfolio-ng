import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PhilosophyCard {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-philosophy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './philosophy.component.html',
  styleUrls: ['./philosophy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhilosophyComponent {
  openIndex = signal<number | null>(0); // 첫 번째 카드를 기본으로 열어둡니다.

  cards: PhilosophyCard[] = [
    {
      title: 'Philosophy',
      subtitle: '개발자를 위한 개발자',
      description: '어렸을 때 게임을 하다보면 게임을 직접 만들고 싶었고 코딩을 배우다보면 개발 언어를 직접 만들어보고 싶었던 호기심이 지금의 제가 있도록 해주었습니다. HomeBrew를 사용하던중 영감을 얻어 프레임워크마다 쉘스크립트 매크로를 만들거나, 윈도우 단축키를 커스텀하는 등 생산적인 설계에 관심이 많습니다. 향후에는 VScode의 확장이나 제가 자주 사용하는 코드 조각들을 라이브러리로 배포하여 개발자들의 효율을 돕는 프로그래머를 꿈꾸곤 합니다.',
      icon: 'philosophy'
    },
    {
      title: 'Design',
      subtitle: '중간만 따라가자 🥹',
      description: '- 폰트/크기/간격/색상/UI 컴포넌트 등을 스타일가이드로 정리하여 일관되고 정돈된 디자인을 추구합니다.\n- 간단한 아이콘은 Figma, Photoshop, Illustrator를 사용하여 직접 제작하거나 변형하여 사용할 수 있습니다.\n - 아이콘 제작시 가급적 벡터 방식을 사용하여 용량과 해상도를 최적화합니다. 또한 선 굵기나 간격 등을 고려하여 스타일이 일관되도록 노력합니다.',
      icon: 'design'
    },
    {
      title: 'Web Publishing',
      subtitle: '정돈된 UI 설계',
      description: '- 개발자는 기능 개발에 집중할 수 있도록 아코디언이나 라디오버튼 등 데이터처리가 필요없는 UI는 최대한 스크립트에 의존하지 않으려 노력합니다. \n- HTML5 표준에 맞는 시맨틱 태그와 웹표준을 준수하며, 들여쓰기 지옥을 피하고자 div 사용을 최소화 하는 것을 목표로 마크업합니다. \n- 스타일가이드 및 자주 사용하는 UI를 scss 상수 및 함수화하여 재사용성을 갖춘 스타일을 지향합니다. \n- UX 관점에서 사용자가 버튼을 잘못 클릭하는 일이 없도록 hover 혹은 클릭 범위를 코드로 디자인합니다. \n- CSS 작성시, 같은 UI를 설계하더라도 위치/간격/정렬순서/크기/모양/색상/폰트 순서로 일관되도록 작성하고자 노력합니다. \n- 반응형 설계시 미디어쿼리를 사용하되, flex-wrap/min-width/max-width 속성을 활용하여 코드의 중복적인 패턴을 줄이기 위해 고민합니다.',
      icon: 'publishing'
    },
    {
      title: 'Frontend',
      subtitle: '엔지니어가 된다는 집념',
      description: '- 개발 착수하기 전, 노션 또는 엑셀을 이용하여 용어사전/파일명/페이지주소/스타일가이드 등을 문서화하여 협업간 혼선을 최소화합니다.\n- 완성에 도달하면 QA/QC/Defeat 체크리스트를 문서화하여 내부적으로 테스트할 수 있는 환경을 조성하고 고객들에게 제공합니다. \n- 디자이너는 자신만의 애셋을 제작하여 소장하듯, 모달/드롭다운/체크박스/라디오/버튼 등 공통 UI를 직접 제작하여 관리합니다. 또한 assert/Doc주석을 활용하여 사용법과 상태를 문서화하여 제공하고자 노력합니다.\n- 포스트맨을 사용하여 API 데이터를 주고 받을 수 있도록 통신 환경 설계 및 사용이 가능합니다. \n- 프로젝트 구동이나 git과 같은 자주 사용하는 명령어들은 쉘 스크립트를 개발하여 관리합니다.',
      icon: 'frontend'
    },
    {
      title: 'Backend',
      subtitle: '기본기에 AI를 더한 개발자',
      description: '- GET, POST, PUT, DELETE HTTP 메서드를 이해하고 REST API를 설계합니다. \n- 쿼리문 작성시 CREATE 혹은 SELECT 정도는 사용 가능하며 UPDATE 그리고 DELETE의 경우에는 신중히 결정합니다. \n- MariaDB 및 Supabase를 사용한 프로젝트 개발 경험이 있어, 작은 규모의 프로젝트라면 직접 개발이 가능합니다.',
      icon: 'backend'
    },
  ];

  toggleCard(index: number) {
    if (this.openIndex() === index) {
      this.openIndex.set(null); // 이미 열려있다면 닫기
    } else {
      this.openIndex.set(index); // 다른 카드를 클릭하면 열기 (기존 카드는 닫힘)
    }
  }
}
