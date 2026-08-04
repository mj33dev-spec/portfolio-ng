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
      subtitle: '기본기를 갖춘 디자이너',
      description: '폰트 크기와 간격, 색상 값 등을 스타일가이드로 정리하여 일관되고 정돈된 디자인을 추구하며 반응형을 고려한 디자인 설계를 지향합니다.',
      icon: 'design'
    },
    {
      title: 'Web Publishing',
      subtitle: '개발자가 보아도 이해할 수 있도록',
      description: '- 개발자는 기능 개발에 집중할 수 있도록 아코디언이나 라디오버튼 등 데이터처리가 필요없는 UI는 최대한 스크립트에 의존하지 않으려 노력합니다. \n- HTML5 표준에 맞는 시맨틱 태그와 웹표준을 준수하며, 들여쓰기 지옥을 피하고자 div 사용을 최소화 하는 것을 목표로 마크업합니다. \n- 스타일가이드 및 자주 사용하는 UI를 scss 상수 및 함수화하여 재사용성을 갖춘 스타일을 지향합니다. \n- UX를 고려하여 버튼에는 hover 혹은 클릭 범위까지 고려하여 잘못 클릭하는 일이 없도록 코드로 디자인합니다.',
      icon: 'publishing'
    },
    {
      title: 'Frontend',
      subtitle: '인터랙티브하고 역동적인 경험',
      description: '최신 웹 기술을 활용하여 빠르고 부드러운 인터랙션을 구현합니다. 성능 최적화와 컴포넌트 모듈화를 통해 확장 가능하고 유지보수가 용이한 프론트엔드 생태계를 구축합니다.',
      icon: 'frontend'
    },
    {
      title: 'Backend',
      subtitle: '기본기에 AI를 더한 개발자',
      description: '- GET, POST, PUT, DELETE HTTP 메서드를 이해하고 REST API를 설계합니다. \n- 쿼리문 작성시 CREATE 혹은 SELECT 정도는 사용 가능하며 UPDATE 그리고 DELETE의 경우에는 신중히 결정합니다. \n- DB환경 세팅과 간단한 수정 가능합니다.\n- Supabase를 사용한 프로젝트 개발 경험이 있습니다.',
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
