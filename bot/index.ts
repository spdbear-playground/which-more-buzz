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

const userStatsMap: Map<
  string,
  { answers: number; corrects: number }
> = new Map()
console.log(userStatsMap)

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
type Vote = {
  url: string
  index: number
  user: string
}
const voteList: Vote[] = []

client.on('messageReactionAdd', (reaction, user) => {
  const index =
    reaction.emoji.name === '🅰️'
      ? 0
      : reaction.emoji.name === '🇧'
      ? 1
      : undefined
  if (index === undefined) return
  const reactUser = user.username
  if (reactUser === 'which-more-buzz' || reactUser === null) return
  const vote = { url: tweetTuple[index].url, user: reactUser, index }
  voteList.push(vote)
})

client.on('messageReactionRemove', (reaction, user) => {
  const index =
    reaction.emoji.name === '🅰️'
      ? 0
      : reaction.emoji.name === '🇧'
      ? 1
      : undefined
  if (index === undefined) return
  const reactUser = user.username
  if (reactUser === 'which-more-buzz' || reactUser === null) return
  const deleteIndex = voteList.findIndex(
    (v) => v.user === reactUser && v.url === tweetTuple[index].url
  )
  voteList.splice(deleteIndex, 1)
})

client.on('message', async (msg) => {
  if (msg.content === '!l') {
    const userStatsList = Array.from(userStatsMap.entries()).map(
      (v) => `${v[0]}, ${v[1].answers} / ${v[1].corrects}`
    )
    msg.channel.send(userStatsList.join('\n'))

  }
  if (msg.content === '!a' && botState === 'QUESTIONING') {
    const voteAUsers = voteList
      .filter((v) => v.url === tweetTuple[0].url)
      .map((v) => v.user)
      .join(',')
    const voteBUsers = voteList
      .filter((v) => v.url === tweetTuple[1].url)
      .map((v) => v.user)
      .join(',')
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
      .setDescription(`選んだ人: ${voteAUsers}`)
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
      .setDescription(`選んだ人: ${voteBUsers}`)
    const answer = tweetTuple[0].likes > tweetTuple[1].likes ? '🅰️' : '🇧'
    msg.channel.send(embedA)
    msg.channel.send(embedB)
    msg.channel.send(`結果発表！\nバズった方は……${answer}でした！`)
    if (answer === '🅰️') {
      const correctUserList = voteList.filter((v) => v.index === 0)
      const wrongUserList = voteList.filter((v) => v.index === 1)
      correctUserList.forEach((v) => {
        const rate = userStatsMap.get(v.user) || undefined
        if (rate === undefined) {
          userStatsMap.set(v.user, { answers: 1, corrects: 1 })
        } else {
          userStatsMap.set(v.user, {
            answers: rate.answers + 1,
            corrects: rate.corrects + 1,
          })
        }
      })
      wrongUserList.forEach((v) => {
        const rate = userStatsMap.get(v.user) || undefined
        if (rate === undefined) {
          userStatsMap.set(v.user, { answers: 0, corrects: 1 })
        } else {
          userStatsMap.set(v.user, {
            answers: rate.answers,
            corrects: rate.corrects + 1,
          })
        }
      })
    } else if (answer === '🇧') {
      const correctUserList = voteList.filter((v) => v.index === 1)
      const wrongUserList = voteList.filter((v) => v.index === 0)
      correctUserList.forEach((v) => {
        const rate = userStatsMap.get(v.user) || undefined
        if (rate === undefined) {
          userStatsMap.set(v.user, { answers: 1, corrects: 1 })
        } else {
          userStatsMap.set(v.user, {
            answers: rate.answers + 1,
            corrects: rate.corrects + 1,
          })
        }
      })
      wrongUserList.forEach((v) => {
        const rate = userStatsMap.get(v.user) || undefined
        if (rate === undefined) {
          userStatsMap.set(v.user, { answers: 0, corrects: 1 })
        } else {
          userStatsMap.set(v.user, {
            answers: rate.answers,
            corrects: rate.corrects + 1,
          })
        }
      })
    }
    botState = 'NOT_QUESTION'
    voteList.splice(0)
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
