import { Client } from 'discord.js'
import { config } from './config'
import { tweets } from './data';

const client = new Client()

client.on('ready', () => {
  console.log(`Logged in as ${client.user}!`)
})

type State = 'NOT_QUESTION' | 'QUESTIONING'
let botState: State = 'NOT_QUESTION'
type Tweet = {
    account: string;
    type: string;
    answer: string;
    image: string;
}

let tweetTuple: [Tweet, Tweet]
const buzzedList = tweets.filter((v) => v.type === 'buzz')
const nobuzzList = tweets.filter((v) => v.type === 'nobuzz')
const usedIndexList: [Tweet, Tweet][] = []

console.log(buzzedList,nobuzzList)

client.on('message', async (msg) => {
  if (msg.content === '!quiz' && botState === 'NOT_QUESTION') {
    const buzzedTweet = buzzedList[Math.floor(buzzedList.length * Math.random())]
    const nobuzzTweet = nobuzzList[Math.floor(nobuzzList.length * Math.random())]
    const seed = Math.floor((Math.random() * 100)) % 2
    tweetTuple = seed < 1 ? [buzzedTweet, nobuzzTweet] : [nobuzzTweet, buzzedTweet]
    // console.log(seed)
    usedIndexList.push([buzzedTweet, nobuzzTweet])
    
    const sentMessage = await msg.channel.send(
      `どっちがバズった？\n${tweetTuple[0].image}\n${tweetTuple[1].image}`
    )
    await sentMessage.react('👆')
    await sentMessage.react('👇')
    botState = 'QUESTIONING'
  }
  if (msg.content === '!answer' && botState === 'QUESTIONING') {
    msg.channel.send(
      `結果発表！\n${tweetTuple[0].answer}\n${tweetTuple[1].answer}`
    )
    botState = 'NOT_QUESTION'
  }
})

client.login(config.token)
