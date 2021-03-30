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
  if (msg.content === '!ans' && botState === 'QUESTIONING') {
    const embedA = new Discord.MessageEmbed()
      .setColor('#dd2e44')
      .setTitle('🅰️')
      .setURL(tweetTuple[0].url)
      .setImage(tweetTuple[0].image)
      .addFields(
        { name: 'Likes', value: tweetTuple[0].likes, inline: true },
        { name: 'Retweets', value: tweetTuple[0].retweets, inline: true }
      )
      .setTimestamp(new Date(`${tweetTuple[0].date} ${tweetTuple[0].time}`))
      .setFooter(
        'Twitter',
        'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
      )
      .setDescription(tweetTuple[0].url)
    const embedB = new Discord.MessageEmbed()
      .setColor('#3b88c3')
      .setTitle('🇧')
      .setURL(tweetTuple[1].url)
      .setImage(tweetTuple[1].image)
      .addFields(
        { name: 'Likes', value: tweetTuple[1].likes, inline: true },
        { name: 'Retweets', value: tweetTuple[1].retweets, inline: true }
      )
      .setTimestamp(new Date(`${tweetTuple[1].date} ${tweetTuple[1].time}`))
      .setFooter(+
        'Twitter',
        'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
      )
      .setDescription(tweetTuple[1].url)
    const answer = tweetTuple[0].likes > tweetTuple[1].likes ? '🅰️' : '🇧'
    console.log(tweetTuple[0].likes, tweetTuple[1].likes, answer)
    msg.channel.send(embedA)
    msg.channel.send(embedB)
    msg.channel.send(`結果発表！\n正解は……${answer}でした！`)
    botState = 'NOT_QUESTION'
  }

  if (msg.content === '!quiz' && botState === 'NOT_QUESTION') {
    const buzzedTweet = tweetList.filter((v) => v.retweets >= 500).pop()
    if (!buzzedTweet) return
    const nobuzzTweet = tweetList
      .filter(
        (v) =>
          v.likes <= buzzedTweet.likes / 2 &&
          v.retweets <= buzzedTweet.retweets / 2 &&
          v.retweets >= 50
      )
      .pop()
    if (!nobuzzTweet) return
    botState = 'QUESTIONING'
    tweetTuple = shuffleTuple([buzzedTweet, nobuzzTweet])
    const sentMessage = await msg.channel.send(
      `どっちがバズった？ ${buzzedTweet.url.replace(/status\/.+/g, '')}\n🅰️ ${
        tweetTuple[0].image
      }\n🇧 ${tweetTuple[1].image}`
    )
    await sentMessage.react('🅰️')
    await sentMessage.react('🇧')
  }
  if (msg.content === '!answer' && botState === 'QUESTIONING') {
    msg.channel.send(`結果発表！\n${tweetTuple[0].url}\n${tweetTuple[1].url}`)
    botState = 'NOT_QUESTION'
  }
})

client.login(config.token)
