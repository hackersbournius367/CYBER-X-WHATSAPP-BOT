const { cmd } = require('../command');
const { Configuration, OpenAIApi } = require('openai');
const { DBM } = require('postgres_dbm');

let autoReplyEnabled = false;

cmd({
    pattern: 'autoreply',
    alias: ['ar'],
    desc: 'Enable or disable auto-reply.',
    category: 'ai',
    use: '.autoreply on/off',
    filename: __filename
}, async (conn, m, { args }) => {
    if (args[0] === 'on') {
        autoReplyEnabled = true;
        m.reply('Auto-reply enabled.');
    } else if (args[0] === 'off') {
        autoReplyEnabled = false;
        m.reply('Auto-reply disabled.');
    } else {
        m.reply('Usage: .autoreply on/off');
    }
});

cmd({
    on: 'text',
    dontAddCommandList: true
}, async (conn, m, { body }) => {
    if (!autoReplyEnabled || m.isCmd) {
        return;
    }

    if (m.fromMe) {
        return;
    }

    try {
        const config = require('../config');
        const db_pool = new DBM({ db: config.DATABASE_URL });
        const openai_api_key = await db_pool.get('OPENAI_KEY');

        if (!openai_api_key) {
            return;
        }

        const configuration = new Configuration({ apiKey: openai_api_key });
        const openai = new OpenAIApi(configuration);

        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: body,
        });

        if (response.data.choices[0].text) {
            m.reply(response.data.choices[0].text);
        }
    } catch (e) {
        console.error('Error in auto-reply:', e);
    }
});