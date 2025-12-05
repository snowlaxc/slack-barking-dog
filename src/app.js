const { App } = require('@slack/bolt');
require('dotenv').config();
const { setUserConfig, deleteUserConfig } = require('./store');
const { initScheduler, scheduleJobForUser, cancelJobForUser } = require('./scheduler');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Day mapping
const DAYS_OPTIONS = [
  { text: { type: 'plain_text', text: '월요일' }, value: '1' },
  { text: { type: 'plain_text', text: '화요일' }, value: '2' },
  { text: { type: 'plain_text', text: '수요일' }, value: '3' },
  { text: { type: 'plain_text', text: '목요일' }, value: '4' },
  { text: { type: 'plain_text', text: '금요일' }, value: '5' },
  { text: { type: 'plain_text', text: '토요일' }, value: '6' },
  { text: { type: 'plain_text', text: '일요일' }, value: '0' }
];

// Open Modal Function
async function openSetupModal(client, triggerId) {
  try {
    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'setup_bark_modal',
        title: {
          type: 'plain_text',
          text: '퇴근 짖는 개 설정'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '언제 짖어드릴까요? 퇴근 시간을 알려주세요! 🐶'
            }
          },
          {
            type: 'input',
            block_id: 'time_block',
            element: {
              type: 'timepicker',
              action_id: 'time_select',
              placeholder: {
                type: 'plain_text',
                text: '시간 선택'
              },
              initial_time: '18:00'
            },
            label: {
              type: 'plain_text',
              text: '알림 시간'
            }
          },
          {
            type: 'input',
            block_id: 'days_block',
            element: {
              type: 'checkboxes',
              action_id: 'days_select',
              options: DAYS_OPTIONS,
            },
            label: {
              type: 'plain_text',
              text: '반복 요일'
            }
          },
          {
            type: 'section',
            block_id: 'holiday_block',
            text: {
              type: 'mrkdwn',
              text: '공휴일 설정'
            },
            accessory: {
              type: 'checkboxes',
              action_id: 'holiday_check',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: '공휴일에는 짖지 않기 쉴게요! 🏖️'
                  },
                  value: 'skip_holidays'
                }
              ]
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: '저장'
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
}

// Listen for slash command
app.command('/bark-setup', async ({ ack, body, client }) => {
  await ack();
  await openSetupModal(client, body.trigger_id);
});

// Listen for /bark-stop command
app.command('/bark-stop', async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'confirm_stop_modal',
        title: {
          type: 'plain_text',
          text: '알림 중지'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '정말로 모든 알림을 중지하고 데이터를 삭제하시겠습니까?\n\n⚠️ *이 작업은 취소할 수 없습니다.*\n\n삭제되는 내용:\n• 설정한 알림 시간 및 요일\n• 봇이 보낸 모든 메시지\n• 스케줄된 알림'
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: '중지하기'
        },
        close: {
          type: 'plain_text',
          text: '취소'
        }
      }
    });
  } catch (error) {
    console.error('Error opening stop confirmation modal:', error);
  }
});

// Listen for message "설정"
app.message('설정', async ({ message, say, client }) => {
  // Only respond to users, not bots
  if (message.subtype === 'bot_message') return;

  // We need a trigger_id to open a modal. 
  // However, app.message doesn't provide a trigger_id directly in the argument destructuring easily for button clicks, 
  // but for opening a modal from a message, we usually use a button or shortcut.
  // Since we can't easily get a trigger_id from a plain message event to open a modal immediately (it requires interactivity),
  // we will send a button that the user can click to open the modal.

  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "설정을 시작하려면 아래 버튼을 눌러주세요!"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "설정하기"
            },
            action_id: "open_setup_modal_button"
          }
        ]
      }
    ],
    text: "설정 버튼을 눌러주세요."
  });
});

// Handle button click
app.action('open_setup_modal_button', async ({ ack, body, client }) => {
  await ack();
  await openSetupModal(client, body.trigger_id);
});

// Handle Modal Submission
app.view('setup_bark_modal', async ({ ack, body, view, client }) => {
  await ack();

  const userId = body.user.id;
  const time = view.state.values.time_block.time_select.selected_time;
  const selectedDays = view.state.values.days_block.days_select.selected_options;

  // Check holiday option
  const holidayOptions = view.state.values.holiday_block.holiday_check.selected_options;
  const skipHolidays = holidayOptions && holidayOptions.length > 0;

  if (!selectedDays || selectedDays.length === 0) {
    // Ideally we should show an error in the modal, but for simplicity we'll just DM the user
    await client.chat.postMessage({
      channel: userId,
      text: "요일을 선택하지 않으셔서 설정이 저장되지 않았습니다. 다시 시도해주세요."
    });
    return;
  }

  const days = selectedDays.map(option => parseInt(option.value));

  // Save to store
  setUserConfig(userId, time, days, skipHolidays);

  // Reschedule
  scheduleJobForUser(app, userId, { time, days, skipHolidays });

  const holidayMsg = skipHolidays ? "\n(공휴일에는 쉽니다)" : "";

  await client.chat.postMessage({
    channel: userId,
    text: `설정이 완료되었습니다! 🐶\n매주 ${selectedDays.map(d => d.text.text).join(', ')} ${time}에 짖어드리겠습니다!${holidayMsg}`
  });
});

// Handle stop confirmation modal submission
app.view('confirm_stop_modal', async ({ ack, body, client }) => {
  await ack();

  const userId = body.user.id;

  try {
    // 1. Open DM channel with user
    const dmChannel = await client.conversations.open({
      users: userId
    });
    const channelId = dmChannel.channel.id;

    // 2. Fetch and delete all bot messages in the conversation
    let hasMore = true;
    let cursor = undefined;
    const messagesToDelete = [];

    // Fetch conversation history with pagination
    while (hasMore) {
      const result = await client.conversations.history({
        channel: channelId,
        cursor: cursor,
        limit: 200
      });

      if (result.messages) {
        // Filter bot messages
        const botMessages = result.messages.filter(msg => msg.bot_id);
        messagesToDelete.push(...botMessages.map(msg => msg.ts));
      }

      hasMore = result.has_more;
      cursor = result.response_metadata?.next_cursor;
    }

    // Delete messages with rate limiting (100ms between requests)
    for (const ts of messagesToDelete) {
      try {
        await client.chat.delete({
          channel: channelId,
          ts: ts
        });
        // Wait 100ms to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to delete message ${ts}:`, error);
        // Continue deleting other messages even if one fails
      }
    }

    // 3. Cancel scheduled job
    cancelJobForUser(userId);

    // 4. Delete user config from database
    deleteUserConfig(userId);

    // 5. Send confirmation message
    await client.chat.postMessage({
      channel: channelId,
      text: '모든 알림이 중지되었고 데이터가 삭제되었습니다. 다시 설정하려면 `/bark-setup` 명령어를 사용하세요.'
    });

    console.log(`Successfully stopped bark service for user ${userId}, deleted ${messagesToDelete.length} messages`);
  } catch (error) {
    console.error('Error during stop process:', error);
    await client.chat.postMessage({
      channel: userId,
      text: '중지 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
    });
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');

  // Initialize scheduler
  initScheduler(app);
})();
