import Discord from 'discord.js'
import { Client } from 'discord.js'
import { config } from './config'
import { tweets, user } from './data'

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
// TODO: A, Bそれぞれに投票したユーザーをリストに入れる
const votedUserList: any[] = []
console.log(votedUserList)

client.on('message', async (msg) => {
  if (msg.content === '!a' && botState === 'QUESTIONING') {
    const embedA = new Discord.MessageEmbed()
      .setColor('#dd2e44')
      .setTitle(user.userName)
      .setURL(tweetTuple[0].url)
      .setImage(tweetTuple[0].image)
      .addFields(
        { name: 'Retweets', value: tweetTuple[0].retweets, inline: true },
        { name: 'Likes', value: tweetTuple[0].likes, inline: true }
      )
      .setTimestamp(new Date(`${tweetTuple[0].date} ${tweetTuple[0].time}`))
      .setFooter('Twitter', user.iconUrl)
      .setDescription(tweetTuple[0].url)
    const embedB = new Discord.MessageEmbed()
      .setColor('#3b88c3')
      .setTitle(user.userName)
      .setURL(tweetTuple[1].url)
      .setImage(tweetTuple[1].image)
      .addFields(
        { name: 'Retweets', value: tweetTuple[1].retweets, inline: true },
        { name: 'Likes', value: tweetTuple[1].likes, inline: true }
      )
      .setTimestamp(new Date(`${tweetTuple[1].date} ${tweetTuple[1].time}`))
      .setFooter('Twitter', user.iconUrl)
      .setDescription(tweetTuple[1].url)
    const answer = tweetTuple[0].likes > tweetTuple[1].likes ? '🅰️' : '🇧'
    msg.channel.send(embedA)
    msg.channel.send(embedB)
    msg.channel.send(`結果発表！\n正解は……${answer}でした！`)
    botState = 'NOT_QUESTION'
  }

  if (msg.content === '!q' && botState === 'NOT_QUESTION') {
    const buzzedTweet = tweetList
      .filter((v) => v.retweets >= 300 && v.retweets < 10000)
      .pop()
    if (!buzzedTweet) return
    tweetList.splice(
      tweetList.findIndex((v) => v.url === buzzedTweet.url),
      1
    )
    const nobuzzTweet = tweetList
      .filter(
        (v) =>
          v.likes <= buzzedTweet.likes / 2 &&
          v.retweets <= buzzedTweet.retweets / 2 &&
          v.retweets >= 50
      )
      .pop()
    if (!nobuzzTweet) return
    tweetList.splice(
      tweetList.findIndex((v) => v.url === nobuzzTweet.url),
      1
    )
    botState = 'QUESTIONING'
    tweetTuple = shuffleTuple([buzzedTweet, nobuzzTweet])
    const sentMessage = await msg.channel.send(
      `どっちがバズった？\n🅰️: ${tweetTuple[0].image}\n🇧: ${tweetTuple[1].image}\nバズった方のRT数: ${buzzedTweet.retweets}\nそうでない方のRT数: ${nobuzzTweet.retweets}`
    )
    await sentMessage.react('🅰️')
    await sentMessage.react('🇧')
  }
})

client.login(config.token)
