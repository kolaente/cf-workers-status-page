import config from '../../config.yaml'
import {useEffect, useState} from 'react'

const getOperationalLabel = operational => {
  return operational
    ? config.settings.monitorLabelOperational
    : config.settings.monitorLabelNotOperational
}

export async function getMonitors() {
  return await getKVWithMetadata('monitors_data', "json")
}

export async function setKV(key, value, metadata, expirationTtl) {
  return KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}

export async function getKVWithMetadata(key, type = 'text') {
  return KV_STATUS_PAGE.getWithMetadata(key, type)
}

export async function notifySlack(monitor, operational) {
  const payload = {
    attachments: [
      {
        color: operational ? '#36a64f' : '#f2c744',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Monitor *${monitor.name}* changed status to *${getOperationalLabel(operational)}*`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${
                  operational ? ':white_check_mark:' : ':x:'
                } \`${monitor.method ? monitor.method : "GET"} ${monitor.url}\` - :eyes: <${
                  config.settings.url
                }|Status Page>`,
              },
            ],
          },
        ],
      },
    ],
  }
  return fetch(SECRET_SLACK_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function notifyTelegram(monitor, operational) {
  const text = `${operational ? '✅' : '❌'}
  \`${monitor.method ? monitor.method : "GET"} ${monitor.url}\` - 👀 <${config.settings.url}|Status Page>
  Monitor *${monitor.name}* changed status to *${getOperationalLabel(operational)}*`

  const payload = new FormData()
  payload.append('chat_id', SECRET_TELEGRAM_CHAT_ID)
  payload.append('parse_mode', 'MarkdownV2')
  payload.append('text', text)

  const telegramUrl = `https://api.telegram.org/bot${SECRET_TELEGRAM_API_TOKEN}/sendMessage`
  return fetch(telegramUrl, {
    body: payload,
    method: 'POST',
  })
}

export function useKeyPress(targetKey) {
  const [keyPressed, setKeyPressed] = useState(false)

  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [])

  return keyPressed
}
