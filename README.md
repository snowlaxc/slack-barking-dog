# 🐶 퇴근 시간만 되면 짖는 개 (Slack Bot)

퇴근 시간이 되면 설정한 요일에 맞춰 "월월!!" 하고 짖어주는 슬랙 봇입니다.
**공휴일에는 짖지 않도록 설정**할 수도 있습니다! 🏖️

---

## 1. 슬랙 앱 설정 (필수)

봇을 실행하기 전에 Slack API 사이트에서 앱을 만들고 토큰을 발급받아야 합니다.

1. [Slack API Apps](https://api.slack.com/apps) 접속 후 **Create New App** 클릭 -> **From scratch** 선택.
2. 앱 이름(예: `Barking Dog`)과 워크스페이스 선택.
3. **Socket Mode** 메뉴 클릭:
   - **Enable Socket Mode**를 활성화(ON).
   - 토큰 이름 입력 후 생성. -> **`SLACK_APP_TOKEN`** (xapp-... 으로 시작) 복사해두기.
4. **OAuth & Permissions** 메뉴 클릭:
   - **Bot Token Scopes**에 다음 권한 추가:
     - `chat:write` (메시지 보내기)
     - `im:write` (DM 보내기)
     - `commands` (슬래시 커맨드 사용)
     - `im:history` (DM 메시지 읽기 - "설정" 텍스트 감지용)
   - **Install to Workspace** 클릭하여 앱 설치. -> **`SLACK_BOT_TOKEN`** (xoxb-... 으로 시작) 복사해두기.
5. **Basic Information** 메뉴 클릭:
   - **App Credentials** 섹션에서 **Signing Secret** -> **`SLACK_SIGNING_SECRET`** 복사해두기.
6. **Slash Commands** 메뉴 클릭:
   - **Create New Command** 클릭.
   - Command: `/bark-setup`
   - Short Description: 짖는 시간 설정하기
   - Save 클릭.
   - 다시 **Create New Command** 클릭.
   - Command: `/bark-stop`
   - Short Description: 알림 중지 및 데이터 삭제
   - Save 클릭.
7. **Event Subscriptions** 메뉴 클릭 (선택 사항):
   - **Enable Events** 활성화.
   - **Subscribe to bot events**에서 `message.im` 추가.
   - Save Changes 클릭.

---

## 2. 설치 및 설정

터미널에서 프로젝트 폴더(`slack-barking-dog`)로 이동한 후 진행해주세요.

### 1) 패키지 설치

```bash
npm install
```

### 2) 환경 변수 설정

`.env.example` 파일의 이름을 `.env`로 변경하고, 위에서 복사한 토큰들을 붙여넣으세요.

```bash
# .env 파일 내용 예시
SLACK_BOT_TOKEN=xoxb-1234...
SLACK_SIGNING_SECRET=abc1234...
SLACK_APP_TOKEN=xapp-1234...
PORT=3000
```

---

## 3. 실행 및 배포

이 봇은 **Socket Mode**를 사용하므로 외부로 포트를 열 필요가 없습니다. 인터넷이 되는 곳이라면 어디서든 실행 가능합니다.

### 1) 봇 실행 (기본)

```bash
npm run deploy
```

이제 봇이 백그라운드에서 실행됩니다! 터미널을 꺼도 봇은 계속 작동합니다.

### 2) 관리 명령어

- **상태 및 로그 확인**: `npm run logs`
- **봇 끄기**: `npm run stop`
- **봇 재시작**: `npm run restart`

### 3) 서버 재부팅 시 자동 실행 설정 (선택 사항)

컴퓨터가 꺼졌다가 켜져도 봇이 자동으로 실행되게 하려면 다음 순서를 **한 번만** 따라하세요.

1. 시작 프로그램 등록 명령어 생성:
   ```bash
   npm run startup
   ```
2. 위 명령어를 입력하면 터미널에 **"sudo env PATH=..."** 로 시작하는 긴 명령어가 나옵니다. 그 줄을 그대로 복사해서 터미널에 붙여넣고 엔터를 치세요. 권한 오류가 뜰 경우 아래 명령어를 실행해주세요.
   ```bash
   chmod +x node_modules/pm2/bin/pm2
   ```
3. 현재 실행 중인 봇 저장:
   ```bash
   npm run save
   ```

---

## 4. 사용 방법

슬랙에서 봇이 있는 채널이나 DM으로 이동하세요.

### 알림 설정하기

1. **설정하기**:
   - 채팅창에 `/bark-setup` 입력 후 엔터.
   - 또는 봇에게 DM으로 "설정"이라고 메시지 전송.
2. **모달창 입력**:
   - **알림 시간**: 퇴근 시간을 선택하세요 (예: 18:00).
   - **반복 요일**: 짖기를 원하는 요일을 체크하세요.
   - **공휴일 설정**: **"공휴일에는 짖지 않기"**를 체크하면 빨간 날에는 조용히 있습니다. 🤫
3. **완료**:
   - 설정이 저장되면 봇이 확인 메시지를 보냅니다.
   - 이제 설정된 시간에 맞춰 봇이 짖어줍니다! 🐶

### 알림 중지하기

1. **중지하기**:
   - 채팅창에 `/bark-stop` 입력 후 엔터.
2. **확인 모달**:
   - 삭제되는 내용을 확인하고 "중지하기" 버튼 클릭.
   - ⚠️ **주의**: 이 작업은 취소할 수 없습니다.
3. **완료**:
   - 모든 설정과 봇이 보낸 메시지가 삭제됩니다.
   - 더 이상 알림을 받지 않습니다.
