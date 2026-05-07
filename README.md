# 뚝딱! 분수 조각 탐험대

초등 학생이 슬라이더로 분수 A/B를 만들고, 원형 또는 막대 모델로 분수의 크기를 비교해 볼 수 있는 정적 웹앱입니다. 단위분수 모드와 랜덤 10문제 퀴즈를 함께 제공합니다.

## 배포 URL

[https://wbmaker2.github.io/Visual-Fraction-Lab/](https://wbmaker2.github.io/Visual-Fraction-Lab/)

## 로컬 실행

별도 빌드가 필요 없습니다. 저장소 루트에서 정적 서버를 띄운 뒤 브라우저로 접속하시면 됩니다.

```bash
python3 -m http.server 8788
```

```text
http://localhost:8788/
```

## 검증

Node.js 내장 테스트 러너만 사용합니다. 의존성 설치 없이 바로 실행할 수 있습니다.

```bash
npm run verify
```

개별 명령은 다음과 같습니다.

```bash
npm run check
npm test
```

## 배포 방식

GitHub Pages가 `main` 브랜치의 저장소 루트(`/`)를 정적 사이트로 배포합니다. `index.html`, `style.css`, `script.js`가 상대 경로로 연결되어 있어 `/Visual-Fraction-Lab/` 하위 경로에서도 동작합니다.

## 주요 기능

- 분자/분모 슬라이더로 분수 A와 B 만들기
- 원형 모델과 막대 모델 전환
- 단위분수 모드
- 정답 확인과 시각 기반 피드백
- 랜덤 10문제 퀴즈
- 키보드와 보조기술을 고려한 답안 선택 UI
