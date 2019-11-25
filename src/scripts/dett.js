import {awaitTx, parseText} from './utils'

let loomProvider = null
let loomWeb3 = null

const ABIBBS = [{"constant":false,"inputs":[{"name":"origin","type":"bytes32"},{"name":"content","type":"string"}],"name":"edit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"origin","type":"bytes32"},{"name":"vote","type":"uint256"},{"name":"content","type":"string"}],"name":"Reply","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"voted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"downvotes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"upvotes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"content","type":"string"}],"name":"Post","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"content","type":"string"}],"name":"Posted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"origin","type":"bytes32"},{"indexed":false,"name":"content","type":"string"}],"name":"Edited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"origin","type":"bytes32"},{"indexed":false,"name":"vote","type":"uint256"},{"indexed":false,"name":"content","type":"string"}],"name":"Replied","type":"event"}]
const ABIBBSAdmin = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"who","type":"address"},{"name":"_isAdmin","type":"bool"}],"name":"setAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"origin","type":"bytes32"},{"name":"_banned","type":"bool"}],"name":"ban","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"banned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"category","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_category","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"origin","type":"bytes32"},{"indexed":false,"name":"banned","type":"bool"},{"indexed":false,"name":"admin","type":"address"}],"name":"Ban","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
const ABIBBSPB = [{"constant":!0,"inputs":[{"name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"_lobby","type":"address"},{"name":"_isLobby","type":"bool"}],"name":"setLobby","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"}],"name":"migrated","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"meta","type":"string"}],"name":"setMeta","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"who","type":"address"},{"name":"ref","type":"address"}],"name":"setReferrerByAddress","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[],"name":"wallet","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"who","type":"address"}],"name":"getPlayer","outputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"address"},{"name":"","type":"address"},{"name":"","type":"string"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"who","type":"address"},{"name":"amount","type":"uint256"}],"name":"addExp","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"who","type":"address"}],"name":"getLV","outputs":[{"name":"","type":"uint256"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"_tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"_fee","type":"uint256"}],"name":"setFee","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"name","type":"string"}],"name":"checkIfNameValid","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"name","type":"string"}],"name":"useAnotherName","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"bytes32"}],"name":"name2addr","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"link","type":"address"}],"name":"setLink","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"to","type":"address"},{"name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"newPlayerBook","type":"address"}],"name":"migrate","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"who","type":"address"},{"name":"ref","type":"bytes32"}],"name":"setReferrerByName","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"isMyName","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[],"name":"fee","outputs":[{"name":"","type":"uint256"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"_wallet","type":"address"}],"name":"setWallet","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"}],"name":"players","outputs":[{"name":"name","type":"bytes32"},{"name":"names","type":"uint256"},{"name":"exp","type":"uint256"},{"name":"referrer","type":"address"},{"name":"link","type":"address"},{"name":"meta","type":"string"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"owner","type":"address"},{"name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"}],"name":"isLobby","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"name","type":"string"}],"name":"register","outputs":[],"payable":!0,"stateMutability":"payable","type":"function"},{"constant":!1,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"playerAddress","type":"address"},{"indexed":!0,"name":"playerName","type":"bytes32"}],"name":"SetNewName","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"_from","type":"address"},{"indexed":!0,"name":"_to","type":"address"},{"indexed":!0,"name":"_tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"_owner","type":"address"},{"indexed":!0,"name":"_approved","type":"address"},{"indexed":!0,"name":"_tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"_owner","type":"address"},{"indexed":!0,"name":"_operator","type":"address"},{"indexed":!1,"name":"_approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"previousOwner","type":"address"},{"indexed":!0,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
const ABICache = [{"constant":false,"inputs":[{"name":"milestone","type":"bytes32"}],"name":"addMilestone","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"clearMilestone","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"long","type":"bytes32"},{"name":"short","type":"bytes32"}],"name":"link","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"long","type":"bytes32"},{"indexed":false,"name":"short","type":"bytes32"}],"name":"Link","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"constant":true,"inputs":[],"name":"getMilestones","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"links","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]

const BBSContract = '0x8eea1c595d3ffafd880de77a2a5680664dbed6d0' // merged
const BBSAdminContract = '0x5b6cff89475adce297aacfa274de47e06c146f92'
const BBSPBContract = '0x3b6e9f0dfe5299b2a5be272b06e0d41229a34a73'
const BBSCacheContract = '0x7145b3b051dcc069134d4a379935eae058bcffb7'

const defaultCaller = '0x7c9CB363cf3202fC3BC8CDC08daAfC8f54DD12E1'
const fromBlock = '14440294'
let currentHeight = null
const titleLength = 40
const commentLength = 56
const perPageLength = 20

class EventEmitter{
  constructor(){
    this._events={}
  }
  on(event,callback){
    let callbacks = this._events[event] || []
    callbacks.push(callback)
    this._events[event] = callbacks
    return this
  }
  off(event,callback){
    let callbacks = this._events[event]
    this._events[event] = callbacks && callbacks.filter(fn => fn !== callback)
    return this
  }
  emit(...args){
    const event = args[0]
    const params = [].slice.call(args,1)
    const callbacks = this._events[event]
    if (callbacks) {
      callbacks.forEach(fn => fn.apply(this, params))
    }
    return this
  }
  once(event,callback){
    let wrapFunc = (...args) => {
      callback.apply(this,args)
      this.off(event,wrapFunc)
    }
    this.on(event,wrapFunc)
    return this
  }
}

class PostBase {
  static getAuthorMeta(address) {
    const addr = address.toLowerCase()
    const cache = PostBase._metaCache
    if (cache.has(addr)) {
      return cache.get(addr)
    }

    const BBSPB = new loomWeb3.eth.Contract(ABIBBSPB, BBSPBContract)
    const promise = BBSPB.methods.getPlayer(address).call({ from: defaultCaller })
    .then(data => ({
      name: loomWeb3.utils.hexToUtf8(data[0]),
      names: +data[1],
      exp: +data[2],
      referrer: data[3],
      link: data[4],
      meta: data[5],
    }))
    cache.set(addr, promise)
    return promise
  }
}
// static property that is shared between articles/comments
PostBase._metaCache = new Map()

class Article extends PostBase {
  constructor(_transaction, _rawContent) {
    super()
    this.transaction = _transaction
    this.rawContent = _rawContent
    this.titleMatch = false
    this.title = this.getTitle()
    this.content = this.getContent()
    this.author = this.transaction.from
    this.origAuthor = null
    this.editTimestamps = []
  }

  async init() {
    this.block = await loomWeb3.eth.getBlock(this.transaction.blockNumber)
    this.authorMeta = await Article.getAuthorMeta(this.transaction.from)
    this.origAuthor = await loomProvider.getMappingAddress(this.author)
    this.timestamp = this.block.timestamp * 1e3
  }

  async initEdits(edits) {
    for ( let edit of edits ){
      const _transaction = await loomWeb3.eth.getTransaction(edit.transactionHash)
      if (_transaction.from === this.author) {
        this.rawContent = edit.returnValues.content
        this.title = this.getTitle()
        this.content = this.getContent()
        let block = await loomWeb3.eth.getBlock(edit.blockNumber)
        this.editTimestamps.push(block.timestamp * 1e3)
      }
    }
  }

  getTitle(){
    // title format : [$title]
    let content = this.rawContent
    content = parseText(content, this.titleLength+'[]'.length)
    const match = content.match(/^\[(.*)\]/)
    this.titleMatch = !!match
    return match ? match[1] : content
  }

  getContent(){
    return this.titleMatch ? this.rawContent.slice(this.title.length+'[]'.length) : this.rawContent
  }
}

class Comment extends PostBase {
  constructor(event) {
    super()
    this.tx = event.transactionHash
    this.rawContent = event.returnValues.content
    this.content = this.getContent()
    this.vote = +event.returnValues.vote
  }

  async init() {
    this.transaction = await loomWeb3.eth.getTransaction(this.tx)
    this.author = this.transaction.from
    this.origAuthor = await loomProvider.getMappingAddress(this.author)

    const [block, authorMeta] = await Promise.all([
      loomWeb3.eth.getBlock(this.transaction.blockNumber),
      Comment.getAuthorMeta(this.transaction.from),
    ])

    this.block = block
    this.timestamp = this.block.timestamp * 1e3
    this.authorMeta = authorMeta
  }

  getContent() {
    return parseText(this.rawContent, this.commentLength)
  }
}

class Dett extends EventEmitter {
  constructor() {
    super()
    this._account = ''

    // constant
    this.fromBlock = fromBlock
    this.currentHeight = null
    this.step = 20
    this.commentLength = commentLength
    this.titleLength = titleLength
    this.perPageLength = perPageLength
    this.loomAddr = null
    this.defaultCaller = defaultCaller
    this.isHdWallet = false
  }

  get account() {
    return this._account
  }

  set account(_account) {
    this._account = _account
    this.emit('account', _account)
  }

  async init(_loomProvider) {
    this.loomProvider = _loomProvider
    loomProvider = _loomProvider
    loomWeb3 = loomProvider.library

    if (loomWeb3) {
      this.initR(loomWeb3)
      this.initW(loomWeb3)
      this.initC(loomWeb3)
      currentHeight = await loomWeb3.eth.getBlockNumber()
      this.currentHeight = currentHeight
    }
  }

  async initR(web3) {
    this.BBS = new web3.eth.Contract(ABIBBS, BBSContract) // merged
    this.BBSAdmin = new web3.eth.Contract(ABIBBSAdmin, BBSAdminContract)
    this.BBSPB = new web3.eth.Contract(ABIBBSPB, BBSPBContract)
  }

  async initW(web3) {
    this.dettBBS = new web3.eth.Contract(ABIBBS, BBSContract)
    this.dettBBSPB = new web3.eth.Contract(ABIBBSPB, BBSPBContract)
  }

  initC(web3) {
    // Todo : Should be env
    this.cacheweb3 = web3
    this.BBSCache = new this.cacheweb3.eth.Contract(ABICache, BBSCacheContract)
  }

  loadPageCache(_page) {
    const url = window.location.origin
    return fetch(`${url}/p/${_page}.json`, { method: 'get' }).then(res => {
      return res.json()
    }).then((jsonData) => {
      return jsonData
    }).catch((error) => {
      return false
    })
  }

  async getCachedArticles({fromBlock = null, toBlock = null, _page = 1} = {}){
    let cacheData = await this.loadPageCache(_page)
    if (!cacheData) return [await this.getArticles({fromBlock, toBlock}),[],[]]
    let newArticles = null
    if (_page == 1) {
      newArticles = await this.getArticles({fromBlock: currentHeight*1-this.step+''})
    }

    const articles = await cacheData.map(async (transactionHash) => {
      const [article, votes, banned] = await Promise.all([
        this.getArticle(transactionHash, null, false),
        this.getVotes(transactionHash),
        this.getBanned(transactionHash),
      ])

      return [article, votes, banned]
    })

    return [articles, newArticles, cacheData]
  }

  async mergedEvents(eventName, events = [], fromBlock = '14440294', toBlock = 'latest') {
    const temp = await this.BBS.getPastEvents(eventName, {fromBlock : fromBlock, toBlock: toBlock})
    events = events.concat(temp)
    console.log(`from ${fromBlock} to ${toBlock}, size: ${events.length}`)
    return events
  }

  async getArticles({fromBlock = null, toBlock = null} = {}){
    const _fromBlock = fromBlock ? fromBlock.split('-')[0] : this.fromBlock
    const _toBlock = toBlock ? toBlock.split('-')[0] : 'latest'

    this.BBSEvents = []
    for (let start = fromBlock*1 ; start < currentHeight ; start+=(this.step+1)) {
      this.BBSEvents = await this.mergedEvents('Posted', this.BBSEvents, start, start+this.step)
    }
    // this.BBSEvents = await this.BBS.getPastEvents('Posted', {fromBlock : _fromBlock, toBlock: _toBlock})
    // console.log(this.BBSEvents)

    if (fromBlock)
      this.BBSEvents.splice(0, (+fromBlock.split('-')[1]) + 1)

    if (toBlock)
      this.BBSEvents.splice(perPageLength, this.BBSEvents.length-perPageLength)

    return this.BBSEvents.map(async (event) => {
      const [article, votes, banned] = await Promise.all([
        this.getArticle(event.transactionHash, event.returnValues, false),
        this.getVotes(event.transactionHash),
        this.getBanned(event.transactionHash),
      ])

      return [article, votes, banned]
    })
  }

  async getArticle(tx, returnValues, checkEdited){
    const transaction = await loomWeb3.eth.getTransaction(tx)
    // console.log(transaction)
    let rawContent = null

    if (returnValues) {
      rawContent = returnValues[0]
    }
    else {
      const transactionReceipt = await loomWeb3.eth.getTransactionReceipt(tx)
      rawContent = loomWeb3.utils.hexToUtf8('0x' + transactionReceipt.logs[0].data.slice(130))
    }

    const article = new Article(transaction, rawContent)
    await article.init()

    /*
    if (checkEdited) {
      let events = []
      for (let start = fromBlock*1 ; start < currentHeight ; start+=(this.step+1)) {
        this.BBSEditEvents = await this.mergedEvents('Edited', events, start, start+this.step)
      }

      const edits = this.BBSEditEvents.filter(event => event.returnValues.origin === tx )
      if (edits.length >0) await article.initEdits(edits)
    }
  `*/

    return article
  }

  async getVotes(tx){
    const [upvotes, downvotes] = await Promise.all([
      this.BBS.methods.upvotes(tx).call({ from: defaultCaller }),
      this.BBS.methods.downvotes(tx).call({ from: defaultCaller }),
    ])

    return upvotes - downvotes
  }

  async getVoted(tx){
    return await this.BBS.methods.voted(this.account, tx).call({ from: defaultCaller })
  }

  async getBanned(tx){
    return await this.BBSAdmin.methods.banned(tx).call({ from: defaultCaller })
  }

  loadCommentCache(_tx) {
    const url = window.location.origin
    return fetch(`${url}/c/${_tx}.json`, { method: 'get' }).then(res => {
      return res.json()
    }).then((jsonData) => {
      return jsonData
    }).catch((error) => {
      return false
    })
  }

  async getCachedComments(tx) {
    let cacheEvents = await this.loadCommentCache(tx)
    if (!cacheEvents) return false
    const newComments = await this.getComments(tx, currentHeight*1-this.step+'')

    return [cacheEvents, newComments]
  }

  async getComments(tx, fromBlock = null) {
    if (!fromBlock) {
      const txContent = await loomWeb3.eth.getTransaction(tx)
      fromBlock = txContent.blockNumber
    }

    let events = []
    for (let start = fromBlock*1 ; start < currentHeight ; start+=(this.step+1)) {
      events = await this.mergedEvents('Replied', events, start, start+this.step)
    }

    return events.filter((event) => {return tx == event.returnValues.origin}).map(async (event) => {
      const [comment] = await Promise.all([
        this.getComment(event),
      ])

      return [comment]
    })
  }

  async getComment(event){
    const comment = new Comment(event)
    await comment.init()

    return comment
  }

  getRegisterFee(_) {
    return this.BBSPB.methods.fee().call({ from: defaultCaller })
  }

  getRegisterHistory() {
    return this.BBSPB.getPastEvents('allEvents', {fromBlock: fromBlock})
  }

  async checkIdAvailable(id) {
    // return !+(await this.BBSPB.methods.name2addr(web3.utils.fromAscii(id.toLowerCase())).call())
    try {
      // dry run is a dirty but works
      await this.BBSPB.methods.register(id).call({
        from: this.account,
        value: '0x0',
      })
      // return true
    } catch (e) {
      // dirty but worked for loom
      if (e.message.indexOf('reverted') !== -1)
        return false

      return true
    }
  }

  async registerName(id, registerFee) {
    let receipt = null
    receipt = await this.dettBBSPB.methods.register(id).send({ from: this.account })

    if (receipt.status === true)
      window.location.reload()
    // handle the error elsewhere
  }

  getMetaByAddress(account) {
    if (loom) {
      return loomProvider.getMappingAddress(account, 'eth').then(loomAddr =>{
        return loomAddr ? PostBase.getAuthorMeta(loomAddr) : ''
      })
    }

    return ''
  }

  async reply(tx, replyType, content) {
    if (![0, 1, 2].includes(+replyType))
      return alert('Wrong type of replyType.')

    if (!content.length)
      return alert('No content.')

    if (tx) {
      try {
        let receipt = null
        receipt = await this.dettBBS.methods.Reply(tx, +replyType, content).send({ from: this.account })

        if (receipt.status === true)
          window.location.reload()
      }
      catch(err){
        alert(err)
      }
    }
  }

  async post(title, content){
    if (title.length > this.titleLength)
      return alert('Title\'s length is over 40 characters.')

    const post = '[' + title + ']' + content

    try {
      let receipt = null
      receipt = await this.dettBBS.methods.Post(post).send({ from: this.account })

      if (receipt.status === true)
        window.location = '/'
    }
    catch(err){
      alert(err)
    }
  }

  async edit(tx, title, content){
    if (title.length > this.titleLength)
      return alert('Title\'s length is over 40 characters.')

    const transaction = await loomWeb3.eth.getTransaction(tx)
    if (this.account.toLowerCase() !== transaction.from.toLowerCase())
      return alert('You can not edit this article.')

    const post = '[' + title + ']' + content

    try {
      let receipt = null
      receipt = await this.dettBBS.methods.edit(tx, post).send({ from: this.account })

      if (receipt.status === true)
        window.location = '/'
    }
    catch(err){
      alert(err)
    }
  }

  async getOriginalTx(shortLink){
    const hex = this.cacheweb3.utils.padLeft(this.cacheweb3.utils.toHex(shortLink), 64)
    const tx = await this.BBSCache.methods.links(hex).call({ from: defaultCaller })
    return tx
  }

  rewardAuthor(article, value) {
    const txObj = {
      from: this.account,
      to: article.origAuthor,
      value: Web3.utils.toWei(value),
      gas: 21000,
    }


    const ok = this.confirmTx(txObj)
    if (!ok) {
      return Promise.reject(new Error('User denied to send transaction with seed.'))
    }
    

    return wWeb3.eth.sendTransaction(txObj)
  }

  isDettTx(tx){
    return [BBSContract]
            .map(x => x.toLowerCase())
            .includes(tx.toLowerCase())
  }

  confirmTx(txObj) {
    const { to, value } = txObj
    const message = `你確定要將你的 ${Web3.utils.fromWei(value)} ETH 轉帳到 ${to}？`
    return confirm(message)
  }
}

export default Dett
