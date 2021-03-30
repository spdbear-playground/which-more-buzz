import Discord from 'discord.js'
import { Client } from 'discord.js'
import { config } from './config'
import { tweets } from './data'

const client = new Client()

client.on('ready', () => {
  console.log(`Logged in as ${client.user}!`)
})

type State = 'NOT_QUESTION' | 'QUESTIONING'
let botState: State = 'NOT_QUESTION'
type Tweet = {
  date: string
  time: string
  likes: number
  retweets: number
  url: string
  image: string
}

let tweetTuple: [Tweet, Tweet]

const shuffleTuple = <T>(inputTuple: [T, T]): [T, T] => {
  const seed = Math.floor(Math.random() * 100) % 2
  return seed < 1 ? inputTuple : [inputTuple[1], inputTuple[0]]
}

const shuffle = ([...array]) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const tweetList: Tweet[] = shuffle(tweets)

client.on('message', async (msg) => {
  if (msg.content === '!t') {
    const embed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Some title')
      .setURL('https://discord.js.org/')
      .setAuthor(
        'Some name',
        'https://i.imgur.com/wSTFkRM.png',
        'https://discord.js.org'
      )
      .setDescription('Some description here')
      .setThumbnail('https://i.imgur.com/wSTFkRM.png')
      .addFields(
        { name: 'Regular field title', value: 'Some value here' },
        { name: '\u200B', value: '\u200B' },
        { name: 'Inline field title', value: 'Some value here', inline: true },
        { name: 'Inline field title', value: 'Some value here', inline: true }
      )
      .addField('Inline field title', 'Some value here', true)
      .setImage('https://i.imgur.com/wSTFkRM.png')
      .setTimestamp()
      .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png')
    msg.channel.send(embed)
  }

  if (msg.content === '!quiz' && botState === 'NOT_QUESTION') {
    const buzzedTweet = tweetList.filter((v) => v.retweets >= 500).pop()
    if (!buzzedTweet) return
    const nobuzzTweet = tweetList
      .filter(
        (v) =>
          v.likes <= buzzedTweet.likes / 2 &&
          v.retweets <= buzzedTweet.retweets / 2
      )
      .pop()
    if (!nobuzzTweet) return
    tweetTuple = shuffleTuple([buzzedTweet, nobuzzTweet])

    const sentMessage = await msg.channel.send(
      `どっちがバズった？\n:a: ${tweetTuple[0].image}\n:regional_indicator_b: ${tweetTuple[1].image}`
    )
    await sentMessage.react('🅰️')
    await sentMessage.react('🇧')
    botState = 'QUESTIONING'
  }
  if (msg.content === '!answer' && botState === 'QUESTIONING') {
    msg.channel.send(`結果発表！\n${tweetTuple[0].url}\n${tweetTuple[1].url}`)
    botState = 'NOT_QUESTION'
  }
})

client.login(config.token)
