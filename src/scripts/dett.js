import {awaitTx, parseText} from './utils'

let web3 = null
let loom = null
let Web3 = null

const ABIBBS = [{"constant":false,"inputs":[{"name":"origin","type":"bytes32"},{"name":"content","type":"string"}],"name":"edit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"origin","type":"bytes32"},{"name":"vote","type":"uint256"},{"name":"content","type":"string"}],"name":"Reply","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"voted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"downvotes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"upvotes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"content","type":"string"}],"name":"Post","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"content","type":"string"}],"name":"Posted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"origin","type":"bytes32"},{"indexed":false,"name":"content","type":"string"}],"name":"Edited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"origin","type":"bytes32"},{"indexed":false,"name":"vote","type":"uint256"},{"indexed":false,"name":"content","type":"string"}],"name":"Replied","type":"event"}]
const ABIBBSAdmin = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"who","type":"address"},{"name":"_isAdmin","type":"bool"}],"name":"setAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"origin","type":"bytes32"},{"name":"_banned","type":"bool"}],"name":"ban","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"banned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"category","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_category","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"origin","type":"bytes32"},{"indexed":false,"name":"banned","type":"bool"},{"indexed":false,"name":"admin","type":"address"}],"name":"Ban","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
const ABIBBSPB = [{"constant":!0,"inputs":[{"name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"_lobby","type":"address"},{"name":"_isLobby","type":"bool"}],"name":"setLobby","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"}],"name":"migrated","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"meta","type":"string"}],"name":"setMeta","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"who","type":"address"},{"name":"ref","type":"address"}],"name":"setReferrerByAddress","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[],"name":"wallet","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"who","type":"address"}],"name":"getPlayer","outputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"address"},{"name":"","type":"address"},{"name":"","type":"string"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"who","type":"address"},{"name":"amount","type":"uint256"}],"name":"addExp","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"who","type":"address"}],"name":"getLV","outputs":[{"name":"","type":"uint256"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"_tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"_fee","type":"uint256"}],"name":"setFee","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"name","type":"string"}],"name":"checkIfNameValid","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"name","type":"string"}],"name":"useAnotherName","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"bytes32"}],"name":"name2addr","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"link","type":"address"}],"name":"setLink","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"to","type":"address"},{"name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"newPlayerBook","type":"address"}],"name":"migrate","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!1,"inputs":[{"name":"who","type":"address"},{"name":"ref","type":"bytes32"}],"name":"setReferrerByName","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"isMyName","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[],"name":"fee","outputs":[{"name":"","type":"uint256"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"_wallet","type":"address"}],"name":"setWallet","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"}],"name":"players","outputs":[{"name":"name","type":"bytes32"},{"name":"names","type":"uint256"},{"name":"exp","type":"uint256"},{"name":"referrer","type":"address"},{"name":"link","type":"address"},{"name":"meta","type":"string"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"owner","type":"address"},{"name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!0,"inputs":[{"name":"","type":"address"}],"name":"isLobby","outputs":[{"name":"","type":"bool"}],"payable":!1,"stateMutability":"view","type":"function"},{"constant":!1,"inputs":[{"name":"name","type":"string"}],"name":"register","outputs":[],"payable":!0,"stateMutability":"payable","type":"function"},{"constant":!1,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":!1,"stateMutability":"nonpayable","type":"function"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"playerAddress","type":"address"},{"indexed":!0,"name":"playerName","type":"bytes32"}],"name":"SetNewName","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"_from","type":"address"},{"indexed":!0,"name":"_to","type":"address"},{"indexed":!0,"name":"_tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"_owner","type":"address"},{"indexed":!0,"name":"_approved","type":"address"},{"indexed":!0,"name":"_tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"_owner","type":"address"},{"indexed":!0,"name":"_operator","type":"address"},{"indexed":!1,"name":"_approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":!1,"inputs":[{"indexed":!0,"name":"previousOwner","type":"address"},{"indexed":!0,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
const ABICache = [{"constant":false,"inputs":[{"name":"milestone","type":"bytes32"}],"name":"addMilestone","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"clearMilestone","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"long","type":"bytes32"},{"name":"short","type":"bytes32"}],"name":"link","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"long","type":"bytes32"},{"indexed":false,"name":"short","type":"bytes32"}],"name":"Link","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"constant":true,"inputs":[],"name":"getMilestones","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"links","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]

const BBSContract = '0xc7d2db8bea4423d199814e56363e2c846f9f7aa4' // merged
const BBSAdminContract = '0x3cac4ce8b8bc359bb4dcea5ab55360f2b7242742'
const BBSPBContract = '0x04c3025df5c4afddc4df38d2c0aa589d852e76a8'
const BBSCacheContract = '0xd1fc48d20ba9b12ad0e84dec830973d8e49a96b8'

const defaultCaller = '0x7c9CB363cf3202fC3BC8CDC08daAfC8f54DD12E1'
const fromBlock = '8980840'
const titleLength = 40
const commentLength = 56
const perPageLength = 20

class PostBase {
  static getAuthorMeta(address) {
    const addr = address.toLowerCase()
    const cache = PostBase._metaCache
    if (cache.has(addr)) {
      return cache.get(addr)
    }

    const BBSPB = new web3.eth.Contract(ABIBBSPB, BBSPBContract)
    const promise = BBSPB.methods.getPlayer(address).call({ from: defaultCaller })
    .then(data => ({
      name: web3.utils.hexToUtf8(data[0]),
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
  constructor(_transaction, _log) {
    super()
    this.transaction = _transaction
    this.rawContent = web3.utils.hexToUtf8('0x' + _log.data.slice(130, -6))
    this.titleMatch = false
    this.title = this.getTitle()
    this.content = this.getContent()
    this.author = this.transaction.from
    this.origAuthor = null
    this.editTimestamps = []
  }

  async init() {
    this.block = await web3.eth.getBlock(this.transaction.blockNumber)
    this.authorMeta = await Article.getAuthorMeta(this.transaction.from)
    this.origAuthor = await loom.getOrigAddr(this.author)
    this.timestamp = this.block.timestamp * 1e3
  }

  async initEdits(edits) {
    for ( let edit of edits ){
      const _transaction = await web3.eth.getTransaction(edit.transactionHash)
      if (_transaction.from === this.author) {
        this.rawContent = edit.returnValues.content
        this.title = this.getTitle()
        this.content = this.getContent()
        let block = await web3.eth.getBlock(edit.blockNumber)
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
    this.transaction = await web3.eth.getTransaction(this.tx)
    this.author = this.transaction.from
    this.origAuthor = await loom.getOrigAddr(this.author)

    const [block, authorMeta] = await Promise.all([
      web3.eth.getBlock(this.transaction.blockNumber),
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

class Dett {
  constructor() {
    this.account = ''

    // constant
    this.fromBlock = fromBlock
    this.commentLength = commentLength
    this.titleLength = titleLength
    this.perPageLength = perPageLength
    this.loomAddr = null
    this.defaultCaller = defaultCaller
  }

  async init(_loom, _dettweb3, _Web3) {
    if (!_Web3) return console.error("Can't find Web3.")
    Web3 = _Web3
    // XXX: should it pass in only the provider?
    this.__web3Injected = _dettweb3

    loom = _loom

    this.loomAddr = loom.loomAddr
    this.account = loom.ethAddr
    web3 = new _Web3(loom.loomProvider)
    // Todo : Should be env
    // this.cacheweb3 = new _Web3(new _Web3.providers.WebsocketProvider('wss://mainnet-rpc.dexon.org/ws'))
    this.cacheweb3 = web3

    this.__contracts = this.__initContractsWith(web3)
    this.__contractsForInjectedWeb3 = this.__initContractsWith(web3)

    this.BBS = new web3.eth.Contract(ABIBBS, BBSContract) // merged
    this.BBSAdmin = new web3.eth.Contract(ABIBBSAdmin, BBSAdminContract)
    this.BBSPB = new web3.eth.Contract(ABIBBSPB, BBSPBContract)
    this.BBSCache = new this.cacheweb3.eth.Contract(ABICache, BBSCacheContract)
  }

  __initContractsWith(_web3) {
    const klass = _web3 ? _web3.eth.Contract : null
    const options = {  // STUB
      // FIXME: use custom transactionSigner to inject chain id
    }
    return {
      dettBBS: klass ? new klass(ABIBBS, BBSContract, options) : null,
      dettBBSPB: klass ? new klass(ABIBBSPB, BBSPBContract, options) : null,
    }
  }

  async setWallet(newWallet, seed) {
    if (newWallet) {
      this.dettweb3 = web3

      // TODO: unregister when changing wallet
      await loom.mapHdWallet(this.dettweb3, newWallet, seed)
      this.loomAddr = loom.loomAddr
      this.account = loom.ethAddr
      this.dettweb3.eth.defaultAccount = this.account

      web3 = new Web3(loom.loomProvider)
      this.__contracts = this.__initContractsWith(web3)
      Object.assign(this, this.__contracts)
    } else {
      this.dettweb3 = this.__web3Injected
      Object.assign(this, this.__contractsForInjectedWeb3)
    }
  }

  get wallet() {
    return this.__wallet
  }

  async getArticles({fromBlock = null, toBlock = null} = {}){
    const _fromBlock = fromBlock ? fromBlock.split('-')[0] : this.fromBlock
    const _toBlock = toBlock ? toBlock.split('-')[0] : 'latest'

    this.BBSEvents = await this.BBS.getPastEvents('Posted', {fromBlock : _fromBlock, toBlock: _toBlock})
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

  async getArticle(tx, checkEdited){
    const transaction = await web3.eth.getTransaction(tx)
    // console.log(transaction)
    const txReceipt = await web3.eth.getTransactionReceipt(tx)
    // console.log(txReceipt)
    const article = new Article(transaction, txReceipt.logs[0])
    await article.init()

    if (checkEdited) {
      this.BBSEditEvents = await this.BBS.getPastEvents('Edited', {fromBlock : this.fromBlock})
      const edits = this.BBSEditEvents.filter(event => event.returnValues.origin === tx )
      if (edits.length >0) await article.initEdits(edits)
    }

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

  async getComments(tx){
    const events = await this.BBS.getPastEvents('Replied', {fromBlock : this.fromBlock})

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
      return loom.getMapAddr(account).then(loomAddr =>{
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

    const transaction = await web3.eth.getTransaction(tx)
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

    if (this.dettweb3 != this.__web3Injected) {
      const ok = this.confirmTx(txObj)
      if (!ok) {
        return Promise.reject(new Error('User denied to send transaction with seed.'))
      }
    }

    return this.dettweb3.eth.sendTransaction(txObj)
  }

  isDettTx(tx){
    return [BBSContract]
            .map(x => x.toLowerCase())
            .includes(tx.toLowerCase())
  }

  confirmTx(txObj) {
    const { to, value } = txObj
    const message = `你確定要將你的 ${Web3.utils.fromWei(value)} DXN 轉帳到 ${to}？`
    return confirm(message)
  }
}

export default Dett
