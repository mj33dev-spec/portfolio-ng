import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface YearCareer {
  year: string;
  num: string;
  items: string[];
}

@Component({
  selector: 'app-career',
  standalone: true,
  templateUrl: './career.component.html',
  styleUrls: ['./career.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerComponent {
  careerList: YearCareer[] = [
    {
      year: '2026 ~',
      num: '01',
      items: [
        '- 20.12.10 - 26.03.06 | 앨리스래빗 근무 5년',
        '- [NeuroBlinker] 의료 관련 웹 프로젝트 (웹퍼블리싱 & 개발)',
        '- [Carepasspro] 자격증 모의시험 CBT 웹 프로젝트 (기획 & 디자인 & 풀스택)',
        '- [앨리스메모] 사내프로젝트 앱 프로젝트 (개발)',
        '- [mj_ui_kits] 플러터 package 개발 및 상용화',
        '사내 올해의 우수 사원상 (Best Developer) 수상',
        '실시간 소켓 연동 차트 시각화 모듈 구축'
      ]
    },
    {
      year: '2024',
      num: '02',
      items: [
        'Micro-Frontend 아키텍처 전환 완료',
        '오픈소스 UI 라이브러리 기여',
        '2023.11 | 웹 접근성 우수 프로젝트 대상 (한국웹접근성협회 주관)',
        '차세대 고객 관리(CRM) 시스템 UI 개편'
      ]
    },
    {
      year: '2022',
      num: '03',
      items: [
        '2022.05 | SQL 개발자 (SQLD) 자격 취득',
        '사내 공통 관리자 라이브러리 개발'
      ]
    },
    {
      year: '~ 2020',
      num: '04',
      items: [
        '2020.08 | 정보처리기사 자격 취득',
        '웹 개발 프론트엔드 전문 교육 과정 수료'
      ]
    }
  ];
}
