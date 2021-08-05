import express from 'express';
import { Telegraf } from 'telegraf';
import { nanoid } from 'nanoid';
import redis from 'redis';

if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('Please add a bot token');
if (!process.env.DATABASE_URL) throw new Error('Please add a database url');
if (!process.env.PUBLIC_URL) throw new Error('Please add a public url');

const db = redis.createClient(process.env.DATABASE_URL);
db.on('connect', function () {
	console.log('Connection to DB successful! 🗄');
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.start((ctx) => ctx.reply('Welcome to Purple Link! Just send me a link and I will short it for you.'));
bot.help((ctx) => ctx.reply('Just send me a valid link and I will short it for you.'));
bot.on('text', (ctx) => {
	if (ctx.message.entities && ctx.message.entities[0].type === 'url') {
		const shortUrl = {
			id: nanoid(6),
			url: ctx.message.text,
		};

		db.set(shortUrl.id, shortUrl.url);

		ctx.reply(`Okay ✅ Your short link is ${process.env.PUBLIC_URL}/${shortUrl.id}`);
	} else {
		ctx.reply("Sorry 😬 I can't handle something else then urls.");
	}
});
bot.launch();

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use(express.static('public'));

app.get('*', async (req, res) => {
	const id = req.url.replace('/', '');

	db.get(id, (err, data) => {
		if (err) {
			res.json({ error: err });
			return;
		}
		if (data) {
			res.redirect(data);
			return;
		}
		res.redirect('/404.html');
	});
});

app.listen(port, () => {
	console.log(`Purple Link is running! 🔗`);
});
